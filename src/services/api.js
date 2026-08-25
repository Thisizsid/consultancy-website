const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Base fetch wrapper with auth header & error handling
 */
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('lasso_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
};

// --- AUTH API ---
export const loginApi = async (email, password) => {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) {
    localStorage.setItem('lasso_admin_token', res.token);
  }
  return res;
};

export const checkAuthApi = async () => {
  return await apiRequest('/auth/me');
};

export const logoutApi = async () => {
  try {
    // Best-effort: invalidates the token server-side (bumps token_version)
    // so it can't be reused even if it leaked. If this fails — token
    // already expired/revoked, offline, etc — still clear the local copy.
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — the local token is removed either way below.
  } finally {
    localStorage.removeItem('lasso_admin_token');
  }
};

export const forgotPasswordApi = async () => {
  return await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({}),
  });
};

export const resetPasswordApi = async (token, newPassword) => {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
};

export const changePasswordApi = async (currentPassword, newPassword) => {
  return await apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// --- FILE UPLOAD API ---
export const uploadFileApi = async (file) => {
  if (!file || typeof file === 'string') {
    return file;
  }

  const token = localStorage.getItem('lasso_admin_token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload file');
  }

  return data.url;
};

// --- COLLECTION CRUD API ---
export const getAllDocuments = async (collectionName) => {
  return await apiRequest(`/collections/${collectionName}`);
};

export const getDocument = async (collectionName, id) => {
  return await apiRequest(`/collections/${collectionName}/${id}`);
};

export const getCountryBySlug = async (slug) => {
  return await apiRequest(`/collections/countries/slug/${slug}`);
};

export const createDocument = async (collectionName, data) => {
  return await apiRequest(`/collections/${collectionName}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateDocument = async (collectionName, id, data) => {
  return await apiRequest(`/collections/${collectionName}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteDocument = async (collectionName, id) => {
  return await apiRequest(`/collections/${collectionName}/${id}`, {
    method: 'DELETE',
  });
};
