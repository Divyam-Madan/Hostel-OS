import mongoose from 'mongoose';
import { WellbeingLog } from '../models/WellbeingLog.js';
import { emitAdminStatsUpdate, emitWellbeingUpdate } from '../services/socketService.js';
import { createNotification } from '../services/notificationService.js';

const MOODS = new Set(['very-low', 'low', 'okay', 'good', 'great']);
const KINDS = new Set(['counselling', 'health', 'general']);

function cleanText(value, maxLen = 500) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (text.length > maxLen) {
    const err = new Error(`Notes must be ${maxLen} characters or less`);
    err.statusCode = 400;
    throw err;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function normalizeMood(mood) {
  const value = String(mood || 'okay').trim().toLowerCase();
  const alias = { sad: 'low', stressed: 'low', fine: 'okay', calm: 'good', happy: 'great' };
  return MOODS.has(value) ? value : (alias[value] || null);
}

function normalizeStress(stressLevel) {
  const n = Number(stressLevel);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function serializeLog(log) {
  return {
    id: String(log._id),
    mood: log.mood || 'okay',
    stressLevel: Number.isFinite(Number(log.stressLevel)) ? Number(log.stressLevel) : 3,
    kind: log.kind || 'general',
    notes: log.notes || '',
    topics: Array.isArray(log.topics) ? log.topics : [],
    visitDate: log.visitDate,
    createdAt: log.createdAt,
  };
}

export async function createWellbeingLog(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const mood = normalizeMood(req.body?.mood);
    if (!mood) return res.status(400).json({ success: false, message: 'Please choose a valid mood' });

    const stressLevel = normalizeStress(req.body?.stressLevel);
    if (!stressLevel) return res.status(400).json({ success: false, message: 'Stress level must be between 1 and 5' });

    const kind = KINDS.has(String(req.body?.kind || '').trim()) ? String(req.body.kind).trim() : 'general';
    const notes = cleanText(req.body?.notes || '', 500);
    const topics = Array.isArray(req.body?.topics)
      ? req.body.topics.map((topic) => String(topic || '').trim()).filter(Boolean).slice(0, 8)
      : [];

    const log = await WellbeingLog.create({
      userId,
      mood,
      stressLevel,
      kind,
      notes,
      topics,
      visitDate: new Date(),
    });

    const payload = serializeLog(log.toObject ? log.toObject() : log);
    emitWellbeingUpdate({ reason: 'wellbeing_created', log: payload });
    emitAdminStatsUpdate({ reason: 'wellbeing_created' });
    await createNotification({
      userId,
      type: 'general',
      title: 'Wellbeing check-in saved',
      message: 'Your wellbeing log was saved successfully.',
      meta: { key: `wellbeing:${payload.id}` },
    });

    res.status(201).json({ success: true, log: payload });
  } catch (e) {
    next(e);
  }
}

export async function listMyWellbeingLogs(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const logs = await WellbeingLog.find({ userId }).sort({ visitDate: -1 }).limit(20).lean();
    res.json({ success: true, logs: logs.map(serializeLog) });
  } catch (e) {
    next(e);
  }
}