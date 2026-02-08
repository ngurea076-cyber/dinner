import dotenv from 'dotenv';
dotenv.config();

import connectToDatabase from './mongodb.js';
import User from './models/User.js';

async function seedAdmin() {
  try {
    await connectToDatabase();

    const adminEmail = 'admin@bidiigirlsprogramme.org';
    const adminPassword = 'Admin@123'; // In production, hash this

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();