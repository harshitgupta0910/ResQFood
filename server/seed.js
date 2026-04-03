require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Organization = require('./models/Organization');
const FoodListing = require('./models/FoodListing');
const Claim = require('./models/Claim');
const Complaint = require('./models/Complaint');
const Pickup = require('./models/Pickup');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await FoodListing.deleteMany({});
    await Claim.deleteMany({});
    await Complaint.deleteMany({});
    await Pickup.deleteMany({});

    // Create organizations
    const ngoOrg = await Organization.create({
      name: 'Hope Foundation',
      type: 'ngo',
      address: '123 Charity Lane, Mumbai',
      geo: { type: 'Point', coordinates: [72.8777, 19.0760] },
      capacity: 500,
      needLevel: 8,
      verifiedStatus: 'verified',
      contactEmail: 'hope@example.com',
    });

    const restaurantOrg = await Organization.create({
      name: 'Green Kitchen',
      type: 'restaurant',
      address: '456 Food Street, Mumbai',
      geo: { type: 'Point', coordinates: [72.8300, 19.0176] },
      capacity: 200,
      verifiedStatus: 'verified',
      contactEmail: 'green@example.com',
    });

    // Create users (password will be hashed by pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91-9999999999',
      isVerified: true,
      location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Mumbai, India' },
    });

    const donor = await User.create({
      name: 'Rahul Sharma',
      email: 'donor@resqfood.com',
      password: 'donor123',
      role: 'donor',
      phone: '+91-9888888888',
      isVerified: true,
      organizationId: restaurantOrg._id,
      location: { type: 'Point', coordinates: [72.8300, 19.0176], address: '456 Food Street, Mumbai' },
    });

    const ngo = await User.create({
      name: 'Priya Patel',
      email: 'ngo@resqfood.com',
      password: 'ngo12345',
      role: 'ngo',
      phone: '+91-9777777777',
      isVerified: true,
      organizationId: ngoOrg._id,
      location: { type: 'Point', coordinates: [72.8777, 19.0760], address: '123 Charity Lane, Mumbai' },
    });

    // Create sample food listings
    const listings = await FoodListing.create([
      {
        donorId: donor._id,
        title: 'Fresh Vegetable Biryani',
        description: 'Freshly prepared vegetable biryani from lunch service. Still warm and packed in containers.',
        quantity: 50,
        unit: 'servings',
        category: 'cooked_meals',
        condition: 'fresh',
        geo: { type: 'Point', coordinates: [72.8300, 19.0176] },
        address: '456 Food Street, Mumbai',
        expiryAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        readyAt: new Date(),
        status: 'available',
      },
      {
        donorId: donor._id,
        title: 'Assorted Fruits Basket',
        description: 'Mix of apples, bananas, and oranges. Slightly overripe but perfectly edible.',
        quantity: 20,
        unit: 'kg',
        category: 'fruits',
        condition: 'near_expiry',
        geo: { type: 'Point', coordinates: [72.8300, 19.0176] },
        address: '456 Food Street, Mumbai',
        expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        readyAt: new Date(),
        status: 'available',
      },
      {
        donorId: donor._id,
        title: 'Bread and Bakery Items',
        description: 'Day-old bread rolls, buns, and pastries from our bakery section.',
        quantity: 30,
        unit: 'items',
        category: 'bakery',
        condition: 'near_expiry',
        geo: { type: 'Point', coordinates: [72.8300, 19.0176] },
        address: '456 Food Street, Mumbai',
        expiryAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        readyAt: new Date(),
        status: 'available',
      },
    ]);

    console.log('\n✅ Seed data created successfully!\n');
    console.log('Test Accounts:');
    console.log('─────────────────────────────────');
    console.log('Admin:     admin@gmail.com / Admin@123');
    console.log('Donor:     donor@resqfood.com / donor123');
    console.log('NGO:       ngo@resqfood.com / ngo12345');
    console.log('─────────────────────────────────');
    console.log(`Created ${listings.length} sample listings\n`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
