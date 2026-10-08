const fs = require('fs');
const path = require('path');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

const uploadToCloudinary = async (file, folder = 'chat-app') => {
  const isCloudinaryReady = configureCloudinary();

  if (isCloudinaryReady && file) {
    return new Promise((resolve, reject) => {
      const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
      
      // Upload using stream if memory buffer, or file path if stored on disk
      if (file.buffer) {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      } else if (file.path) {
        cloudinary.uploader.upload(
          file.path,
          {
            folder: folder,
            resource_type: resourceType,
          },
          (error, result) => {
            // Remove local temp file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
      } else {
        reject(new Error('Invalid file object provided for upload'));
      }
    });
  }

  // Fallback to local storage path
  if (file && file.filename) {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/uploads/${file.filename}`;
  }

  throw new Error('Upload failed: File is missing or invalid.');
};

module.exports = { uploadToCloudinary };
