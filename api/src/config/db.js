const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aquahome');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Startup database migration for product categories
    const Product = require('../models/Product');
    const legacyCans = await Product.updateMany({ category: 'Water Can' }, { $set: { category: '20L Can' } });
    const legacyBottles = await Product.updateMany({ category: 'Water Bottle' }, { $set: { category: 'Bottle' } });
    const legacyJars = await Product.updateMany({ category: 'Dispenser' }, { $set: { category: '20L Jar' } });
    if (legacyCans.modifiedCount > 0 || legacyBottles.modifiedCount > 0 || legacyJars.modifiedCount > 0) {
      console.log(`Successfully migrated legacy product categories to new ones.`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
