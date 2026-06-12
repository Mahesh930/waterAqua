const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const AdminCommission = require('../models/AdminCommission');
const Referral = require('../models/Referral');

// Load env variables
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const cleanup = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquahome';
    console.log(`Connecting to database for cleanup: ${mongoUri.substring(0, 30)}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!\n');

    // Find admin user(s) to preserve
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin user(s) to preserve:`);
    adminUsers.forEach(u => console.log(`  - ${u.name} (${u.email})`));

    // Clear all collections except admin users
    console.log('\n--- Cleaning collections ---');

    const supplierCount = await Supplier.countDocuments();
    await Supplier.deleteMany();
    console.log(`✓ Suppliers: deleted ${supplierCount} records`);

    const productCount = await Product.countDocuments();
    await Product.deleteMany();
    console.log(`✓ Products: deleted ${productCount} records`);

    const cartCount = await CartItem.countDocuments();
    await CartItem.deleteMany();
    console.log(`✓ CartItems: deleted ${cartCount} records`);

    const orderCount = await Order.countDocuments();
    await Order.deleteMany();
    console.log(`✓ Orders: deleted ${orderCount} records`);

    const feedbackCount = await Feedback.countDocuments();
    await Feedback.deleteMany();
    console.log(`✓ Feedback: deleted ${feedbackCount} records`);

    const notifCount = await Notification.countDocuments();
    await Notification.deleteMany();
    console.log(`✓ Notifications: deleted ${notifCount} records`);

    const commissionCount = await AdminCommission.countDocuments();
    await AdminCommission.deleteMany();
    console.log(`✓ AdminCommissions: deleted ${commissionCount} records`);

    const referralCount = await Referral.countDocuments();
    await Referral.deleteMany();
    console.log(`✓ Referrals: deleted ${referralCount} records`);

    // Delete all non-admin users
    const nonAdminCount = await User.countDocuments({ role: { $ne: 'admin' } });
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✓ Users (non-admin): deleted ${nonAdminCount} records`);

    // Also try AuditLog if it exists
    try {
      const AuditLog = require('../models/AuditLog');
      const auditCount = await AuditLog.countDocuments();
      await AuditLog.deleteMany();
      console.log(`✓ AuditLogs: deleted ${auditCount} records`);
    } catch (e) {
      // AuditLog model may not exist, skip
    }

    // Final summary
    const remainingUsers = await User.find();
    console.log(`\n--- Cleanup complete! ---`);
    console.log(`Remaining users in database: ${remainingUsers.length}`);
    remainingUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`));

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Cleanup failed: ${error}`);
    process.exit(1);
  }
};

cleanup();
