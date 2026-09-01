import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import { generateToken, verifyTokenMiddleware, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { getDb } from '../config/db.js';
import { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// --- Email (Resend) ---
// Previously nodemailer over SMTP — Railway's network blocks or badly
// throttles outbound SMTP, so sends hung until Railway's own proxy timeout
// cut the connection first, leaving the client parsing an empty response
// instead of a real error. Resend sends over plain HTTPS, which PaaS
// platforms don't restrict, and the free tier needs no domain verification
// to send from its default `onboarding@resend.dev` sender.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'Lasso Consultancy <onboarding@resend.dev>';

// An HTTP call can still hang (DNS, a dropped connection, ...) — this is
// exactly the failure mode above, just less likely over HTTPS than SMTP.
// Keep the same hard cap so a stuck send still fails fast with clean JSON
// instead of leaving the platform's proxy to cut it off first.
const MAIL_TIMEOUT_MS = 10000;
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);

/**
 * POST /api/auth/login
 * Validates credentials from admin_users table
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();

    db.get(
      `SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)`,
      [email.trim()],
      async (err, adminUser) => {
        if (err) {
          console.error('DB error during login:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!adminUser) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = {
          uid: adminUser.id,
          email: adminUser.email,
          role: 'admin',
        };

        const token = generateToken({ ...user, tokenVersion: adminUser.token_version || 0 });
        // The token now lives only in an httpOnly cookie, never in the
        // response body — keeps it out of reach of any JS on the page
        // (devtools, an XSS bug, a careless console.log of the response).
        setAuthCookie(res, token);
        return res.json({ user });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Validates current JWT token
 */
router.get('/me', verifyTokenMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Bumping token_version makes logout actually revoke the token
 * server-side, immediately — for this session and any other outstanding
 * one for the same account — rather than leaving it valid until its
 * natural expiry. clearAuthCookie removes it from the browser too.
 */
router.post('/logout', verifyTokenMiddleware, (req, res) => {
  const db = getDb();
  db.run(
    `UPDATE admin_users SET token_version = token_version + 1 WHERE id = ?`,
    [req.user.uid],
    (err) => {
      if (err) {
        console.error('Logout token invalidation failed:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      clearAuthCookie(res);
      return res.json({ message: 'Logged out' });
    }
  );
});

/**
 * POST /api/auth/forgot-password
 * No email input needed — auto-finds the admin user and sends reset link
 * to the hardcoded notification email (lassoconsultancy4@gmail.com)
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const db = getDb();
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'lassoconsultancy4@gmail.com';

  // Fetch the first (and only) admin user automatically
  db.get(`SELECT * FROM admin_users LIMIT 1`, async (err, adminUser) => {
    if (err || !adminUser) {
      return res.status(500).json({ error: 'No admin account found. Please contact support.' });
    }

    // Generate secure token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Housekeeping: drop used or expired tokens so this table stays bounded
    db.run(`DELETE FROM reset_tokens WHERE used = 1 OR expires_at <= ?`, [new Date().toISOString()]);

    db.run(
      `INSERT INTO reset_tokens (token, email, expires_at) VALUES (?, ?, ?)`,
      [token, adminUser.email, expiresAt],
      async (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to generate reset token' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/admin/reset-password?token=${token}`;

        if (resend) {
          try {
            const { error: sendError } = await withTimeout(
              resend.emails.send({
                from: RESEND_FROM,
                to: notificationEmail,
                subject: 'Admin Password Reset Link',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <h2 style="color: #1e3a5f; margin: 0;">Password Reset Request</h2>
                      <p style="color: #6b7280; margin-top: 8px;">Lasso International Education Consultancy</p>
                    </div>
                    <p style="color: #374151;">A password reset was requested for the admin account.</p>
                    <p style="color: #374151;">Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${resetLink}"
                         style="display:inline-block; padding:14px 32px; background:#d4a853; color:#fff;
                                border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px;">
                      Or copy and paste this link into your browser:<br/>
                      <a href="${resetLink}" style="color:#d4a853; word-break:break-all;">${resetLink}</a>
                    </p>
                    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;"/>
                    <p style="color:#9ca3af; font-size:11px; text-align:center;">
                      If you did not request this, you can safely ignore this email.
                    </p>
                  </div>
                `,
              }),
              MAIL_TIMEOUT_MS
            );
            if (sendError) {
              throw new Error(sendError.message || 'Resend API returned an error');
            }
            console.log(`Password reset email sent via Resend to: ${notificationEmail}`);
          } catch (emailErr) {
            console.error('Email send failed:', emailErr.message);
            // Fallback: log link to console
            console.log(`\nEmail failed. Reset link:\n${resetLink}\n`);
            return res.status(500).json({ error: 'Failed to send reset email. Check RESEND_API_KEY configuration.' });
          }
        } else {
          // Dev mode — print link to console
          console.log(`\nRESEND_API_KEY not configured. Password reset link:\n${resetLink}\n`);
        }

        return res.json({ message: `Reset link sent to ${notificationEmail}. Check your inbox.` });
      }
    );
  });
});

/**
 * POST /api/auth/reset-password
 * Validates reset token and updates password
 */
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const now = new Date().toISOString();

  db.get(
    `SELECT * FROM reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?`,
    [token, now],
    async (err, resetToken) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new one.' });
      }

      // Hash the new password
      const hash = await bcrypt.hash(newPassword, 12);

      // Update password. token_version increments so any token issued
      // before this reset — including one an attacker may have stolen — is
      // rejected by verifyTokenMiddleware from this point on.
      db.run(
        `UPDATE admin_users SET password_hash = ?, token_version = token_version + 1 WHERE LOWER(email) = LOWER(?)`,
        [hash, resetToken.email],
        function (updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Failed to update password' });
          }

          // Mark token as used
          db.run(`UPDATE reset_tokens SET used = 1 WHERE token = ?`, [token]);

          console.log(`Password reset for: ${resetToken.email}`);
          return res.json({ message: 'Password updated successfully. You can now log in.' });
        }
      );
    }
  );
});

/**
 * PUT /api/auth/change-password
 * Change password while logged in (requires JWT)
 */
router.put('/change-password', verifyTokenMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const db = getDb();

  db.get(
    `SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)`,
    [req.user.email],
    async (err, adminUser) => {
      if (err || !adminUser) {
        return res.status(500).json({ error: 'Failed to find admin user' });
      }

      const match = await bcrypt.compare(currentPassword, adminUser.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hash = await bcrypt.hash(newPassword, 12);
      // token_version increments so the token used to make *this* request
      // is itself invalidated — changing your password logs every session
      // out, this one included, rather than leaving old tokens usable.
      db.run(
        `UPDATE admin_users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`,
        [hash, adminUser.id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: 'Failed to update password' });
          }
          // The token_version bump above already invalidated this cookie
          // server-side — clear it from the browser too, or it lingers
          // (harmlessly, since verifyTokenMiddleware now rejects it) until
          // its natural 24h expiry. The client logs out right after this
          // call anyway; this just makes that immediate instead of eventual.
          clearAuthCookie(res);
          return res.json({ message: 'Password changed successfully' });
        }
      );
    }
  );
});

export default router;
