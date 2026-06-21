const requiredEnv = [
  'JWT_SECRET',
  'MONGODB_URI',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

module.exports = () => {
  const missing = [];
  for (const env of requiredEnv) {
    if (!process.env[env]) {
      missing.push(env);
    }
  }

  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '---------------------------------------------------------');
    console.error('\x1b[31m%s\x1b[0m', 'FATAL STARTUP ERROR: Missing required environment variables:');
    missing.forEach(env => {
      console.error('\x1b[31m%s\x1b[0m', `  - ${env}`);
    });
    console.error('\x1b[31m%s\x1b[0m', 'Please check your api/.env file.');
    console.error('\x1b[31m%s\x1b[0m', '---------------------------------------------------------');
    process.exit(1);
  }
};
