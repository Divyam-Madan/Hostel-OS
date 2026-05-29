import { Complaint } from '../models/Complaint.js';
import { FoodReview } from '../models/FoodReview.js';
import { User } from '../models/User.js';
import { HostelEvent } from '../models/HostelEvent.js';
import { WellbeingLog } from '../models/WellbeingLog.js';
import { Leave } from '../models/Leave.js';
import {
  COMPLAINT_STATUS_ALIASES,
  toCanonicalComplaintStatus,
  toFrontendComplaintStatus,
} from '../utils/complaintStatus.js';
import { FeeRecord } from '../models/FeeRecord.js';

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
    leaveAgg,
    leaveByType,
    leaveStatusCounts,
    leaveTrendRaw,
    frequentLeaveUsers,
  ] = await Promise.all([
    // each promise is wrapped with a catch that returns a sensible default
    User.countDocuments().catch((err) => {
      console.error('analytics: countDocuments error', err);
      return 0;
    }),
    Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ['$status', COMPLAINT_STATUS_ALIASES.pending] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $in: ['$status', COMPLAINT_STATUS_ALIASES.in_progress] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $in: ['$status', COMPLAINT_STATUS_ALIASES.resolved] }, 1, 0] } },
        },
      },
    ]).catch((err) => {
      console.error('analytics: complaintAgg error', err);
      return [];
    }),
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).catch((err) => {
      console.error('analytics: complaintsByCategory error', err);
      return [];
    }),
    Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).catch((err) => {
      console.error('analytics: statusCounts error', err);
      return [];
    }),
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
    ]).catch((err) => {
      console.error('analytics: trendRaw error', err);
      return [];
    }),
    HostelEvent.find().lean().catch((err) => {
      console.error('analytics: events error', err);
      return [];
    }),
    FoodReview.countDocuments().catch((err) => {
      console.error('analytics: feedbackCount error', err);
      return 0;
    }),
    WellbeingLog.countDocuments().catch((err) => {
      console.error('analytics: wellbeingCount error', err);
      return 0;
    }),
    FoodReview.find().sort({ createdAt: -1 }).limit(800).lean().catch((err) => {
      console.error('analytics: reviewsSample error', err);
      return [];
    }),
    Leave.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        },
      },
    ]).catch((err) => {
      console.error('analytics: leaveAgg error', err);
      return [];
    }),
    Leave.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).catch((err) => {
      console.error('analytics: leaveByType error', err);
      return [];
    }),
    Leave.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).catch((err) => {
      console.error('analytics: leaveStatusCounts error', err);
      return [];
    }),
    Leave.aggregate([
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
    ]).catch((err) => {
      console.error('analytics: leaveTrendRaw error', err);
      return [];
    }),
    Leave.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]).catch((err) => {
      console.error('analytics: frequentLeaveUsers error', err);
      return [];
    }),
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

  const statusMap = { pending: 0, in_progress: 0, resolved: 0 };
  for (const s of statusCounts) {
    const canonical = toCanonicalComplaintStatus(s._id);
    if (canonical) statusMap[canonical] += s.count;
  }
  const complaintStatusPie = {
    pending: statusMap.pending || 0,
    in_progress: statusMap.in_progress || 0,
    resolved: statusMap.resolved || 0,
  };

  const complaintTrend = (trendRaw || []).map((t) => ({ date: t._id || null, count: t?.count || 0 }));

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviewsSample) {
    sentiment[sentimentFromRating(r.rating)] += 1;
  }

  const eventRegistrations = (events || []).map((ev) => ({
    id: ev && ev._id ? String(ev._id) : null,
    title: ev?.title || 'Untitled event',
    count: (ev?.registrations || []).length || 0,
    isActive: !!ev?.isActive,
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

  // Leave analytics
  const la = leaveAgg[0] || { total: 0, approved: 0, pending: 0, rejected: 0 };
  const leaveTypeList = leaveByType.map((x) => ({
    name: x._id === 'leave' ? 'Leave' : x._id === 'outing' ? 'Outing' : x._id,
    count: x.count,
  }));

  const leaveStatusMap = { pending: 0, approved: 0, rejected: 0 };
  for (const s of leaveStatusCounts) {
    if (s._id === 'pending' || s._id === 'approved' || s._id === 'rejected') {
      leaveStatusMap[s._id] += s.count;
    }
  }
  const leaveStatusPie = {
    pending: leaveStatusMap.pending || 0,
    approved: leaveStatusMap.approved || 0,
    rejected: leaveStatusMap.rejected || 0,
  };

  const leaveTrend = (leaveTrendRaw || []).map((t) => ({ date: t._id || null, count: t?.count || 0 }));

  const frequentUsers = frequentLeaveUsers.map((entry) => ({
    studentName: entry.user?.name || entry.user?.username || 'Unknown',
    leaveCount: entry.count,
  }));

  // Fees analytics
  const [
    feeTotalAgg,
    feePaidAgg,
    feePendingAgg,
    feeOverdueAgg,
    feeStatusCounts,
    feeMonthlyAgg,
    feeMethodAgg,
  ] = await Promise.all([
    FeeRecord.aggregate([{ $group: { _id: null, amount: { $sum: '$amount' } } }]).catch((err) => {
      console.error('analytics: feeTotalAgg error', err);
      return [];
    }),
    FeeRecord.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).catch((err) => {
      console.error('analytics: feePaidAgg error', err);
      return [];
    }),
    FeeRecord.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).catch((err) => {
      console.error('analytics: feePendingAgg error', err);
      return [];
    }),
    FeeRecord.aggregate([{ $match: { status: 'overdue' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).catch((err) => {
      console.error('analytics: feeOverdueAgg error', err);
      return [];
    }),
    FeeRecord.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).catch((err) => {
      console.error('analytics: feeStatusCounts error', err);
      return [];
    }),
    FeeRecord.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$paidAt', '$dueDate'] } } },
          collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 0, '$amount'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).catch((err) => {
      console.error('analytics: feeMonthlyAgg error', err);
      return [];
    }),
    FeeRecord.aggregate([{ $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }]).catch((err) => {
      console.error('analytics: feeMethodAgg error', err);
      return [];
    }),
  ]);

  const feeSummary = {
    totalAmount: feeTotalAgg[0]?.amount || 0,
    paidAmount: feePaidAgg[0]?.amount || 0,
    pendingAmount: feePendingAgg[0]?.amount || 0,
    overdueAmount: feeOverdueAgg[0]?.amount || 0,
    outstandingAmount: (feePendingAgg[0]?.amount || 0) + (feeOverdueAgg[0]?.amount || 0),
  };

  const feeStatusMap = { paid: 0, pending: 0, overdue: 0 };
  for (const r of feeStatusCounts) {
    if (r._id && feeStatusMap[r._id] !== undefined) feeStatusMap[r._id] = r.count;
  }

  const feesMonthlyTrend = (feeMonthlyAgg || []).map((r) => {
    const id = r && r._id ? String(r._id) : '';
    const label = id && id.length >= 7 ? `${id.slice(5)}/${id.slice(0, 4)}` : id || '—';
    return { key: id, label, collected: r?.collected || 0, pending: r?.pending || 0 };
  });

  const feeMethodDistribution = (feeMethodAgg || []).map((r) => ({ name: r && r._id ? String(r._id) : 'Other', amount: r?.amount || 0, count: r?.count || 0 }));

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
      totalLeaves: la.total,
      pendingLeaves: la.pending,
      approvedLeaves: la.approved,
      rejectedLeaves: la.rejected,
    },
    charts: {
      complaintsByCategory: complaintsByCategoryList,
      complaintTrend,
      complaintStatusPie,
      // Fees charts
      feesStatusPie: feeStatusMap,
      feesMonthlyTrend,
      feesPaymentDistribution: feeMethodDistribution,
      eventRegistrations,
      feedbackSentiment: sentiment,
      leavesByType: leaveTypeList,
      leaveTrend,
      leaveStatusPie,
      frequentLeaveUsers,
    },
    insights: {
      mostFrequentComplaintCategory: mostFrequentCategory,
      mostPopularEvent: mostPopular,
      leastPopularEvent: leastPopular,
    },
  };
}

