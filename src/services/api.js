const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Base fetch wrapper with auth cookie & error handling.
 *
 * `credentials: 'include'` is what makes the browser attach the httpOnly
 * admin_token cookie (and let the server's Set-Cookie respond be honored)
 * even when the API is on a different origin/port than the frontend, as in
 * local dev (5173 vs 5000) — without it, cross-origin fetches never send or
 * accept cookies regardless of the server's CORS config.
 */
const apiRequest = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(`${API_BASE}${url}`, config);

  // A response with no/non-JSON body (e.g. an empty body from a proxy that
  // timed out and cut the connection before the server replied, or an HTML
  // error page from an intermediary) would otherwise surface as a cryptic
  // "Unexpected end of JSON input" with no indication of what actually
  // failed. Surface something the user — and whoever's debugging — can act on.
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}). ` +
      'It may have timed out or is temporarily unavailable — please try again.'
    );
  }

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
};

// --- AUTH API ---
// The token itself now lives only in an httpOnly cookie the server sets on
// login and clears on logout — never in a JS-readable form (no
// localStorage, no response body), so there's nothing for these to store
// or clear client-side beyond the request itself.
export const loginApi = async (email, password) => {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const checkAuthApi = async () => {
  return await apiRequest('/auth/me');
};

export const logoutApi = async () => {
  // Best-effort: invalidates the token server-side (bumps token_version)
  // and clears the cookie. If this fails — token already
  // expired/revoked, offline, etc — the caller still treats the session as
  // ended locally regardless.
  await apiRequest('/auth/logout', { method: 'POST' });
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

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
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

export const getDocumentBySlug = async (collectionName, slug) => {
  return await apiRequest(`/collections/${collectionName}/slug/${encodeURIComponent(slug)}`);
};

export const getCountryBySlug = async (slug) => getDocumentBySlug('countries', slug);

export const getServiceBySlug = async (slug) => getDocumentBySlug('services', slug);

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
