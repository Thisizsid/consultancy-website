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
 * Listen for auth state changes / restore session on load
 */
export const subscribeToAuthChanges = (callback) => {
  const token = localStorage.getItem('lasso_admin_token');
  if (!token) {
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