export function buildComplaintAdminQuery(filters = {}) {
  const q = {};

  const category = String(filters.category || '').trim();
  if (category) {
    q.category = { $regex: escapeRe(category), $options: 'i' };
  }

  const status = String(filters.status || '').trim();
  if (status) {
    const canonical = toCanonicalComplaintStatus(status);
    if (canonical) q.status = { $in: COMPLAINT_STATUS_ALIASES[canonical] };
  }

  const dateFrom = String(filters.dateFrom || '').trim();
  const dateTo = String(filters.dateTo || '').trim();
  if (dateFrom || dateTo) {
    q.createdAt = {};
    if (dateFrom) q.createdAt.$gte = startOfDay(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q.createdAt.$lte = end;
    }
  }

  const search = String(filters.search || '').trim();
  if (search) {
    const searchRegex = new RegExp(escapeRe(search), 'i');
    q.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { roomHint: searchRegex },
      { category: searchRegex },
    ];
  }

  return q;
}

export async function attachComplaintUserSearch(q, search) {
  const normalized = String(search || '').trim();
  if (!normalized) return q;

  const users = await User.find({
    $or: [
      { username: new RegExp(escapeRe(normalized), 'i') },
      { email: new RegExp(escapeRe(normalized), 'i') },
      { roomNumber: new RegExp(escapeRe(normalized), 'i') },
    ],
  })
    .select('_id')
    .lean();

  const userIds = users.map((u) => u._id);
  if (!userIds.length) return q;

  if (!q.$or) q.$or = [];
  q.$or.push({ userId: { $in: userIds } });
  return q;
}

export async function listComplaintsAdmin(filters) {
  const q = await attachComplaintUserSearch(buildComplaintAdminQuery(filters), filters.search);
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
    status: toFrontendComplaintStatus(c.status),
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
  if (toCanonicalComplaintStatus(c.status) !== 'resolved') return { ok: false, code: 400, message: 'Only resolved complaints can be deleted' };
  await Complaint.deleteOne({ _id: c._id });
  return { ok: true };
}

