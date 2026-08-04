import { uploadFileApi } from '../services/api';

/**
 * Upload a file/image via Node backend API
 * @param {File} file - File object from input
 * @returns {Promise<string>} Uploaded file URL
 */
export const uploadFile = async (file) => {
  return await uploadFileApi(file);
};
