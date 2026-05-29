import crypto from 'crypto';
import { FeeRecord } from '../models/FeeRecord.js';
import { User } from '../models/User.js';
import { createNotification, upsertNotification } from '../services/notificationService.js';

const VALID_PAYMENT_METHODS = new Set(['UPI', 'Net Banking', 'Debit Card', 'Cash', 'Bank Transfer', 'Other']);
const VALID_RECORD_STATUSES = new Set(['paid', 'pending', 'overdue']);
const MAX_LIMIT = 100;

function parsePositiveAmount(value) {
  if (value === undefined || value === null || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function normalizeSearchTerm(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim().slice(0, 60);
}

function normalizeStatus(status, { forAdmin = false } = {}) {
  if (!VALID_RECORD_STATUSES.has(status)) return null;
  if (!forAdmin && status === 'overdue') return 'due';
  return status;
}

function normalizePaymentMethod(value) {
  if (!value) return 'Other';
  const method = String(value).trim().slice(0, 40);
  return VALID_PAYMENT_METHODS.has(method) ? method : null;
}

function formatDate(value) {
  return value ? new Date(value).toISOString() : null;
}

function toStudentRecord(record) {
  return {
    id: record._id.toString(),
    semester: record.semester,
    amount: record.amount,
    date: formatDate(record.paidAt),
    dueDate: formatDate(record.dueDate),
    method: record.method || null,
    transactionId: record.transactionId || null,
    status: normalizeStatus(record.status),
    rawStatus: record.status,
  };
}

function toAdminRecord(record) {
  return {
    id: record._id.toString(),
    semester: record.semester,
    amount: record.amount,
    dueDate: formatDate(record.dueDate),
    paidAt: formatDate(record.paidAt),
    method: record.method || null,
    transactionId: record.transactionId || null,
    notes: record.notes || '',
    status: normalizeStatus(record.status, { forAdmin: true }),
    user: record.userId
      ? {
          id: record.userId._id?.toString?.() || record.userId.toString(),
          username: record.userId.username || null,
          email: record.userId.email || null,
          roomNumber: record.userId.roomNumber || '',
        }
      : null,
  };
}

function buildFeeSummary(records) {
  const sorted = [...records].sort((a, b) => {
    const aTime = new Date(a.dueDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.dueDate || b.createdAt || 0).getTime();
    return aTime - bTime;
  });

  const total = sorted.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const paid = sorted
    .filter((record) => record.status === 'paid')
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const due = Math.max(0, total - paid);
  const nextDue = sorted.find((record) => record.status !== 'paid') || null;

  return {
    total,
    paid,
    due,
    dueDate: nextDue ? formatDate(nextDue.dueDate) : null,
    payments: sorted.map(toStudentRecord),
  };
}

function buildMonthlyTrend(records) {
  const buckets = new Map();

  for (const record of records) {
    const anchor = record.status === 'paid' && record.paidAt ? record.paidAt : record.dueDate || record.createdAt;
    const date = new Date(anchor || Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    if (!buckets.has(key)) {
      buckets.set(key, { key, label, collected: 0, pending: 0 });
    }
    const bucket = buckets.get(key);
    if (record.status === 'paid') bucket.collected += Number(record.amount || 0);
    else bucket.pending += Number(record.amount || 0);
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)).map(({ key, ...rest }) => rest);
}

function buildStatusBreakdown(records) {
  const counts = { paid: 0, pending: 0, overdue: 0 };
  for (const record of records) {
    if (counts[record.status] !== undefined) counts[record.status] += 1;
  }
  return counts;
}

function buildTrendFromAgg(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const key = row._id;
    if (!key) continue;
    const label = `${key.slice(5, 7)}/${key.slice(0, 4)}`;
    grouped.set(key, {
      key,
      label,
      collected: Number(row.collected || 0),
      pending: Number(row.pending || 0),
    });
  }

  return [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key)).map(({ key, ...rest }) => rest);
}

async function syncOverdueRecords(userId = null) {
  const now = new Date();
  const filter = {
    status: 'pending',
    dueDate: { $lt: now },
  };
  if (userId) filter.userId = userId;
  await FeeRecord.updateMany(filter, { $set: { status: 'overdue' } });
}

async function getStudentFeeRecords(userId) {
  await syncOverdueRecords(userId);
  return FeeRecord.find({ userId }).sort({ dueDate: 1, createdAt: 1 }).lean();
}

export async function getMyFees(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // ensure caller is student (routes apply requireStudent, but double-check)
    if (req.user.role && req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student access only' });
    }

    const records = await getStudentFeeRecords(req.user.id);
    const fees = buildFeeSummary(records);
    if (fees.due > 0) {
      await upsertNotification({
        userId: req.user.id,
        type: 'general',
        key: `fee-reminder:${req.user.id}:${fees.dueDate || 'unknown'}`,
        title: 'Fee reminder',
        message: `${fees.due.toLocaleString('en-IN')} is due for your hostel fees.`,
        meta: { due: fees.due, dueDate: fees.dueDate },
      });
    }
    res.json({ success: true, fees, ...fees });
  } catch (e) {
    next(e);
  }
}