export async function listEventsAdmin(filters = {}) {
  const search = String(filters.search || '').trim();
  const status = String(filters.status || 'all').trim().toLowerCase();
  const sort = String(filters.sort || 'startsAt_desc').trim().toLowerCase();
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));

  const q = {};
  if (search) {
    const regex = new RegExp(escapeRe(search), 'i');
    q.$or = [{ title: regex }, { description: regex }, { venue: regex }, { category: regex }];
  }

  const now = new Date();
  if (status === 'upcoming') q.startsAt = { $gte: now };
  if (status === 'past') q.startsAt = { $lt: now };

  const sortMap = {
    startsat_desc: { startsAt: -1, createdAt: -1 },
    startsat_asc: { startsAt: 1, createdAt: -1 },
    title_asc: { title: 1, createdAt: -1 },
    title_desc: { title: -1, createdAt: -1 },
    created_desc: { createdAt: -1 },
  };
  const normalizedSort = sort.replace('.', '_');
  const sortSpec = sortMap[normalizedSort] || sortMap.startsat_desc;

  const [total, events] = await Promise.all([
    HostelEvent.countDocuments(q),
    HostelEvent.find(q).sort(sortSpec).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  let rows = events.map((ev) => ({
    id: ev._id.toString(),
    title: ev.title,
    description: ev.description,
    venue: ev.venue,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    isActive: ev.isActive,
    registrationCount: (ev.registrations || []).length,
    isFull: (ev.registrations || []).length >= Number(ev.seats || 0),
    waitlistCount: (ev.waitlist || []).length,
    seats: Number(ev.seats || 0),
    category: ev.category || 'general',
    createdAt: ev.createdAt,
  }));

  if (status === 'full') rows = rows.filter((row) => row.isFull);

  return {
    events: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function buildWellbeingInsights() {
  const [total, moodRaw, trendRaw, recentRaw, avgStressRaw, repeatRaw] = await Promise.all([
    WellbeingLog.countDocuments(),
    WellbeingLog.aggregate([
      {
        $match: {
          visitDate: { $gte: new Date(Date.now() - 90 * DAY_MS) },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$mood', 'okay'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    WellbeingLog.aggregate([
      {
        $match: {
          visitDate: { $gte: new Date(Date.now() - 30 * DAY_MS) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          avgStress: { $avg: { $ifNull: ['$stressLevel', 3] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    WellbeingLog.aggregate([
      { $sort: { visitDate: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          mood: { $ifNull: ['$mood', 'okay'] },
          stressLevel: { $ifNull: ['$stressLevel', 3] },
          kind: 1,
          notes: 1,
          visitDate: 1,
          username: '$user.username',
          roomNumber: '$user.roomNumber',
        },
      },
    ]),
    WellbeingLog.aggregate([
      {
        $group: {
          _id: null,
          avgStress: { $avg: { $ifNull: ['$stressLevel', 3] } },
        },
      },
    ]),
    WellbeingLog.aggregate([
      {
        $group: {
          _id: '$userId',
          visits: { $sum: 1 },
        },
      },
      { $match: { visits: { $gte: 3 } } },
      { $count: 'n' },
    ]),
  ]);

  const moodDistribution = moodRaw.map((row) => ({
    key: String(row._id || 'unknown'),
    name:
      row._id === 'very-low' ? 'Very low'
        : row._id === 'low' ? 'Low'
          : row._id === 'okay' ? 'Okay'
            : row._id === 'good' ? 'Good'
              : row._id === 'great' ? 'Great'
                : String(row._id || 'Unknown'),
    count: row.count,
  }));

  const stressTrend = trendRaw.map((row) => ({
    date: row._id,
    avgStress: Number(row.avgStress?.toFixed?.(1) ?? row.avgStress ?? 0),
    count: row.count,
  }));

  const recentActivity = recentRaw.map((row, index) => ({
    id: `${index}-${row.visitDate || ''}`,
    username: row.username || 'Student',
    roomNumber: row.roomNumber || '',
    mood: row.mood || 'okay',
    stressLevel: Number(row.stressLevel) || 3,
    kind: row.kind || 'general',
    notes: row.notes || '',
    visitDate: row.visitDate,
  }));

  const averageStress = avgStressRaw[0]?.avgStress ? Number(avgStressRaw[0].avgStress.toFixed(1)) : 0;
  const repeatVisitors = repeatRaw[0]?.n || 0;
  const highStress = recentActivity.filter((row) => row.stressLevel >= 4).length;

  return {
    totalAppointments: total,
    moodDistribution,
    trend: stressTrend,
    stressTrend,
    recentActivity,
    averageStress,
    highStressCount: highStress,
    highlight:
      highStress > 0
        ? `${highStress} recent log(s) show higher stress levels — consider outreach.`
        : repeatVisitors > 0
          ? `${repeatVisitors} student(s) have multiple support visits on file — consider proactive outreach.`
          : total > 0
            ? 'Wellbeing logs are steady with no high-stress spikes in the latest window.'
            : 'No wellbeing logs yet.',
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
      status: toFrontendComplaintStatus(c.status),
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
