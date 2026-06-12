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

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquahome';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Supplier.deleteMany();
    await Product.deleteMany();
    await CartItem.deleteMany();
    await Order.deleteMany();
    await Feedback.deleteMany();
    await Notification.deleteMany();
    await AdminCommission.deleteMany();
    await Referral.deleteMany();

    console.log('Seeding Users...');
    
    // Seed Admin
    const adminUser = await User.create({
      name: 'AquaHome Admin Manager',
      email: 'admin@aquahome.com',
      password: 'Password@123',
      phone: '9000000001',
      role: 'admin',
      pincode: '411001',
      address: 'Main Administrative Hub, Pune'
    });

    // Seed Suppliers
    const supplierUser1 = await User.create({
      name: 'Ramesh Ganga',
      email: 'supplier1@aquahome.com',
      password: 'Password@123',
      phone: '9876543210',
      role: 'supplier',
      pincode: '411001',
      address: 'Sector 5, ganga supplies'
    });

    const supplierUser2 = await User.create({
      name: 'Vikram Bisleri',
      email: 'supplier2@aquahome.com',
      password: 'Password@123',
      phone: '9876543211',
      role: 'supplier',
      pincode: '411002',
      address: 'Industrial Plot 12, Pimpri'
    });

    // Seed Customers
    const customerUser1 = await User.create({
      name: 'Mahesh Customer',
      email: 'customer1@aquahome.com',
      password: 'Password@123',
      phone: '9000000002',
      role: 'customer',
      pincode: '411001',
      address: 'Fl 402, Sunshine Apts, Pune'
    });

    const customerUser2 = await User.create({
      name: 'Neha Shinde',
      email: 'customer2@aquahome.com',
      password: 'Password@123',
      phone: '9000000003',
      role: 'customer',
      pincode: '411002',
      address: 'Rowhouse 3, Orchid Greens, Pune'
    });

    console.log('Seeding Supplier Profiles...');
    const supplierProfile1 = await Supplier.create({
      user: supplierUser1._id,
      businessName: 'Ganga Water Suppliers Ltd',
      description: 'Premium quality purified mineral drinking water delivered straight to your doorstep.',
      rating: 4.8,
      reviewCount: 24,
      isActive: true,
      deliveryCharge: 30,
      minOrder: 1,
      businessHours: { open: '07:00 AM', close: '09:00 PM' },
      serviceAreas: ['411001', '411002']
    });

    const supplierProfile2 = await Supplier.create({
      user: supplierUser2._id,
      businessName: 'Bisleri Safe Water Services',
      description: 'Authorized local Bisleri jar distributor. Pure, safe, and hygienic drinking water.',
      rating: 4.5,
      reviewCount: 15,
      isActive: true,
      deliveryCharge: 20,
      minOrder: 2,
      businessHours: { open: '08:00 AM', close: '08:00 PM' },
      serviceAreas: ['411001']
    });

    console.log('Seeding Products...');
    // Products for Supplier 1
    const p1 = await Product.create({
      supplier: supplierUser1._id,
      name: '20L Purified Water Can',
      category: '20L Can',
      price: 60,
      capacityLiters: 20,
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop',
      description: 'Fully purified chilled mineral water jar with a handle. Perfect for homes and small offices.',
      stock: 500
    });

    const p2 = await Product.create({
      supplier: supplierUser1._id,
      name: 'Premium Water Dispenser Stand',
      category: '20L Jar',
      price: 250,
      capacityLiters: 0,
      imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?q=80&w=300&auto=format&fit=crop',
      description: 'Durable plastic tabletop dispenser stand with a premium push tap.',
      stock: 50
    });

    // Products for Supplier 2
    const p3 = await Product.create({
      supplier: supplierUser2._id,
      name: 'Bisleri 20L Sealed Can',
      category: '20L Can',
      price: 90,
      capacityLiters: 20,
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop',
      description: 'Original sealed Bisleri mineral water jar. Guaranteed purity and high standard hygiene.',
      stock: 400
    });

    const p4 = await Product.create({
      supplier: supplierUser2._id,
      name: '1L Water Bottles Box (12 Pack)',
      category: 'Bottle',
      price: 180,
      capacityLiters: 12,
      imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=300&auto=format&fit=crop',
      description: 'Pack of 12 standard one-liter sealed Bisleri water bottles. Travel-friendly packaging.',
      stock: 200
    });

    console.log('Seeding complete! Database successfully populated.');
    console.log('Test Accounts:');
    console.log(`- Admin: admin@aquahome.com / Password@123`);
    console.log(`- Supplier 1: supplier1@aquahome.com / Password@123`);
    console.log(`- Supplier 2: supplier2@aquahome.com / Password@123`);
    console.log(`- Customer 1: customer1@aquahome.com / Password@123`);
    console.log(`- Customer 2: customer2@aquahome.com / Password@123`);

    mongoose.connection.close();
  } catch (error) {
    console.error(`Database seeding failed: ${error}`);
    process.exit(1);
  }
};

seedData();
