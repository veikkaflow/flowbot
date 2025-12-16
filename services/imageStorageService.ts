import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from './firebase.ts';

/**
 * Uploads an image file to Firebase Storage
 * @param file - The image file to upload
 * @param path - Storage path (e.g., 'avatars/bot123/user-avatar.jpg')
 * @returns Promise<string> - The download URL of the uploaded image
 */
export const uploadImageToStorage = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    // Create a reference to the file location in Storage
    const storageRef = ref(storage, path);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
};

/**
 * Uploads a profile avatar image to Firebase Storage
 * @param file - The image file to upload
 * @param botId - The bot ID to organize storage
 * @param avatarType - Type of avatar: 'user', 'bot', or 'agent'
 * @returns Promise<string> - The download URL of the uploaded image
 */
export const uploadAvatarImage = async (
  file: File,
  botId: string,
  avatarType: 'user' | 'bot' | 'agent'
): Promise<string> => {
  // Generate a unique filename with timestamp
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${avatarType}-avatar-${timestamp}.${fileExtension}`;
  const path = `avatars/${botId}/${fileName}`;
  
  return uploadImageToStorage(file, path);
};

/**
 * Lists all avatar images from Firebase Storage base/starter folder
 * @param avatarType - Type of avatar: 'user', 'bot', or 'agent'
 * @returns Promise<string[]> - Array of download URLs
 */
export const getStarterAvatars = async (
  avatarType: 'user' | 'bot' | 'agent'
): Promise<string[]> => {
  try {
    // Path to the base/starter folder for this avatar type
    const folderPath = `avatars/base/${avatarType}`;
    const folderRef = ref(storage, folderPath);
    
    // List all files in the folder
    const result = await listAll(folderRef);
    
    // Get download URLs for all files
    const downloadURLs = await Promise.all(
      result.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      })
    );
    
    // Sort by filename for consistent ordering
    return downloadURLs.sort();
  } catch (error) {
    console.error(`Error loading starter avatars for ${avatarType}:`, error);
    // Return empty array if folder doesn't exist or error occurs
    return [];
  }
};

/**
 * Gets all starter avatars (user, bot, agent) from Firebase Storage
 * @returns Promise with all avatar arrays
 */
export const getAllStarterAvatars = async (): Promise<{
  userAvatars: string[];
  botAvatars: string[];
  agentAvatars: string[];
}> => {
  const [userAvatars, botAvatars, agentAvatars] = await Promise.all([
    getStarterAvatars('user'),
    getStarterAvatars('bot'),
    getStarterAvatars('agent'),
  ]);
  
  return { userAvatars, botAvatars, agentAvatars };
};

