import { User } from '../models/User.js';
import { Alert } from '../models/Alert.js';
import { sendHealthReportEmail } from '../services/emailService.js';
import { env } from '../config/env.js';
import { emitAlertNew } from '../services/socketService.js';

/**
 * Student reports a health issue: email health centre + admin alert in DB.
 */
export async function reportHealthIssue(req, res, next) {
  try {
    const { description } = req.body;
    if (!description || String(description).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please describe the issue (min 5 chars)' });
    }
    const u = await User.findById(req.user.id).select('username email roomNumber');
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });

    const text = String(description).trim();
    await sendHealthReportEmail({
      to: env.HEALTH_CENTER_EMAIL,
      username: u.username,
      roomNumber: u.roomNumber,
      description: text,
    });

    const alert = await Alert.create({
      type: 'healthcare',
      title: `Health report — ${u.username}`,
      message: text,
      userId: u._id,
      meta: { roomNumber: u.roomNumber, email: u.email },
    });

    const payload = {
      id: alert._id.toString(),
      type: alert.type,
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt,
    };
    emitAlertNew(payload);
    res.status(201).json({ success: true, message: 'Report sent to health centre', alert: payload });
  } catch (e) {
    next(e);
  }
}
