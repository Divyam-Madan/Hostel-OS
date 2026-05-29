import TimetableEntry from '../models/TimetableEntry.js';
import { emitTimetableUpdate, emitTimelineUpdate, emitAdminStatsUpdate } from '../services/socketService.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export async function getTimetable(_req, res) {
  const rows = await TimetableEntry.find().sort({ day: 1, order: 1, createdAt: 1 }).lean();
  const grouped = {};
  for (const d of DAYS) grouped[d] = [];
  rows.forEach((r) => {
    const day = r.day || 'Mon';
    grouped[day] = grouped[day] || [];
    grouped[day].push({ id: r._id.toString(), subject: r.subject, time: r.time, room: r.room, faculty: r.faculty, type: r.type, order: r.order });
  });
  return res.json({ success: true, timetable: grouped });
}

export async function createEntry(req, res) {
  const { day, subject, time, room, faculty, type } = req.body || {};
  if (!day || !subject || !time) return res.status(400).json({ success: false, message: 'day, subject and time are required' });
  const count = await TimetableEntry.countDocuments({ day });
  const entry = await TimetableEntry.create({ day, subject, time, room, faculty, type: type || 'lecture', order: count + 1 });
  emitTimetableUpdate({ action: 'create', entry });
  emitTimelineUpdate({ at: Date.now() });
  emitAdminStatsUpdate({ source: 'timetable' });
  return res.status(201).json({ success: true, entry });
}

export async function updateEntry(req, res) {
  const { id } = req.params;
  const patch = (({ day, subject, time, room, faculty, type, order }) => ({ day, subject, time, room, faculty, type, order }))(req.body || {});
  const entry = await TimetableEntry.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
  emitTimetableUpdate({ action: 'update', entry });
  emitTimelineUpdate({ at: Date.now() });
  emitAdminStatsUpdate({ source: 'timetable' });
  return res.json({ success: true, entry });
}

export async function deleteEntry(req, res) {
  const { id } = req.params;
  const entry = await TimetableEntry.findByIdAndDelete(id).lean();
  if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
  emitTimetableUpdate({ action: 'delete', id });
  emitTimelineUpdate({ at: Date.now() });
  emitAdminStatsUpdate({ source: 'timetable' });
  return res.json({ success: true });
}
