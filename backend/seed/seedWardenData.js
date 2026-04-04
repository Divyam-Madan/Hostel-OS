/**
 * Optional seed for HostelEvent + WellbeingLog when collections are empty.
 * Run: node seed/seedWardenData.js (from backend directory)
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HostelEvent } from '../models/HostelEvent.js';
import { WellbeingLog } from '../models/WellbeingLog.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const now = Date.now();
  const users = await User.find().select('_id').limit(20).lean();
  const userIds = users.map((u) => u._id);

  if ((await HostelEvent.countDocuments()) === 0) {
    await HostelEvent.insertMany([
      {
        title: 'Inter-Hostel Hackathon 2026',
        description: '48-hour build sprint · teams of 4',
        venue: 'Main Auditorium',
        startsAt: new Date(now + 86400000 * 7),
        endsAt: new Date(now + 86400000 * 9),
        isActive: true,
        registrations: userIds.slice(0, 8).map((userId, i) => ({
          userId,
          registeredAt: new Date(now - i * 3600000),
        })),
      },
      {
        title: 'Mess Committee Feedback Session',
        description: 'Open forum with warden',
        venue: 'Block A Common Room',
        startsAt: new Date(now + 86400000 * 3),
        endsAt: new Date(now + 86400000 * 3 + 7200000),
        isActive: true,
        registrations: userIds.slice(0, 4).map((userId, i) => ({
          userId,
          registeredAt: new Date(now - i * 7200000),
        })),
      },
      {
        title: 'Indoor Cricket League',
        description: 'Knockout tournament',
        venue: 'Sports Complex',
        startsAt: new Date(now - 86400000 * 2),
        endsAt: new Date(now + 86400000 * 14),
        isActive: true,
        registrations: userIds.slice(0, 12).map((userId, i) => ({
          userId,
          registeredAt: new Date(now - i * 1800000),
        })),
      },
    ]);
    console.log('Seeded HostelEvent documents');
  }

  if ((await WellbeingLog.countDocuments()) === 0 && userIds.length) {
    const logs = [];
    for (let i = 0; i < Math.min(15, userIds.length * 2); i += 1) {
      const uid = userIds[i % userIds.length];
      logs.push({
        userId: uid,
        kind: i % 3 === 0 ? 'health' : 'counselling',
        visitDate: new Date(now - i * 2 * 86400000),
        notes: 'Routine follow-up',
      });
    }
    await WellbeingLog.insertMany(logs);
    console.log('Seeded WellbeingLog documents');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
