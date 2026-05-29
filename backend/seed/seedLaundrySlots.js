import { LaundrySlot } from '../models/LaundrySlot.js';
import { log } from '../utils/logger.js';

export async function seedLaundrySlots() {
  try {
    const existingCount = await LaundrySlot.countDocuments();
    if (existingCount > 0) {
      log.info(`Laundry slots already seeded (${existingCount} records)`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate slots for next 7 days
    const slots = [];
    const timeSlots = [
      { start: '6:00 AM', end: '7:00 AM' },
      { start: '7:00 AM', end: '8:00 AM' },
      { start: '8:00 AM', end: '9:00 AM' },
      { start: '9:00 AM', end: '10:00 AM' },
      { start: '10:00 AM', end: '11:00 AM' },
      { start: '11:00 AM', end: '12:00 PM' },
      { start: '4:00 PM', end: '5:00 PM' },
      { start: '5:00 PM', end: '6:00 PM' },
      { start: '6:00 PM', end: '7:00 PM' },
      { start: '7:00 PM', end: '8:00 PM' },
    ];

    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);

      for (const time of timeSlots) {
        for (const mode of ['free', 'paid']) {
          slots.push({
            date,
            timeStart: time.start,
            timeEnd: time.end,
            mode,
            machineId: `M${Math.floor(d / 2) + 1}`, // 3-4 machines
            capacity: 1,
            isBlocked: false,
          });
        }
      }
    }

    await LaundrySlot.insertMany(slots);
    log.info(`✓ Seeded ${slots.length} laundry slots`);
  } catch (err) {
    log.error('Failed to seed laundry slots:', err.message);
  }
}
