import { Leave } from '../models/Leave.js';
import { User } from '../models/User.js';
import {
  emitAdminStatsUpdate,
  emitLeaveNew,
  emitLeaveUpdate,
  emitLeaveCreated,
  emitLeaveUpdated,
} from '../services/socketService.js';
import {
  sanitizeReason,
  parseAndValidateDate,
  validateParentConsent,
  validateReturnTime,
} from '../utils/validators.js';

// ─── STUDENT ENDPOINTS ───

export async function getMyLeaves(req, res, next) {
  try {
    const leaves = await Leave.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ leaves });
  } catch (e) {
    next(e);
  }
}

export async function submitLeave(req, res, next) {
  try {
    const { type, from, to, reason, parentConsent, returnTime } = req.body;

    // Validate type
    if (!['leave', 'outing'].includes(type)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }

    // Validate required fields present
    if (!from || !to || !reason || !parentConsent) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Sanitize and validate inputs
    const sanitizedReason = sanitizeReason(reason);
    const validatedConsent = validateParentConsent(parentConsent);
    let validatedReturnTime = null;

    // Parse and validate dates
    const fromDate = parseAndValidateDate(from, 'from date');
    const toDate = parseAndValidateDate(to, 'to date');

    if (toDate < fromDate) {
      return res.status(400).json({ message: 'To date cannot be before from date' });
    }

    // Validate return time for outings
    if (type === 'outing') {
      if (!returnTime) {
        return res.status(400).json({ message: 'Return time is required for outings' });
      }
      validatedReturnTime = validateReturnTime(returnTime);
      // For outing, to date must equal from date
      if (toDate.getTime() !== fromDate.getTime()) {
        return res.status(400).json({ message: 'For outings, from and to dates must be the same day' });
      }
    }

    // Check leave length for leave type
    if (type === 'leave') {
      const days = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 7) {
        return res.status(400).json({ message: 'Leave cannot exceed 7 consecutive days' });
      }
    }

    // Check for overlapping leave/outing records (pending or approved)
    const overlapping = await Leave.findOne({
      userId: req.user.id,
      status: { $in: ['pending', 'approved'] },
      from: { $lte: toDate },
      to: { $gte: fromDate },
    });

    if (overlapping) {
      return res.status(409).json({ message: 'You already have a pending or approved leave/outing during this period' });
    }

    // Create leave record
    const leave = new Leave({
      userId: req.user.id,
      type,
      from: fromDate,
      to: type === 'leave' ? toDate : fromDate,
      reason: sanitizedReason,
      parentConsent: validatedConsent,
      returnTime: validatedReturnTime,
      status: 'pending',
    });

    await leave.save();
    const payload = {
      id: leave._id.toString(),
      userId: leave.userId?.toString?.() || req.user.id,
      type: leave.type,
      status: leave.status,
      createdAt: leave.createdAt,
    };
    emitLeaveNew(payload);
    emitLeaveCreated(payload);
    emitAdminStatsUpdate({ reason: 'leave_submitted' });
    res.json({ success: true, leave });
  } catch (e) {
    next(e);
  }
}

// ─── ADMIN ENDPOINTS ───

export async function getAllLeaves(req, res, next) {
  try {
    const filters = {};
    if (req.query.status && req.query.status !== 'all') {
      if (!['pending', 'approved', 'rejected'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filters.status = req.query.status;
    }
    if (req.query.type && req.query.type !== 'all') {
      if (!['leave', 'outing'].includes(req.query.type)) {
        return res.status(400).json({ message: 'Invalid type filter' });
      }
      filters.type = req.query.type;
    }
    if (req.query.search) {
      // Escape regex special characters in search string
      const escapedSearch = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 50);
      const regex = new RegExp(escapedSearch, 'i');
      const users = await User.find({ $or: [{ username: regex }, { name: regex }] }).select('_id');
      filters.userId = { $in: users.map(u => u._id) };
    }

    const leaves = await Leave.find(filters)
      .populate('userId', 'username name roomNumber')
      .populate('approvedBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .limit(100) // Prevent large result sets
      .lean();

    res.json({ leaves });
  } catch (e) {
    next(e);
  }
}

export async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const approverId = req.user.id === 'admin' ? null : req.user.id;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid leave ID' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Ensure leave is pending
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve leave with status: ${leave.status}` });
    }

    // Sanitize notes if provided
    let sanitizedNotes = '';
    if (notes && typeof notes === 'string') {
      sanitizedNotes = notes.trim().substring(0, 500);
    }

    const updated = await Leave.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: approverId,
        approverNotes: sanitizedNotes,
      },
      { new: true }
    )
      .populate('userId', 'username name')
      .populate('approvedBy', 'name employeeId');

    emitAdminStatsUpdate({ reason: 'leave_approved' });
    const payload = {
      id: updated._id.toString(),
      userId: updated.userId?.toString?.() || null,
      status: updated.status,
      type: updated.type,
      updatedAt: updated.updatedAt,
    };
    emitLeaveUpdate(payload);
    emitLeaveUpdated(payload);
    res.json({ success: true, leave: updated });
  } catch (e) {
    next(e);
  }
}

export async function rejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const approverId = req.user.id === 'admin' ? null : req.user.id;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid leave ID' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Ensure leave is pending
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject leave with status: ${leave.status}` });
    }

    // Sanitize notes if provided
    let sanitizedNotes = '';
    if (notes && typeof notes === 'string') {
      sanitizedNotes = notes.trim().substring(0, 500);
    }

    const updated = await Leave.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy: approverId,
        approverNotes: sanitizedNotes,
      },
      { new: true }
    )
      .populate('userId', 'username name')
      .populate('approvedBy', 'name employeeId');

    emitAdminStatsUpdate({ reason: 'leave_rejected' });
    const payload = {
      id: updated._id.toString(),
      userId: updated.userId?.toString?.() || null,
      status: updated.status,
      type: updated.type,
      updatedAt: updated.updatedAt,
    };
    emitLeaveUpdate(payload);
    emitLeaveUpdated(payload);
    res.json({ success: true, leave: updated });
  } catch (e) {
    next(e);
  }
}
