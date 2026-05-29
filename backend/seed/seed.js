/**
 * Sample data for local development.
 *
 * IMPORTANT SAFETY NOTES
 * - This script used to unconditionally wipe collections (User.deleteMany({})),
 *   which can destroy real user data when run against a non-temporary database.
 * - To avoid accidental data loss, this file now supports two safe modes:
 *     - SAFE_SEED (default): insert missing demo data only (preserves existing docs)
 *     - FULL_RESET: clear collections and reseed (DESTRUCTIVE)
 * - Destructive resets require an explicit environment guard: set
 *     FORCE_SEED=true
 *   Without `FORCE_SEED=true` the script will refuse to run FULL_RESET.
 *
 * Usage examples (from backend folder):
 * - Safe seed (default):
 *     node seed/seed.js
 * - Explicit safe mode:
 *     SEED_MODE=SAFE_SEED node seed/seed.js
 * - Full destructive reset (requires forced guard):
 *     FORCE_SEED=true SEED_MODE=FULL_RESET node seed/seed.js
 *
 * DO NOT run FULL_RESET against production databases.
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
import { seedLaundrySlots } from './seedLaundrySlots.js';
import { FeeRecord } from '../models/FeeRecord.js';
import { WellbeingLog } from '../models/WellbeingLog.js';
import TimetableEntry from '../models/TimetableEntry.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel-os';
const SEED_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'PASSWORD_PLACEHOLDER';
const SEED_STUDENT_USERNAME = process.env.SEED_STUDENT_USERNAME || 'example-user';
const SEED_STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL || 'example@example.com';

async function run() {
  await mongoose.connect(MONGODB_URI);

  const MODE = process.env.SEED_MODE || 'SAFE_SEED';
  const FORCE = process.env.FORCE_SEED === 'true';

  console.log(`Connected. Seed mode: ${MODE}`);

  if (MODE === 'FULL_RESET') {
    if (!FORCE) {
      console.error('ERROR: FULL_RESET selected but FORCE_SEED !== true. Aborting to avoid data loss.');
      process.exit(2);
    }
    console.warn('WARNING: Database wipe mode enabled — running FULL_RESET');
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      FoodReview.deleteMany({}),
      MessMenu.deleteMany({}),
      Order.deleteMany({}),
      Alert.deleteMany({}),
      FeeRecord.deleteMany({}),
      WellbeingLog.deleteMany({}),
    ]);
  } else if (MODE === 'SAFE_SEED') {
    console.log('SAFE_SEED: preserving existing collections and inserting missing demo data only');
  } else {
    console.error(`Unknown SEED_MODE: ${MODE}. Supported: SAFE_SEED, FULL_RESET`);
    process.exit(2);
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  async function ensureUser({ username, email, roomNumber }) {
    const em = String(email).toLowerCase();
    const existing = await User.findOne({ email: em });
    if (existing) return existing;
    return User.create({ username, email: em, password: passwordHash, roomNumber });
  }

  const u1 = await ensureUser({ username: SEED_STUDENT_USERNAME, email: SEED_STUDENT_EMAIL, roomNumber: 'B-204' });
  const u2 = await ensureUser({ username: 'priya', email: 'priya.nair@college.edu', roomNumber: 'A-103' });

  const today = new Date().toISOString().slice(0, 10);
  if (MODE === 'FULL_RESET') {
    await MessMenu.create({
      date: today,
      breakfast: ['Idli Sambar', 'Coconut Chutney', 'Boiled Eggs', 'Tea / Coffee'],
      lunch: ['Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Roti', 'Raita'],
      snacks: ['Vada Pav', 'Tea', 'Biscuits'],
      dinner: ['Rice', 'Rajma', 'Mixed Veg', 'Roti', 'Halwa'],
    });
  } else {
    const existingMenu = await MessMenu.findOne({ date: today });
    if (!existingMenu) {
      await MessMenu.create({
        date: today,
        breakfast: ['Idli Sambar', 'Coconut Chutney', 'Boiled Eggs', 'Tea / Coffee'],
        lunch: ['Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Roti', 'Raita'],
        snacks: ['Vada Pav', 'Tea', 'Biscuits'],
        dinner: ['Rice', 'Rajma', 'Mixed Veg', 'Roti', 'Halwa'],
      });
    } else {
      console.log('MessMenu for today already exists — skipping');
    }
  }

  let c1;
  if (MODE === 'FULL_RESET') {
    c1 = await Complaint.create({
      userId: u1._id,
      category: 'Water',
      title: 'Water leakage in bathroom',
      description: 'Minor leak under sink',
      priority: 'high',
      status: 'pending',
      roomHint: 'B-204',
    });
    await User.findByIdAndUpdate(u1._id, { $push: { complaints: c1._id } });
  } else {
    c1 = await Complaint.findOne({ userId: u1._id, title: 'Water leakage in bathroom' });
    if (!c1) {
      c1 = await Complaint.create({
        userId: u1._id,
        category: 'Water',
        title: 'Water leakage in bathroom',
        description: 'Minor leak under sink',
        priority: 'high',
        status: 'pending',
        roomHint: 'B-204',
      });
      await User.findByIdAndUpdate(u1._id, { $push: { complaints: c1._id } });
    } else {
      console.log('Sample complaint exists — skipping');
    }
  }

  async function ensureFoodReview({ userId, foodItem, rating, comment, tags = [] }) {
    const exists = await FoodReview.findOne({ userId, foodItem, comment });
    if (exists) return exists;
    return FoodReview.create({ userId, foodItem, rating, comment, tags });
  }

  await ensureFoodReview({ userId: u1._id, foodItem: 'Paneer Butter Masala', rating: 5, comment: 'Excellent', tags: ['Excellent taste'] });
  await ensureFoodReview({ userId: u2._id, foodItem: 'Paneer Butter Masala', rating: 4, comment: 'Good', tags: [] });
  await ensureFoodReview({ userId: u1._id, foodItem: 'Evening Snacks', rating: 2, comment: 'Cold vada', tags: ['Undercooked'] });

  const existingAlert = await Alert.findOne({ title: 'Sample alert' });
  if (!existingAlert) {
    await Alert.create({
      type: 'general',
      title: 'Sample alert',
      message: 'Seed data loaded. Configure SEED_STUDENT_PASSWORD and ADMIN_PASSWORD for local setup.',
      resolved: false,
    });
  } else {
    console.log('Sample alert exists — skipping');
  }

  async function ensureFee(record) {
    const exists = await FeeRecord.findOne({ userId: record.userId, semester: record.semester });
    if (exists) return exists;
    return FeeRecord.create(record);
  }

  async function ensureDemoFeePackage(user) {
    const existingCount = await FeeRecord.countDocuments({ userId: user._id });
    if (existingCount > 0) return;

    const now = Date.now();
    const dueSoon = new Date(now + 10 * 86400000);
    const overdue = new Date(now - 6 * 86400000);
    const paidAt = new Date(now - 32 * 86400000);

    await ensureFee({
      userId: user._id,
      semester: 'Odd Semester 2025',
      amount: 18000,
      status: 'pending',
      dueDate: dueSoon,
      notes: 'Hostel fee installment',
    });
    await ensureFee({
      userId: user._id,
      semester: 'Laundry & Mess Charges',
      amount: 4200,
      status: 'paid',
      dueDate: overdue,
      paidAt,
      method: 'UPI',
      transactionId: `SEED-FEE-${String(user.username || 'USER').toUpperCase().slice(0, 6)}-001`,
      notes: 'Laundry + mess split for demo',
    });
    await ensureFee({
      userId: user._id,
      semester: 'Late Fine',
      amount: 300,
      status: 'overdue',
      dueDate: overdue,
      notes: 'Late checkout penalty',
    });
  }

  async function ensureDemoTimetable() {
    const rows = [
      { day: 'Mon', subject: 'Data Structures', time: '8:00 - 9:00', room: 'LH-201', faculty: 'Dr. Kumar', type: 'lecture', order: 1 },
      { day: 'Mon', subject: 'DBMS Lab', time: '10:00 - 12:00', room: 'CL-103', faculty: 'Dr. Priya', type: 'lab', order: 2 },
      { day: 'Tue', subject: 'Operating Systems', time: '9:00 - 10:00', room: 'LH-202', faculty: 'Dr. Rao', type: 'lecture', order: 1 },
      { day: 'Tue', subject: 'Software Engineering', time: '11:00 - 12:00', room: 'LH-101', faculty: 'Dr. Nair', type: 'lecture', order: 2 },
      { day: 'Wed', subject: 'Computer Networks', time: '8:00 - 9:00', room: 'LH-301', faculty: 'Dr. Singh', type: 'lecture', order: 1 },
      { day: 'Wed', subject: 'Mini Project', time: '2:00 - 4:00', room: 'PL-102', faculty: 'Dr. Meera', type: 'project', order: 2 },
      { day: 'Thu', subject: 'DBMS', time: '9:00 - 10:00', room: 'LH-202', faculty: 'Dr. Priya', type: 'lecture', order: 1 },
      { day: 'Thu', subject: 'DSA Lab', time: '3:00 - 5:00', room: 'CL-201', faculty: 'Dr. Kumar', type: 'lab', order: 2 },
      { day: 'Fri', subject: 'Elective: AI/ML', time: '10:00 - 11:00', room: 'LH-203', faculty: 'Dr. Rao', type: 'seminar', order: 1 },
    ];

    for (const row of rows) {
      const exists = await TimetableEntry.findOne({ day: row.day, subject: row.subject, time: row.time });
      if (!exists) {
        await TimetableEntry.create(row);
      }
    }
  }

  await ensureFee({
    userId: u1._id,
    semester: 'Odd Semester 2025',
    amount: 18000,
    status: 'pending',
    dueDate: new Date(Date.now() + 10 * 86400000),
    notes: 'Hostel maintenance and mess charges',
  });
  await ensureFee({
    userId: u1._id,
    semester: 'Summer 2025',
    amount: 6000,
    status: 'paid',
    dueDate: new Date(Date.now() - 40 * 86400000),
    paidAt: new Date(Date.now() - 32 * 86400000),
    method: 'UPI',
    transactionId: 'SEED-FEE-001',
    notes: 'Paid during onboarding',
  });
  await ensureFee({
    userId: u2._id,
    semester: 'Odd Semester 2025',
    amount: 18000,
    status: 'overdue',
    dueDate: new Date(Date.now() - 6 * 86400000),
    notes: 'Pending hostel fee',
  });

  async function ensureWellbeing(log) {
    const exists = await WellbeingLog.findOne({ userId: log.userId, kind: log.kind, visitDate: log.visitDate });
    if (exists) return exists;
    return WellbeingLog.create(log);
  }

  await ensureWellbeing({ userId: u1._id, kind: 'counselling', mood: 'good', stressLevel: 2, notes: 'Feeling focused after meeting with mentor', visitDate: new Date(Date.now() - 1 * 86400000) });
  await ensureWellbeing({ userId: u1._id, kind: 'health', mood: 'okay', stressLevel: 3, notes: 'Mild headache, resting well', visitDate: new Date(Date.now() - 3 * 86400000) });
  await ensureWellbeing({ userId: u2._id, kind: 'general', mood: 'low', stressLevel: 4, notes: 'Exam pressure', visitDate: new Date(Date.now() - 2 * 86400000) });

  if (MODE === 'SAFE_SEED') {
    const allUsers = await User.find({}).select('_id username email');
    for (const user of allUsers) {
      await ensureDemoFeePackage(user);
    }
    await ensureDemoTimetable();
  }

  // Seed laundry slots
  await seedLaundrySlots();

  console.log('Seed complete.');
  console.log('Admin login: username admin, password PASSWORD_PLACEHOLDER');
  console.log('Student login: username example-user or email example@example.com, password PASSWORD_PLACEHOLDER');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
