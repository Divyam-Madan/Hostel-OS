/**
 * Sample data for local development. Run: npm run seed (from backend folder).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { FoodReview } from '../models/FoodReview.js';
import { MessMenu } from '../models/MessMenu.js';
import { Order } from '../models/Order.js';
import { Alert } from '../models/Alert.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel-os';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing collections…');
  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    FoodReview.deleteMany({}),
    MessMenu.deleteMany({}),
    Order.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Student123!', 12);
  const u1 = await User.create({
    username: 'arjun',
    email: 'arjun.sharma@college.edu',
    password: passwordHash,
    roomNumber: 'B-204',
  });
  const u2 = await User.create({
    username: 'priya',
    email: 'priya.nair@college.edu',
    password: passwordHash,
    roomNumber: 'A-103',
  });

  const today = new Date().toISOString().slice(0, 10);
  await MessMenu.create({
    date: today,
    breakfast: ['Idli Sambar', 'Coconut Chutney', 'Boiled Eggs', 'Tea / Coffee'],
    lunch: ['Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Roti', 'Raita'],
    snacks: ['Vada Pav', 'Tea', 'Biscuits'],
    dinner: ['Rice', 'Rajma', 'Mixed Veg', 'Roti', 'Halwa'],
  });

  const c1 = await Complaint.create({
    userId: u1._id,
    category: 'Water',
    title: 'Water leakage in bathroom',
    description: 'Minor leak under sink',
    priority: 'high',
    status: 'pending',
    roomHint: 'B-204',
  });
  await User.findByIdAndUpdate(u1._id, { $push: { complaints: c1._id } });

  await FoodReview.create({
    userId: u1._id,
    foodItem: 'Paneer Butter Masala',
    rating: 5,
    comment: 'Excellent',
    tags: ['Excellent taste'],
  });
  await FoodReview.create({
    userId: u2._id,
    foodItem: 'Paneer Butter Masala',
    rating: 4,
    comment: 'Good',
    tags: [],
  });
  await FoodReview.create({
    userId: u1._id,
    foodItem: 'Evening Snacks',
    rating: 2,
    comment: 'Cold vada',
    tags: ['Undercooked'],
  });

  await Alert.create({
    type: 'general',
    title: 'Sample alert',
    message: 'Seed data loaded. Admin: admin / admin123. Student: arjun / Student123!',
    resolved: false,
  });

  console.log('Seed complete.');
  console.log('Admin login: username admin, password admin123');
  console.log('Student login: username arjun or email arjun.sharma@college.edu, password Student123!');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
