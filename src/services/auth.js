import { loginApi, checkAuthApi, logoutApi, forgotPasswordApi, resetPasswordApi, changePasswordApi } from './api';

/**
 * Sign in admin user using Node JWT API
 */
export const signInAdmin = async (email, password) => {
  const data = await loginApi(email, password);
  return { user: data.user };
};

/**
 * Sign out admin user
 */
export const signOutAdmin = async () => {
  await logoutApi();
};

/**
 * Send password reset link to lassoconsultancy4@gmail.com — no email input needed
 */
export const resetAdminPassword = async () => {
  return await forgotPasswordApi();
};

/**
 * Complete password reset with token from email link
 */
export const completePasswordReset = async (token, newPassword) => {
  return await resetPasswordApi(token, newPassword);
};

/**
 * Change the password of the currently signed-in admin
 */
export const changeAdminPassword = async (currentPassword, newPassword) => {
  return await changePasswordApi(currentPassword, newPassword);
};

/**
 * Listen for auth state changes / restore session on load.
 *
 * The real token lives in an httpOnly cookie, invisible to JS by design —
 * so this can't just peek at it the way a localStorage token used to be
 * checked. Instead it reads the non-httpOnly `admin_session` hint cookie
 * (see server/middleware/auth.js) to skip the /auth/me round trip
 * entirely for the common case (a public visitor with no session at all),
 * while still treating the hint as advisory: a valid-looking hint still
 * goes through checkAuthApi() to confirm the actual session, since the
 * hint alone can't know if the token was revoked elsewhere (password
 * change, explicit logout on another device).
 */
export const subscribeToAuthChanges = (callback) => {
  const hasSessionHint = document.cookie
    .split('; ')
    .some((c) => c.startsWith('admin_session='));

  if (!hasSessionHint) {
    callback(null);
    return () => {};
  }

  checkAuthApi()
    .then((res) => {
      callback(res.user);
    })
    .catch(() => {
      logoutApi();
      callback(null);
    });

  return () => {};
};

/**
 * Map error messages to user-friendly text
 */
export const getFriendlyAuthError = (error) => {
  return error?.message || 'Authentication failed. Please check your credentials.';
};
