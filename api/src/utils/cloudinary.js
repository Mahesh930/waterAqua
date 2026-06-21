const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary
 * @param {string} localFilePath - Path to the local file
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
const uploadToCloudinary = async (localFilePath) => {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'aquahome/products',
      resource_type: 'auto',
      transformation: [
        { width: 600, height: 600, crop: 'pad', background: 'auto' }
      ]
    });
    logger.info(`Successfully uploaded file to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
