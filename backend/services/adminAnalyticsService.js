import { Complaint } from '../models/Complaint.js';
import { FoodReview } from '../models/FoodReview.js';
import { User } from '../models/User.js';
import { HostelEvent } from '../models/HostelEvent.js';
import { WellbeingLog } from '../models/WellbeingLog.js';

const DAY_MS = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Bucket mess hall from review: first tag, or "Campus-wide". */
export function messHallFromReview(review) {
  const tags = review.tags || [];
  const t = tags.find((x) => String(x || '').trim());
  if (t) return String(t).trim();
  return 'Campus-wide';
}

export function sentimentFromRating(rating) {
  const r = Number(rating);
  if (r >= 4) return 'positive';
  if (r >= 3) return 'neutral';
  return 'negative';
}

export async function buildDashboardPayload() {
  const [
    totalStudents,
    complaintAgg,
    complaintsByCategory,
    statusCounts,
    trendRaw,
    events,
    feedbackCount,
    wellbeingCount,
    reviewsSample,
  ] = await Promise.all([
    User.countDocuments(),
    Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
    ]),
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    HostelEvent.find().lean(),
    FoodReview.countDocuments(),
    WellbeingLog.countDocuments(),
    FoodReview.find().sort({ createdAt: -1 }).limit(800).lean(),
  ]);

  const ca = complaintAgg[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0 };
  let totalEventRegs = 0;
  let activeEvents = 0;
  for (const ev of events) {
    totalEventRegs += (ev.registrations || []).length;
    if (ev.isActive) activeEvents += 1;
  }

  const complaintsByCategoryList = complaintsByCategory.map((x) => ({
    name: x._id || 'General',
    count: x.count,
  }));

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const complaintStatusPie = {
    pending: statusMap.pending || 0,
    in_progress: statusMap.in_progress || 0,
    resolved: statusMap.resolved || 0,
  };

  const complaintTrend = trendRaw.map((t) => ({ date: t._id, count: t.count }));

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviewsSample) {
    sentiment[sentimentFromRating(r.rating)] += 1;
  }

  const eventRegistrations = events.map((ev) => ({
    id: ev._id.toString(),
    title: ev.title,
    count: (ev.registrations || []).length,
    isActive: ev.isActive,
  }));

  let mostPopular = null;
  let leastPopular = null;
  if (eventRegistrations.length) {
    const sorted = [...eventRegistrations].sort((a, b) => b.count - a.count);
    mostPopular = sorted[0];
    leastPopular = sorted[sorted.length - 1];
  }

  const catSorted = [...complaintsByCategoryList].sort((a, b) => b.count - a.count);
  const mostFrequentCategory = catSorted[0]?.name || null;

  return {
    overview: {
      totalStudents,
      totalComplaints: ca.total,
      pendingComplaints: ca.pending,
      inProgressComplaints: ca.inProgress,
      resolvedComplaints: ca.resolved,
      totalEventRegistrations: totalEventRegs,
      activeEvents,
      totalFeedbackEntries: feedbackCount,
      totalWellbeingLogs: wellbeingCount,
    },
    charts: {
      complaintsByCategory: complaintsByCategoryList,
      complaintTrend,
      complaintStatusPie,
      eventRegistrations,
      feedbackSentiment: sentiment,
    },
    insights: {
      mostFrequentComplaintCategory: mostFrequentCategory,
      mostPopularEvent: mostPopular,
      leastPopularEvent: leastPopular,
    },
  };
}

