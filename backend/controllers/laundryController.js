import { LaundrySlot } from '../models/LaundrySlot.js';
import { LaundryBooking } from '../models/LaundryBooking.js';
import { emitAdminStatsUpdate, emitLaundryUpdate } from '../services/socketService.js';
import { parseAndValidateDate } from '../utils/validators.js';

const DEFAULT_TIME_SLOTS = [
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

async function ensureLaundrySlotsForDate(dateObj, mode) {
  const nextDay = new Date(dateObj);
  nextDay.setDate(nextDay.getDate() + 1);
  const existingCount = await LaundrySlot.countDocuments({ date: { $gte: dateObj, $lt: nextDay }, mode });
  if (existingCount > 0) return;

  const slots = DEFAULT_TIME_SLOTS.map((time, index) => ({
    date: dateObj,
    timeStart: time.start,
    timeEnd: time.end,
    mode,
    machineId: `M${(index % 3) + 1}`,
    capacity: 1,
    isBlocked: false,
  }));

  await LaundrySlot.insertMany(slots);
  emitLaundryUpdate({ action: 'created', created: slots.length, date: dateObj, mode });
}

function serializeSlot(slot, extra = {}) {
  const id = slot.id || slot._id?.toString?.() || String(slot._id || '');
  return {
    ...slot,
    ...extra,
    id,
  };
}

// ─── STUDENT ENDPOINTS ───

export async function getSlots(req, res, next) {
  try {
    const { date, mode } = req.query;

    // Validate inputs
    if (!date || !mode) {
      return res.status(400).json({ message: 'Missing date or mode parameter' });
    }
    if (!['free', 'paid'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode. Must be "free" or "paid"' });
    }

    // Parse and validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Normalize date to start of day
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Fetch all slots for the date and mode
    const slots = await LaundrySlot.find({
      date: { $gte: dateObj, $lt: nextDay },
      mode,
      isBlocked: false,
    })
      .sort({ timeStart: 1 })
      .lean();

    if (slots.length === 0) {
      await ensureLaundrySlotsForDate(dateObj, mode);
      const seeded = await LaundrySlot.find({
        date: { $gte: dateObj, $lt: nextDay },
        mode,
        isBlocked: false,
      })
        .sort({ timeStart: 1 })
        .lean();

      return res.json({ slots: seeded.map((slot) => ({
        ...serializeSlot(slot, { isBooked: false, isUserBooked: false }),
      })) });
    }

    // Check which slots are booked by current user
    const userBookings = await LaundryBooking.find({
      userId: req.user.id,
      bookingDate: { $gte: dateObj, $lt: nextDay },
      status: { $in: ['confirmed', 'completed'] },
    })
      .select('slotId')
      .lean();

    const bookedSlotIds = userBookings.map(b => b.slotId.toString());

    // Get all bookings for this date/mode to check availability
    const allBookings = await LaundryBooking.find({
      bookingDate: { $gte: dateObj, $lt: nextDay },
      status: 'confirmed',
    })
      .select('slotId')
      .lean();

    const allBookedSlotIds = new Set(allBookings.map(b => b.slotId.toString()));

    // Add availability flags to slots
    const slotsWithStatus = slots.map(slot => ({
      ...serializeSlot(slot, {
        isBooked: allBookedSlotIds.has(slot._id.toString()),
        isUserBooked: bookedSlotIds.includes(slot._id.toString()),
      }),
    }));

    res.json({ slots: slotsWithStatus });
  } catch (e) {
    next(e);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await LaundryBooking.find({ userId: req.user.id })
      .populate('slotId', 'date timeStart timeEnd mode machineId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (e) {
    next(e);
  }
}

export async function bookSlot(req, res, next) {
  try {
    const { slotId, mode: rawMode, bookingDate } = req.body;
    const mode = typeof rawMode === 'string' ? rawMode.trim() : rawMode;

    // Validate inputs
    if (!slotId || !mode || !bookingDate) {
      return res.status(400).json({ message: 'Missing required fields: slotId, mode, bookingDate' });
    }

    if (!['free', 'paid'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode' });
    }

    // Parse and validate booking date (reuse existing validator)
    let dateObj;
    try {
      dateObj = parseAndValidateDate(bookingDate, 'bookingDate');
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Validate slotId format
    if (!slotId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid slot ID' });
    }

    // Fetch slot
    const slot = await LaundrySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.isBlocked) {
      return res.status(400).json({ message: 'This slot is currently unavailable' });
    }

    if (slot.mode !== mode) {
      return res.status(400).json({ message: 'Slot mode mismatch' });
    }

    // Validate slot time strings (e.g. '6:00 AM' -> minutes)
    const parseTimeToMinutes = (t) => {
      if (!t || typeof t !== 'string') return NaN;
      const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!m) return NaN;
      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const ampm = m[3].toUpperCase();
      if (hh === 12) hh = 0;
      if (ampm === 'PM') hh += 12;
      return hh * 60 + mm;
    };

    const slotStart = parseTimeToMinutes(slot.timeStart);
    const slotEnd = parseTimeToMinutes(slot.timeEnd);
    if (isNaN(slotStart) || isNaN(slotEnd) || slotStart >= slotEnd) {
      return res.status(400).json({ message: 'Slot time invalid on server' });
    }

    // ─── DOUBLE-BOOKING / OVERLAP PREVENTION ───
    // Build day boundaries
    const dayStart = new Date(dateObj.toISOString().split('T')[0]);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Check for existing booking on same slot for that date
    const existingBooking = await LaundryBooking.findOne({
      slotId,
      bookingDate: { $gte: dayStart, $lt: dayEnd },
      status: 'confirmed',
    });
    if (existingBooking) {
      return res.status(409).json({ message: 'This slot is no longer available. Please select another time.' });
    }

    // Check overlapping bookings for user on same date (allow multiple non-overlapping bookings)
    const userBookings = await LaundryBooking.find({
      userId: req.user.id,
      bookingDate: { $gte: dayStart, $lt: dayEnd },
      status: 'confirmed',
    }).populate('slotId', 'timeStart timeEnd').lean();

    for (const ub of userBookings) {
      if (!ub.slotId) continue;
      const uStart = parseTimeToMinutes(ub.slotId.timeStart);
      const uEnd = parseTimeToMinutes(ub.slotId.timeEnd);
      if (isNaN(uStart) || isNaN(uEnd)) continue;
      const overlap = slotStart < uEnd && uStart < slotEnd;
      if (overlap) {
        return res.status(409).json({ message: 'Selected time overlaps with your existing booking.' });
      }
    }

    // ─── MAX BOOKING LIMITS ───
    // Limit: max 3 confirmed bookings per 7-day window (including requested date)
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - 3);
    const weekEnd = new Date(dayStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const weeklyCount = await LaundryBooking.countDocuments({
      userId: req.user.id,
      bookingDate: { $gte: weekStart, $lte: weekEnd },
      status: 'confirmed',
    });
    const MAX_WEEKLY = 3;
    if (weeklyCount >= MAX_WEEKLY) {
      return res.status(429).json({ message: `Booking limit reached (${MAX_WEEKLY} per 7-day period)` });
    }

    // Generate unique token
    const tokenId = `LDY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const booking = new LaundryBooking({
      userId: req.user.id,
      slotId,
      bookingDate: dateObj,
      mode,
      tokenId,
      status: 'confirmed',
      paymentStatus: mode === 'paid' ? 'pending' : 'completed',
    });

    await booking.save();

    // Populate slot info
    const populatedBooking = await LaundryBooking.findById(booking._id)
      .populate('slotId', 'date timeStart timeEnd mode machineId')
      .lean();

    // Emit realtime laundry update so clients can refresh availability
    try {
      emitLaundryUpdate({ action: 'booked', slotId: slot._id.toString(), bookingId: booking._id.toString(), date: booking.bookingDate });
    } catch (err) {
      // non-fatal
      console.warn('Failed to emit laundry update', err);
    }

    emitAdminStatsUpdate({ reason: 'laundry_booked' });

    res.json({
      success: true,
      booking: {
        id: populatedBooking._id,
        tokenId: populatedBooking.tokenId,
        timeStart: populatedBooking.slotId.timeStart,
        timeEnd: populatedBooking.slotId.timeEnd,
        mode: populatedBooking.mode,
        bookingDate: populatedBooking.bookingDate,
        createdAt: populatedBooking.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await LaundryBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if booking is still cancellable
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: `Cannot cancel booking with status: ${booking.status}` });
    }

    // Update status
    const updated = await LaundryBooking.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    )
      .populate('slotId', 'date timeStart timeEnd mode')
      .lean();

    // Notify clients to refresh availability
    try {
      emitLaundryUpdate({ action: 'cancelled', slotId: updated.slotId?._id?.toString?.() || updated.slotId, bookingId: updated._id.toString(), date: updated.bookingDate });
    } catch (err) {
      console.warn('Failed to emit laundry update', err);
    }

    emitAdminStatsUpdate({ reason: 'laundry_cancelled' });

    res.json({ success: true, booking: updated });
  } catch (e) {
    next(e);
  }
}

// ─── ADMIN ENDPOINTS ───

export async function getAllBookings(req, res, next) {
  try {
    const filters = {};

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      if (!['confirmed', 'completed', 'cancelled'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filters.status = req.query.status;
    }

    // Mode filter
    if (req.query.mode && req.query.mode !== 'all') {
      if (!['free', 'paid'].includes(req.query.mode)) {
        return res.status(400).json({ message: 'Invalid mode filter' });
      }
      filters.mode = req.query.mode;
    }

    // Date range filter
    if (req.query.dateFrom && req.query.dateTo) {
      const from = new Date(req.query.dateFrom);
      const to = new Date(req.query.dateTo);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        filters.bookingDate = { $gte: from, $lte: to };
      }
    }

    const bookings = await LaundryBooking.find(filters)
      .populate('userId', 'username name roomNumber')
      .populate('slotId', 'date timeStart timeEnd mode machineId')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ bookings });
  } catch (e) {
    next(e);
  }
}

export async function getSlotManagement(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;

    const filters = { isBlocked: false };

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        filters.date = { $gte: from, $lte: to };
      }
    }

    const slots = await LaundrySlot.find(filters)
      .sort({ date: 1, timeStart: 1 })
      .limit(1000)
      .lean();

    // Get booking counts per slot
    const slotIds = slots.map(s => s._id);
    const bookingCounts = await LaundryBooking.aggregate([
      {
        $match: {
          slotId: { $in: slotIds },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: '$slotId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    bookingCounts.forEach(bc => {
      countMap[bc._id.toString()] = bc.count;
    });

    const slotsWithCounts = slots.map(slot => ({
      ...slot,
      bookedCount: countMap[slot._id.toString()] || 0,
    }));

    res.json({ slots: slotsWithCounts });
  } catch (e) {
    next(e);
  }
}

export async function createSlots(req, res, next) {
  try {
    const { date, times, mode } = req.body;

    // Validate inputs
    if (!date || !times || !Array.isArray(times) || !mode) {
      return res.status(400).json({ message: 'Invalid input: date, times array, and mode required' });
    }

    if (!['free', 'paid'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode' });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Create slots (prevent duplicates) with validation
    const parseTimeToMinutes = (t) => {
      if (!t || typeof t !== 'string') return NaN;
      const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!m) return NaN;
      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const ampm = m[3].toUpperCase();
      if (hh === 12) hh = 0;
      if (ampm === 'PM') hh += 12;
      return hh * 60 + mm;
    };

    const slots = [];
    for (const time of times) {
      const timeStart = typeof time.timeStart === 'string' ? time.timeStart.trim() : time.timeStart;
      const timeEnd = typeof time.timeEnd === 'string' ? time.timeEnd.trim() : time.timeEnd;
      if (!timeStart || !timeEnd) continue;

      const sMin = parseTimeToMinutes(timeStart);
      const eMin = parseTimeToMinutes(timeEnd);
      if (isNaN(sMin) || isNaN(eMin) || sMin >= eMin) continue; // skip invalid time ranges

      const existing = await LaundrySlot.findOne({
        date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) },
        timeStart,
        timeEnd,
        mode,
      });

      if (!existing) {
        const newSlot = new LaundrySlot({
          date: dateObj,
          timeStart,
          timeEnd,
          mode,
        });
        slots.push(newSlot);
      }
    }

    if (slots.length > 0) {
      await LaundrySlot.insertMany(slots);
    }

    // Emit created slots event so clients/admin refresh
    try {
      emitLaundryUpdate({ action: 'created', created: slots.length, date: dateObj });
    } catch (err) {
      console.warn('Failed to emit laundry update', err);
    }

    res.json({ success: true, created: slots.length });
  } catch (e) {
    next(e);
  }
}

export async function blockSlot(req, res, next) {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid slot ID' });
    }

    const updated = await LaundrySlot.findByIdAndUpdate(
      id,
      { isBlocked: blocked === true },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Notify clients about block/unblock
    try {
      emitLaundryUpdate({ action: blocked ? 'blocked' : 'unblocked', slotId: updated._id.toString(), date: updated.date });
    } catch (err) {
      console.warn('Failed to emit laundry update', err);
    }

    res.json({ success: true, slot: updated });
  } catch (e) {
    next(e);
  }
}
