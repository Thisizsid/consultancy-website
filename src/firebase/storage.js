import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file/image to Firebase Storage
 * @param {File} file - File object from input
 * @param {string} path - Storage path folder (e.g. 'countries', 'events')
 * @returns {Promise<string>} Download URL of the uploaded file
 */
export const uploadFile = async (file, path = 'uploads') => {
  if (!file || typeof file === 'string') {
    // If it's already a URL, return it
    return file;
  }

  try {
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    
    // Upload bytes
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
};
