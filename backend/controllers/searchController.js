import TimetableEntry from '../models/TimetableEntry.js';
import { HostelEvent } from '../models/HostelEvent.js';
import LostFound from '../models/LostFound.js';
import { Complaint } from '../models/Complaint.js';
import { FeeRecord } from '../models/FeeRecord.js';
import { WellbeingLog } from '../models/WellbeingLog.js';
import { LaundryBooking } from '../models/LaundryBooking.js';
import { User } from '../models/User.js';
import { Leave } from '../models/Leave.js';

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeRegex(query) {
  return new RegExp(escapeRegex(query), 'i');
}

function item(id, title, subtitle, detail, page, meta = {}) {
  return { id, title, subtitle, detail, page, meta };
}

function formatFeeTitle(row) {
  return row.semester || row.status || 'Fee record';
}

function formatPersonTitle(user) {
  return user.username || user.email || 'Student';
}

function categoryHit(query, aliases, title, subtitle, detail, page) {
  const value = String(query || '').toLowerCase();
  const matches = aliases.some((alias) => value.includes(alias) || alias.includes(value));
  return matches ? [item(`category-${page}`, title, subtitle, detail, page, { source: 'category' })] : [];
}

async function searchTimetable(q, role) {
  const regex = makeRegex(q);
  const rows = await TimetableEntry.find({
    $or: [
      { subject: regex },
      { room: regex },
      { faculty: regex },
      { time: regex },
      { day: regex },
      { type: regex },
    ],
  }).sort({ day: 1, order: 1 }).limit(15).lean();
  const page = role === 'admin' ? 'admin-timetable' : 'timetable';
  return [
    ...categoryHit(q, ['tim', 'time', 'timetable', 'schedule', 'class'], 'Timetable', 'Class schedule', 'View your weekly timetable', page),
    ...rows.map((row) => item(
    String(row._id),
    row.subject,
    `${row.day} · ${row.time}`,
    [row.room, row.faculty].filter(Boolean).join(' · '),
    page,
    { source: 'timetable' }
  )),
  ];
}

