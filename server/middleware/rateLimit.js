import rateLimit from 'express-rate-limit';

const json = (message) => (req, res) => res.status(429).json({ error: message });

/**
 * Login: the admin password is the only credential guarding the whole CMS,
 * so unlimited guesses must not be possible.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the cap
  handler: json('Too many login attempts. Please try again in 15 minutes.'),
});

/**
 * Forgot-password takes no input and sends mail to a fixed address, so an
 * unthrottled endpoint is an open relay for spamming that inbox and burning
 * the SMTP quota.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many password reset requests. Please try again later.'),
});

/**
 * Applying a reset token — throttled so tokens cannot be guessed in bulk.
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many reset attempts. Please try again later.'),
});

/**
 * Public enquiry / contact form submissions — prevents lead-table flooding.
 */
export const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many submissions from this network. Please try again later.'),
});

/**
 * Broad backstop for everything else.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many requests. Please slow down.'),
});
