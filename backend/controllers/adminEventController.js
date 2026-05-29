import mongoose from 'mongoose';
import { HostelEvent } from '../models/HostelEvent.js';
import { User } from '../models/User.js';
import { EventTeam } from '../models/EventTeam.js';
import { Notification } from '../models/Notification.js';
import {
  emitAdminStatsUpdate,
  emitEventNew,
  emitEventUpdate,
  emitEventCreated,
  emitEventUpdated,
  emitEventDeleted,
} from '../services/socketService.js';

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function createEvent(req, res, next) {
  try {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (startsAt && Number.isNaN(startsAt.getTime())) return res.status(400).json({ success: false, message: 'Invalid start date' });
    if (endsAt && Number.isNaN(endsAt.getTime())) return res.status(400).json({ success: false, message: 'Invalid end date' });
    if (startsAt && endsAt && endsAt < startsAt) return res.status(400).json({ success: false, message: 'End date must be after start date' });
    const seats = Number(body.seats);
    if (body.seats !== undefined && (!Number.isFinite(seats) || seats < 1)) return res.status(400).json({ success: false, message: 'Seats must be at least 1' });
    const ev = new HostelEvent({
      title,
      description: String(body.description || '').trim(),
      venue: String(body.venue || '').trim(),
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      seats: Number.isFinite(seats) && seats > 0 ? seats : 100,
      isActive: body.isActive === undefined ? true : !!body.isActive,
      prize: body.prize || null,
      emoji: body.emoji || '🎉',
      category: String(body.category || 'general').trim(),
    });
    await ev.save();
    const payload = { reason: 'event_created', event: { id: ev._id.toString(), title: ev.title } };
    emitEventNew(payload);
    emitEventCreated(payload);
    emitAdminStatsUpdate({ reason: 'event_created' });
    res.json({ success: true, id: ev._id.toString(), event: { id: ev._id.toString(), title: ev.title } });
  } catch (e) {
    next(e);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const body = req.body || {};
    const update = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      update.title = title;
    }
    if (body.description !== undefined) update.description = String(body.description || '').trim();
    if (body.venue !== undefined) update.venue = String(body.venue || '').trim();
    if (body.startsAt !== undefined) {
      const startsAt = body.startsAt ? new Date(body.startsAt) : null;
      if (startsAt && Number.isNaN(startsAt.getTime())) return res.status(400).json({ success: false, message: 'Invalid start date' });
      update.startsAt = startsAt;
    }
    if (body.endsAt !== undefined) {
      const endsAt = body.endsAt ? new Date(body.endsAt) : null;
      if (endsAt && Number.isNaN(endsAt.getTime())) return res.status(400).json({ success: false, message: 'Invalid end date' });
      update.endsAt = endsAt;
    }
    if (body.seats !== undefined) {
      const seats = Number(body.seats);
      if (!Number.isFinite(seats) || seats < 1) return res.status(400).json({ success: false, message: 'Seats must be at least 1' });
      update.seats = seats;
    }
    if (body.isActive !== undefined) update.isActive = !!body.isActive;
    if (body.prize !== undefined) update.prize = body.prize;
    if (body.emoji !== undefined) update.emoji = body.emoji;
    if (body.category !== undefined) update.category = String(body.category || '').trim();

    if (update.startsAt && update.endsAt && update.endsAt < update.startsAt) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const updated = await HostelEvent.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    const payload = { reason: 'event_updated', event: { id: updated._id.toString(), title: updated.title } };
    emitEventUpdate(payload);
    emitEventUpdated(payload);
    emitAdminStatsUpdate({ reason: 'event_updated' });
    res.json({ success: true, event: { id: updated._id.toString(), title: updated.title } });
  } catch (e) {
    next(e);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const ev = await HostelEvent.findById(id).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });

    const teamRows = await EventTeam.find({ eventId: id }).select('_id').lean();
    const teamIds = teamRows.map((team) => String(team._id));

    const [deleteEventResult, teamResult, notificationResult] = await Promise.all([
      HostelEvent.deleteOne({ _id: id }),
      EventTeam.deleteMany({ eventId: id }),
      Notification.deleteMany({
        $or: [
          { 'meta.eventId': id },
          { 'meta.key': new RegExp(`^event:${id}:`) },
          ...(teamIds.length ? [{ 'meta.teamId': { $in: teamIds } }] : []),
        ],
      }),
    ]);

    if ((deleteEventResult?.deletedCount || 0) < 1) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const payload = { reason: 'event_deleted', eventId: id };
    emitEventUpdate(payload);
    emitEventDeleted(payload);
    emitAdminStatsUpdate({ reason: 'event_deleted' });
    res.json({
      success: true,
      deletedEventId: id,
      removedTeams: teamResult?.deletedCount || 0,
      removedNotifications: notificationResult?.deletedCount || 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function listParticipants(req, res, next) {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const ev = await HostelEvent.findById(id).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    // Populate simple user info for registrations and waitlist
    const regUserIds = (ev.registrations || []).map((r) => r.userId);
    const wlUserIds = (ev.waitlist || []).map((r) => r.userId);
    const users = await User.find({ _id: { $in: [...regUserIds, ...wlUserIds] } }).select('username email roomNumber').lean();
    const userById = Object.fromEntries(users.map((u) => [String(u._id), u]));

    const registrations = (ev.registrations || []).map((r) => ({ user: userById[String(r.userId)] || null, registeredAt: r.registeredAt }));
    const waitlist = (ev.waitlist || []).map((r) => ({ user: userById[String(r.userId)] || null, addedAt: r.registeredAt }));
    res.json({ success: true, registrations, waitlist });
  } catch (e) {
    next(e);
  }
}

export async function getEventAnalytics(req, res, next) {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const _id = new mongoose.Types.ObjectId(id);
    // total counts
    const ev = await HostelEvent.findById(id).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    const totalRegs = (ev.registrations || []).length;
    const waitlistCount = (ev.waitlist || []).length;

    // registrations by day (last 30 days)
    const DAY_MS = 24 * 60 * 60 * 1000;
    const since = new Date(Date.now() - 30 * DAY_MS);
    const agg = await HostelEvent.aggregate([
      { $match: { _id } },
      { $unwind: '$registrations' },
      { $match: { 'registrations.registeredAt': { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$registrations.registeredAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).allowDiskUse(true);

    res.json({ success: true, totalRegs, waitlistCount, recentRegistrations: agg.map((a) => ({ date: a._id, count: a.count })) });
  } catch (e) {
    next(e);
  }
}