async function searchEvents(q, role) {
  const regex = makeRegex(q);
  const rows = await HostelEvent.find({
    $or: [
      { title: regex },
      { description: regex },
      { venue: regex },
      { category: regex },
      { prize: regex },
    ],
  }).sort({ startsAt: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    row.title,
    row.venue || 'Event',
    row.startsAt ? new Date(row.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short' }) : '',
    role === 'admin' ? 'admin-events' : 'events',
    { source: 'events' }
  ));
}

async function searchLostFound(q, role) {
  const regex = makeRegex(q);
    const rows = await LostFound.find({
    $or: [
      { title: regex },
        { desc: regex },
        { description: regex },
      { location: regex },
      { postedBy: regex },
      { emoji: regex },
      { status: regex },
      { type: regex },
    ],
  }).sort({ createdAt: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    row.title,
    row.type === 'lost' ? 'Lost item' : 'Found item',
    row.location || row.desc || '',
    role === 'admin' ? 'admin-dashboard' : 'lost-found',
    { source: 'lostfound' }
  ));
}

async function searchComplaints(q, userId, role) {
  const regex = makeRegex(q);
  const filter = {
    $or: [
      { title: regex },
      { description: regex },
      { category: regex },
      { status: regex },
      { priority: regex },
      { roomHint: regex },
    ],
  };
  if (role !== 'admin') filter.userId = userId;
  const rows = await Complaint.find(filter).sort({ createdAt: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    row.title,
    row.category || 'Complaint',
    `${row.status || ''} ${row.roomHint || ''}`.trim(),
    role === 'admin' ? 'admin-complaints' : 'complaints',
    { source: 'complaints' }
  ));
}

async function searchFees(q, userId, role) {
  const regex = makeRegex(q);
  const filter = {
    $or: [
      { semester: regex },
      { transactionId: regex },
      { notes: regex },
      { method: regex },
      { status: regex },
    ],
  };
  if (role !== 'admin') filter.userId = userId;
  const rows = await FeeRecord.find(filter).sort({ dueDate: 1, createdAt: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    formatFeeTitle(row),
    row.status,
    [row.transactionId, row.method].filter(Boolean).join(' · '),
    role === 'admin' ? 'admin-dashboard' : 'fees',
    { source: 'fees' }
  ));
}

async function searchStudents(q) {
  const regex = makeRegex(q);
  const rows = await User.find({
    $or: [
      { username: regex },
      { email: regex },
      { roomNumber: regex },
    ],
  }).sort({ username: 1 }).limit(15).lean();
  return [
    ...categoryHit(q, ['student', 'students', 'room', 'email', 'resident'], 'Students', 'Student directory', 'Registered hostel residents', 'admin-students'),
    ...rows.map((row) => item(
      String(row._id),
      formatPersonTitle(row),
      row.roomNumber || 'Student',
      row.email || '',
      'admin-students',
      { source: 'students' }
    )),
  ];
}

async function searchLeaves(q) {
  const regex = makeRegex(q);
  const rows = await Leave.find({
    $or: [
      { type: regex },
      { reason: regex },
      { status: regex },
      { parentConsent: regex },
      { returnTime: regex },
      { approverNotes: regex },
    ],
  }).populate('userId', 'username email roomNumber').sort({ createdAt: -1 }).limit(15).lean();
  return [
    ...categoryHit(q, ['leave', 'outing', 'absence', 'permission'], 'Leave requests', 'Leave approval console', 'Approve or review requests', 'admin-leaves'),
    ...rows.map((row) => item(
      String(row._id),
      `${row.type || 'Leave'} request`,
      `${row.status || 'pending'} · ${row.userId?.username || 'Student'}`,
      row.reason || row.parentConsent || '',
      'admin-leaves',
      { source: 'leaves' }
    )),
  ];
}

async function searchWellbeing(q) {
  const regex = makeRegex(q);
  const rows = await WellbeingLog.find({
    $or: [
      { notes: regex },
      { mood: regex },
      { kind: regex },
      { topics: regex },
    ],
  }).populate('userId', 'username email roomNumber').sort({ visitDate: -1 }).limit(15).lean();
  return [
    ...categoryHit(q, ['well', 'wellbeing', 'counselling', 'health', 'mood', 'stress'], 'Wellbeing', 'Wellbeing operations', 'Support visit records', 'admin-wellbeing'),
    ...rows.map((row) => item(
      String(row._id),
      row.topics?.[0] || row.mood || 'Wellbeing log',
      row.userId?.username || 'Student',
      row.notes || row.kind || '',
      'admin-wellbeing',
      { source: 'wellbeing' }
    )),
  ];
}

async function searchCounselling(q, userId) {
  const regex = makeRegex(q);
  const rows = await WellbeingLog.find({
    userId,
    $or: [
      { notes: regex },
      { mood: regex },
      { kind: regex },
      { topics: regex },
    ],
  }).sort({ visitDate: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    row.topics?.[0] || row.mood || 'Counselling note',
    'Counselling',
    row.notes || '',
    'counselling',
    { source: 'counselling' }
  ));
}

async function searchLaundry(q, userId, role) {
  const regex = makeRegex(q);
  const filter = {
    $or: [
      { tokenId: regex },
      { status: regex },
      { mode: regex },
    ],
  };
  if (role !== 'admin') filter.userId = userId;
  const rows = await LaundryBooking.find(filter).sort({ createdAt: -1 }).limit(15).lean();
  return rows.map((row) => item(
    String(row._id),
    row.tokenId || 'Laundry booking',
    row.status || 'booking',
    row.bookingDate ? new Date(row.bookingDate).toLocaleDateString('en-IN') : '',
    role === 'admin' ? 'admin-laundry' : 'laundry',
    { source: 'laundry' }
  ));
}

export async function globalSearch(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({
        success: true,
        query: q,
        results: {
          events: [],
          timetable: [],
          complaints: [],
          lostFound: [],
          counselling: [],
          laundry: [],
          fees: [],
          students: [],
          leaves: [],
          wellbeing: [],
        },
      });
    }

    const userId = req.user?.id || null;
    const role = req.user?.role || 'student';

    const [timetable, events, complaints, lostFound, fees, counselling, laundry, students, leaves, wellbeing] = await Promise.all([
      searchTimetable(q, role),
      searchEvents(q, role),
      searchComplaints(q, userId, role),
      searchLostFound(q, role),
      searchFees(q, userId, role),
      userId ? searchCounselling(q, userId) : Promise.resolve([]),
      searchLaundry(q, userId, role),
      role === 'admin' ? searchStudents(q) : Promise.resolve([]),
      role === 'admin' ? searchLeaves(q) : Promise.resolve([]),
      role === 'admin' ? searchWellbeing(q) : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      query: q,
      results: {
        events,
        timetable,
        complaints,
        lostFound,
        counselling,
        laundry,
        fees,
        students,
        leaves,
        wellbeing,
      },
    });
  } catch (e) {
    next(e);
  }
}