export async function listComplaintsAdmin(filters) {
  const q = {};
  if (filters.category) q.category = new RegExp(`^${escapeRe(filters.category)}$`, 'i');
  if (filters.status) {
    const s = filters.status === 'in-progress' ? 'in_progress' : filters.status;
    if (['pending', 'in_progress', 'resolved'].includes(s)) q.status = s;
  }
  if (filters.dateFrom || filters.dateTo) {
    q.createdAt = {};
    if (filters.dateFrom) q.createdAt.$gte = startOfDay(filters.dateFrom);
    if (filters.dateTo) {
      const t = new Date(filters.dateTo);
      t.setHours(23, 59, 59, 999);
      q.createdAt.$lte = t;
    }
  }

  const search = String(filters.search || '').trim().toLowerCase();
  let userIds;
  if (search) {
    const users = await User.find({
      $or: [
        { username: new RegExp(escapeRe(search), 'i') },
        { email: new RegExp(escapeRe(search), 'i') },
        { roomNumber: new RegExp(escapeRe(search), 'i') },
      ],
    })
      .select('_id')
      .lean();
    userIds = users.map((u) => u._id);
    q.$or = [
      { title: new RegExp(escapeRe(search), 'i') },
      { description: new RegExp(escapeRe(search), 'i') },
      { roomHint: new RegExp(escapeRe(search), 'i') },
    ];
    if (userIds.length) q.$or.push({ userId: { $in: userIds } });
  }

  const list = await Complaint.find(q)
    .populate('userId', 'username email roomNumber')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return list.map(formatComplaintRow);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatComplaintRow(c) {
  const u = c.userId;
  return {
    id: c._id.toString(),
    category: c.category,
    title: c.title,
    description: c.description,
    priority: c.priority,
    status: c.status === 'in_progress' ? 'in-progress' : c.status,
    roomHint: c.roomHint,
    createdAt: c.createdAt,
    student: u
      ? {
          username: u.username,
          email: u.email,
          room: u.roomNumber,
        }
      : null,
  };
}

export async function deleteResolvedComplaint(id) {
  const c = await Complaint.findById(id);
  if (!c) return { ok: false, code: 404 };
  if (c.status !== 'resolved') return { ok: false, code: 400, message: 'Only resolved complaints can be deleted' };
  await Complaint.deleteOne({ _id: c._id });
  return { ok: true };
}

export async function listEventsAdmin() {
  const events = await HostelEvent.find().sort({ startsAt: -1 }).lean();
  return events.map((ev) => ({
    id: ev._id.toString(),
    title: ev.title,
    description: ev.description,
    venue: ev.venue,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    isActive: ev.isActive,
    registrationCount: (ev.registrations || []).length,
    createdAt: ev.createdAt,
  }));
}

export async function buildWellbeingInsights() {
  const total = await WellbeingLog.countDocuments();
  const byDay = await WellbeingLog.aggregate([
    {
      $match: {
        visitDate: { $gte: new Date(Date.now() - 90 * DAY_MS) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byUser = await WellbeingLog.aggregate([
    {
      $group: {
        _id: '$userId',
        visits: { $sum: 1 },
        lastVisit: { $max: '$visitDate' },
      },
    },
    { $match: { visits: { $gte: 3 } } },
    { $count: 'n' },
  ]);

  const frequentVisitors = byUser[0]?.n || 0;

  return {
    totalAppointments: total,
    trend: byDay.map((d) => ({ date: d._id, count: d.count })),
    highlight:
      frequentVisitors > 0
        ? `${frequentVisitors} student(s) have multiple support visits on file — consider proactive outreach.`
        : 'No repeat-visit patterns flagged in the current window.',
  };
}

export async function searchStudents(qs) {
  const q = String(qs || '').trim();
  if (!q) {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(200).lean();
    return users.map(publicUser);
  }
  const re = new RegExp(escapeRe(q), 'i');
  const users = await User.find({
    $or: [{ username: re }, { email: re }, { roomNumber: re }],
  })
    .select('-password')
    .limit(100)
    .lean();
  return users.map(publicUser);
}

function publicUser(u) {
  return {
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    roomNumber: u.roomNumber || '',
    createdAt: u.createdAt,
  };
}

export async function getStudentDetail(userId) {
  const u = await User.findById(userId).select('-password').lean();
  if (!u) return null;
  const [complaints, reviews, eventRegs, wellbeing] = await Promise.all([
    Complaint.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    FoodReview.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    HostelEvent.find({ 'registrations.userId': userId }).lean(),
    WellbeingLog.find({ userId }).sort({ visitDate: -1 }).limit(50).lean(),
  ]);

  return {
    user: publicUser(u),
    complaints: complaints.map((c) => ({
      id: c._id.toString(),
      category: c.category,
      title: c.title,
      status: c.status === 'in_progress' ? 'in-progress' : c.status,
      createdAt: c.createdAt,
    })),
    feedback: reviews.map((r) => ({
      id: r._id.toString(),
      foodItem: r.foodItem,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    events: eventRegs.map((ev) => ({
      id: ev._id.toString(),
      title: ev.title,
      registeredAt: (ev.registrations || []).find((x) => String(x.userId) === String(userId))?.registeredAt,
    })),
    wellbeingLogs: wellbeing.map((w) => ({
      id: w._id.toString(),
      kind: w.kind,
      visitDate: w.visitDate,
      notes: w.notes,
    })),
  };
}

/** Group food reviews by mess hall tag for Gemini. */
export async function getReviewsGroupedByMess() {
  const reviews = await FoodReview.find().sort({ createdAt: -1 }).limit(500).lean();
  const groups = new Map();
  for (const r of reviews) {
    const hall = messHallFromReview(r);
    if (!groups.has(hall)) groups.set(hall, []);
    const line = `${r.foodItem}\t${r.rating}\t${String(r.comment || '').slice(0, 400)}`;
    groups.get(hall).push(line);
  }
  return Array.from(groups.entries()).map(([messHall, lines]) => ({
    messHall,
    lines,
    count: lines.length,
  }));
}
