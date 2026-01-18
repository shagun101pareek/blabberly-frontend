import { getAuthToken } from "@/app/utils/auth";

export interface UploadMessageFileResponse {
  fileUrl: string;
  fileType: 'image' | 'pdf';
  fileName: string;
  message?: string;
}

/**
 * Upload a file (image or PDF) for a message
 * 
 * @param file - File to upload (image or PDF)
 * @param chatroomId - The ID of the chatroom
 * @param receiverId - The ID of the message receiver
 * @returns Response containing fileUrl, fileType, and fileName
 * @throws Error if upload fails
 */
export const uploadMessageFileAPI = async (
  file: File,
  chatroomId: string,
  receiverId: string
): Promise<UploadMessageFileResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Validate file type
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  
  if (!isImage && !isPDF) {
    throw new Error('File must be an image or PDF');
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chatroomId', chatroomId);
  formData.append('receiverId', receiverId);

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/messages/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Note: Don't set Content-Type header - browser will set it with boundary for FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload file');
  }

  return {
    fileUrl: data.fileUrl || data.file_url || '',
    fileType: isImage ? 'image' : 'pdf',
    fileName: data.fileName || data.file_name || file.name,
    message: data.message,
  };
};


