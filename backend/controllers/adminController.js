import { Complaint } from '../models/Complaint.js';
import { FoodReview } from '../models/FoodReview.js';
import { Alert } from '../models/Alert.js';
import { Admin } from '../models/Admin.js';
import { env } from '../config/env.js';
import { summarizeComplaints, analyzeFoodReviews } from '../services/geminiService.js';
import { emitAlertNew } from '../services/socketService.js';
import {
  adminSignupRequest,
  adminLoginRequest,
  adminVerifyOtpAndToken,
} from '../services/adminAuthService.js';

export async function complaintSummary(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.body;
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: 'dateFrom and dateTo (YYYY-MM-DD) required' });
    }
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    const list = await Complaint.find({ createdAt: { $gte: from, $lte: to } })
      .select('category title description priority status createdAt')
      .lean();
    const lines = list.map((c) =>
      JSON.stringify({
        category: c.category,
        title: c.title,
        description: c.description,
        priority: c.priority,
        status: c.status,
        date: c.createdAt,
      })
    );
    const summary = await summarizeComplaints(lines.join('\n'));
    res.json({ success: true, count: list.length, summary });
  } catch (e) {
    next(e);
  }
}

export async function foodSummary(req, res, next) {
  try {
    const days = Number(req.body.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const list = await FoodReview.find({ createdAt: { $gte: since } })
      .select('foodItem rating comment')
      .lean();
    const lines = list.map((r) => `${r.foodItem}\t${r.rating}\t${r.comment || ''}`);
    const analysis = await analyzeFoodReviews(lines.join('\n'));
    res.json({ success: true, count: list.length, analysis });
  } catch (e) {
    next(e);
  }
}

export async function listAlerts(req, res, next) {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({
      success: true,
      alerts: alerts.map((a) => ({
        id: a._id.toString(),
        type: a.type,
        title: a.title,
        message: a.message,
        read: a.read,
        resolved: a.resolved,
        createdAt: a.createdAt,
        meta: a.meta,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function patchAlert(req, res, next) {
  try {
    const { read, resolved } = req.body;
    const patch = {};
    if (typeof read === 'boolean') patch.read = read;
    if (typeof resolved === 'boolean') patch.resolved = resolved;
    const a = await Alert.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, alert: a });
  } catch (e) {
    next(e);
  }
}

/**
 * Admin-triggered operational alerts (e.g. wheelchair assistance).
 */
export async function triggerAlert(req, res, next) {
  try {
    const { type, title, message } = req.body;
    const t = ['wheelchair', 'general', 'mess'].includes(type) ? type : 'general';
    const alert = await Alert.create({
      type: t === 'wheelchair' ? 'wheelchair' : t,
      title: title || 'Admin alert',
      message: message || '',
      meta: { source: 'admin' },
    });
    const payload = {
      id: alert._id.toString(),
      type: alert.type,
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt,
    };
    emitAlertNew(payload);
    res.status(201).json({ success: true, alert: payload });
  } catch (e) {
    next(e);
  }
}

export async function adminSignup(req, res, next) {
  try {
    const result = await adminSignupRequest(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function adminLogin(req, res, next) {
  try {
    const result = await adminLoginRequest(req.body);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function verifyAdminOtp(req, res, next) {
  try {
    const { token, user } = await adminVerifyOtpAndToken(req.body);
    res.json({ success: true, token, user, role: 'admin' });
  } catch (e) {
    next(e);
  }
}

/** Profile for JWT admin sessions (legacy hardcoded admin or registered Admin document). */
export async function adminProfile(req, res, next) {
  try {
    if (req.user.id === 'admin') {
      return res.json({
        success: true,
        user: {
          id: 'admin',
          name: env.ADMIN_USERNAME,
          username: env.ADMIN_USERNAME,
          email: 'admin@hostelos.local',
          employeeId: null,
          photo: 'AD',
        },
      });
    }
    const admin = await Admin.findById(req.user.id).select('-password -otp');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const initials = String(admin.name || 'A')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';
    res.json({
      success: true,
      user: {
        id: admin._id.toString(),
        name: admin.name,
        username: admin.name,
        email: admin.email,
        employeeId: admin.employeeId,
        photo: initials,
      },
    });
  } catch (e) {
    next(e);
  }
}
