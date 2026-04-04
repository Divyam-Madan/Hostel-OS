import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { emitComplaintUpdate, emitAdminStatsUpdate } from '../services/socketService.js';

function toFrontendStatus(s) {
  if (s === 'in_progress') return 'in-progress';
  return s;
}

function formatComplaint(c) {
  const created = c.createdAt || new Date();
  return {
    id: c._id.toString(),
    category: c.category,
    title: c.title,
    description: c.description,
    priority: c.priority,
    status: toFrontendStatus(c.status),
    date: created.toISOString().slice(0, 10),
    icon: categoryIcon(c.category),
    updatedAt: relativeTime(created),
    roomHint: c.roomHint,
  };
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
    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const c = await Complaint.create({
      userId: req.user.id,
      category: category || 'General',
      title: String(title).trim(),
      description: String(description || '').trim(),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      roomHint: String(roomHint || '').trim(),
    });
    await User.findByIdAndUpdate(req.user.id, { $push: { complaints: c._id } });
    const payload = formatComplaint(c);
    emitComplaintUpdate({ action: 'created', complaint: payload });
    emitAdminStatsUpdate({ reason: 'complaint' });
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
    const list = await Complaint.find().populate('userId', 'username email roomNumber').sort({ createdAt: -1 });
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
    let { status } = req.body;
    if (status === 'in-progress') status = 'in_progress';
    const allowed = ['pending', 'in_progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const c = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    const payload = formatComplaint(c);
    emitComplaintUpdate({ action: 'updated', complaint: payload });
    emitAdminStatsUpdate({ reason: 'complaint' });
    res.json({ success: true, complaint: payload });
  } catch (e) {
    next(e);
  }
}
