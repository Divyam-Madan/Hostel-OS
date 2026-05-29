import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { emitComplaintUpdate, emitAdminStatsUpdate } from '../services/socketService.js';
import { toCanonicalComplaintStatus, toFrontendComplaintStatus } from '../utils/complaintStatus.js';
import { createNotification } from '../services/notificationService.js';
import { buildComplaintAdminQuery, attachComplaintUserSearch } from '../services/adminAnalyticsService.js';

function formatComplaint(c) {
  const created = c.createdAt || new Date();
  return {
    id: c._id.toString(),
    category: c.category,
    title: c.title,
    description: c.description,
    priority: c.priority,
    status: toFrontendComplaintStatus(c.status),
    date: created.toISOString().slice(0, 10),
    icon: categoryIcon(c.category),
    updatedAt: relativeTime(created),
    roomHint: c.roomHint,
  };
}

// --- Validation & sanitization helpers (Phase A)
const CATEGORY_WHITELIST = [
  'AC / Cooling', 'Water', 'Cleaning', 'Electricity', 'Mosquito/Pest',
  'Window/Door', 'Internet/WiFi', 'Furniture', 'Mirror/Sanitary', 'Toilet/Drain'
];

function sanitizeString(s) {
  if (!s && s !== '') return '';
  const str = String(s);
  // Basic tag stripper to avoid HTML/script injection in stored text
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateComplaintInput({ title, description, priority, category, roomHint }) {
  if (!title || String(title).trim().length < 3) {
    const e = new Error('Title is required and must be at least 3 characters');
    e.statusCode = 400;
    throw e;
  }
  if (String(title).trim().length > 200) {
    const e = new Error('Title must be 200 characters or fewer');
    e.statusCode = 400;
    throw e;
  }
  if (description && String(description).length > 5000) {
    const e = new Error('Description must be 5000 characters or fewer');
    e.statusCode = 400;
    throw e;
  }
  const allowed = ['low', 'medium', 'high'];
  if (priority && !allowed.includes(priority)) {
    const e = new Error('Invalid priority');
    e.statusCode = 400;
    throw e;
  }
  if (category && typeof category !== 'string') {
    const e = new Error('Invalid category');
    e.statusCode = 400;
    throw e;
  }
  if (roomHint && String(roomHint).length > 100) {
    const e = new Error('Location/Room must be 100 characters or fewer');
    e.statusCode = 400;
    throw e;
  }
}

function categoryIcon(cat) {
  const m = {
    'AC / Cooling': '❄️',
    Water: '💧',
    Cleaning: '🧹',
    Electricity: '💡',
    'Mosquito/Pest': '🦟',
    'Window/Door': '🪟',
    'Internet/WiFi': '📡',
    Furniture: '🪑',
    'Mirror/Sanitary': '🪞',
    'Toilet/Drain': '🚿',
  };
  return m[cat] || '📋';
}

function relativeTime(d) {
  const sec = Math.floor((Date.now() - new Date(d)) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export async function createComplaint(req, res, next) {
  try {
    const { category, title, description, priority, roomHint } = req.body;
    // Validate input (throws on invalid)
    validateComplaintInput({ title, description, priority, category, roomHint });

    // Sanitize fields before persisting
    const cleanTitle = sanitizeString(title);
    const cleanDescription = sanitizeString(description || '');
    const cleanRoom = sanitizeString(roomHint || '');
    const cleanCategory = category ? sanitizeString(category) : 'General';
    if (category && !CATEGORY_WHITELIST.includes(cleanCategory)) {
      // Soft validation: accept unknown categories for now but log for monitoring
      console.warn(`complaints: unknown category received: "${cleanCategory}"`);
    }

    const c = await Complaint.create({
      userId: req.user.id,
      category: cleanCategory || 'General',
      title: cleanTitle,
      description: cleanDescription,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      roomHint: cleanRoom,
    });
    await User.findByIdAndUpdate(req.user.id, { $push: { complaints: c._id } });
    const payload = formatComplaint(c);
    emitComplaintUpdate({ action: 'created', complaint: payload });
    emitAdminStatsUpdate({ reason: 'complaint' });
    await createNotification({
      userId: req.user.id,
      type: 'general',
      title: 'Complaint submitted',
      message: `${payload.title} has been received and is being tracked.`,
      meta: { key: `complaint:${payload.id}:created` },
    });
    res.status(201).json({ success: true, complaint: payload });
  } catch (e) {
    next(e);
  }
}

export async function listMyComplaints(req, res, next) {
  try {
    const list = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, complaints: list.map(formatComplaint) });
  } catch (e) {
    next(e);
  }
}

export async function listAllComplaints(req, res, next) {
  try {
    const query = await attachComplaintUserSearch(
      buildComplaintAdminQuery({
        category: req.query.category,
        status: req.query.status,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      }),
      req.query.search,
    );
    const list = await Complaint.find(query)
      .populate('userId', 'username email roomNumber')
      .sort({ createdAt: -1 });
    const complaints = list.map((c) => ({
      ...formatComplaint(c),
      student: c.userId
        ? {
            username: c.userId.username,
            email: c.userId.email,
            room: c.userId.roomNumber,
          }
        : null,
    }));
    res.json({ success: true, complaints });
  } catch (e) {
    next(e);
  }
}

export async function patchComplaint(req, res, next) {
  try {
    const status = toCanonicalComplaintStatus(req.body.status);
    if (!status) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const c = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    const payload = formatComplaint(c);
    emitComplaintUpdate({ action: 'updated', complaint: payload });
    emitAdminStatsUpdate({ reason: 'complaint' });
    await createNotification({
      userId: c.userId,
      type: status === 'resolved' ? 'general' : 'mess',
      title: `Complaint ${status}`,
      message: `${payload.title} is now ${payload.status}.`,
      meta: { key: `complaint:${payload.id}:status`, complaintId: payload.id },
    });
    res.json({ success: true, complaint: payload });
  } catch (e) {
    next(e);
  }
}