export async function payFees(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role && req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student access only' });
    }

    const amount = parsePositiveAmount(req.body?.amount);
    const method = normalizePaymentMethod(req.body?.method);

    if (!method) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const records = await getStudentFeeRecords(req.user.id);
    const unpaidRecords = records.filter((record) => record.status !== 'paid');
    const outstanding = unpaidRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
    if (outstanding <= 0) {
      const fees = buildFeeSummary(records);
      return res.json({ success: true, message: 'No outstanding fee due', fees, payment: null });
    }

    const payableAmount = amount ?? outstanding;

    // Only allow exact-full payments. Reject partial or overpayments.
    if (!Number.isFinite(payableAmount) || Math.abs(payableAmount - outstanding) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment amount must exactly match the outstanding due amount' });
    }

    const transactionId = `FEE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const paidAt = new Date();

    // Atomic-ish update: only update records that are still unpaid (pending/overdue).
    const targetIds = unpaidRecords.map((record) => record._id);
    const updateFilter = { _id: { $in: targetIds }, status: { $in: ['pending', 'overdue'] } };
    const update = {
      $set: {
        status: 'paid',
        paidAt,
        method,
        transactionId,
      },
    };

    const result = await FeeRecord.updateMany(updateFilter, update);

    // If no documents were modified, another request likely paid them already — avoid duplicate recording.
    const modified = result?.modifiedCount ?? result?.nModified ?? 0;
    if (modified <= 0) {
      const latest = await getStudentFeeRecords(req.user.id);
      const fees = buildFeeSummary(latest);
      return res.status(409).json({ success: false, message: 'Payment could not be applied (possibly already paid)', fees });
    }

    const updated = await getStudentFeeRecords(req.user.id);
    const fees = buildFeeSummary(updated);
    const latestPayment = fees.payments.find((record) => record.transactionId === transactionId) || null;

    await createNotification({
      userId: req.user.id,
      type: 'general',
      title: 'Fee payment received',
      message: `Payment of ${payableAmount.toLocaleString('en-IN')} was recorded successfully.`,
      meta: { key: `fee-paid:${transactionId}`, transactionId },
    });

    res.json({
      success: true,
      message: 'Fee payment recorded',
      fees,
      payment: latestPayment,
    });
  } catch (e) {
    next(e);
  }
}

export async function getAdminFees(req, res, next) {
  try {
    await syncOverdueRecords();
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }
    const status = String(req.query.status || 'all').toLowerCase();
    const semester = String(req.query.semester || '').trim().slice(0, 50);
    const search = normalizeSearchTerm(req.query.search);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || 20));

    const filters = {};
    if (status !== 'all') {
      if (!VALID_RECORD_STATUSES.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filters.status = status;
    }
    if (semester) filters.semester = semester;
    if (search) {
      const regex = new RegExp(search, 'i');
      const users = await User.find({ $or: [{ username: regex }, { email: regex }, { roomNumber: regex }] }).select('_id');
      filters.userId = { $in: users.map((user) => user._id) };
    }

    const [
      totalRecords,
      totalAgg,
      paidAgg,
      pendingAgg,
      overdueAgg,
      monthlyAgg,
      statusAgg,
      recentPayments,
      records,
    ] = await Promise.all([
      FeeRecord.countDocuments(filters),
      FeeRecord.aggregate([{ $match: filters }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      FeeRecord.aggregate([{ $match: { ...filters, status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      FeeRecord.aggregate([{ $match: { ...filters, status: 'pending' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      FeeRecord.aggregate([{ $match: { ...filters, status: 'overdue' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      FeeRecord.aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: { $ifNull: ['$paidAt', '$dueDate'] },
              },
            },
            collected: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 0, '$amount'] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      FeeRecord.aggregate([{ $match: filters }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      FeeRecord.find({ ...filters, status: 'paid' })
        .populate('userId', 'username email roomNumber')
        .sort({ paidAt: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      FeeRecord.find(filters)
        .populate('userId', 'username email roomNumber')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const summary = {
      totalRecords,
      totalAmount: totalAgg[0]?.amount || 0,
      paidAmount: paidAgg[0]?.amount || 0,
      pendingAmount: pendingAgg[0]?.amount || 0,
      overdueAmount: overdueAgg[0]?.amount || 0,
      outstandingAmount: (pendingAgg[0]?.amount || 0) + (overdueAgg[0]?.amount || 0),
      paidCount: statusAgg.find((row) => row._id === 'paid')?.count || 0,
      pendingCount: statusAgg.find((row) => row._id === 'pending')?.count || 0,
      overdueCount: statusAgg.find((row) => row._id === 'overdue')?.count || 0,
    };

    const analytics = {
      monthlyTrend: buildTrendFromAgg(monthlyAgg),
      statusBreakdown: {
        paid: summary.paidCount,
        pending: summary.pendingCount,
        overdue: summary.overdueCount,
      },
      recentPayments: recentPayments.map(toAdminRecord),
    };

    res.json({
      success: true,
      summary,
      analytics,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
      records: records.map(toAdminRecord),
    });
  } catch (e) {
    next(e);
  }
}

export async function updateFeeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid fee ID' });
    }

    if (!VALID_RECORD_STATUSES.has(String(status || '').toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid fee status' });
    }

    const fee = await FeeRecord.findById(id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const nextStatus = String(status).toLowerCase();
    const patch = { status: nextStatus };

    if (typeof notes === 'string') {
      patch.notes = notes.trim().slice(0, 500);
    }

    if (nextStatus === 'paid' && !fee.paidAt) {
      patch.paidAt = new Date();
      if (!fee.transactionId) {
        patch.transactionId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;
      }
      if (!patch.method) {
        patch.method = 'Manual';
      }
    }

    if (nextStatus === 'pending' || nextStatus === 'overdue') {
      patch.paidAt = fee.paidAt || null;
    }

    const updated = await FeeRecord.findByIdAndUpdate(id, patch, { new: true })
      .populate('userId', 'username email roomNumber')
      .lean();

    await syncOverdueRecords(updated?.userId?._id || updated?.userId || null);

    res.json({ success: true, fee: toAdminRecord(updated) });
  } catch (e) {
    next(e);
  }
}