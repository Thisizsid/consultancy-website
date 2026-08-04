import {
  getAllDocuments as apiGetAll,
  getDocument as apiGetDoc,
  getCountryBySlug as apiGetCountryBySlug,
  createDocument as apiCreateDoc,
  updateDocument as apiUpdateDoc,
  deleteDocument as apiDeleteDoc,
} from '../services/api';

/**
 * Fetch all documents in a collection
 */
export const getAllDocuments = async (colName) => {
  return await apiGetAll(colName);
};

/**
 * Fetch a single document by ID
 */
export const getDocument = async (colName, docId) => {
  return await apiGetDoc(colName, docId);
};

/**
 * Fetch a country document by slug
 */
export const getCountryBySlug = async (slug) => {
  return await apiGetCountryBySlug(slug);
};

/**
 * Create a new document
 */
export const createDocument = async (colName, data) => {
  return await apiCreateDoc(colName, data);
};

/**
 * Update a document
 */
export const updateDocument = async (colName, docId, data) => {
  return await apiUpdateDoc(colName, docId, data);
};

/**
 * Delete a document
 */
export const deleteDocument = async (colName, docId) => {
  return await apiDeleteDoc(colName, docId);
};
