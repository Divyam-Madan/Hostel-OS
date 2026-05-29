import mongoose from 'mongoose';
import { HostelEvent } from '../models/HostelEvent.js';
import { EventTeam } from '../models/EventTeam.js';
import { createNotification } from '../services/notificationService.js';
import {
  emitAdminStatsUpdate,
  emitEventUpdate,
  emitEventUpdated,
} from '../services/socketService.js';

function serializeEvent(ev, currentUserId = null) {
  const registrations = ev.registrations || [];
  const waitlist = ev.waitlist || [];
  const currentUser = currentUserId ? String(currentUserId) : '';
  return {
    id: ev._id.toString(),
    title: ev.title,
    description: ev.description,
    venue: ev.venue,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    isActive: ev.isActive,
    registrationCount: registrations.length,
    seats: ev.seats || 0,
    waitlistCount: waitlist.length,
    registered: !!currentUser && registrations.some((r) => String(r.userId) === currentUser),
    waitlisted: !!currentUser && waitlist.some((r) => String(r.userId) === currentUser),
    createdAt: ev.createdAt,
  };
}

async function broadcastEventChange(eventId, reason) {
  const fresh = await HostelEvent.findById(eventId).lean();
  if (fresh) {
    const payload = { reason, event: serializeEvent(fresh) };
    emitEventUpdate(payload);
    emitEventUpdated(payload);
  }
  emitAdminStatsUpdate({ reason });
}

export async function listEvents(req, res, next) {
  try {
    const events = await HostelEvent.find().sort({ startsAt: -1 }).lean();
    const eventIds = events.map((ev) => ev._id);
    const teamCounts = eventIds.length
      ? await EventTeam.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        { $group: { _id: '$eventId', count: { $sum: 1 } } },
      ])
      : [];
    const teamCountByEvent = new Map(teamCounts.map((row) => [String(row._id), row.count]));
    const out = events.map((ev) => ({
      ...serializeEvent(ev, req.user?.id),
      teamCount: teamCountByEvent.get(String(ev._id)) || 0,
    }));
    res.json({ success: true, events: out });
  } catch (e) {
    next(e);
  }
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function registerEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event id' });
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const uid = new mongoose.Types.ObjectId(userId);

    const ev = await HostelEvent.findById(eventId).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });

    const now = Date.now();
    if (ev.startsAt && new Date(ev.startsAt).getTime() <= now) return res.status(400).json({ success: false, message: 'Cannot modify registrations after event has started' });

    // Registration cutoff / inactive
    const registrationNow = Date.now();
    if (!ev.isActive) return res.status(400).json({ success: false, message: 'Event not accepting registrations' });
    if (ev.startsAt && new Date(ev.startsAt).getTime() <= registrationNow) return res.status(400).json({ success: false, message: 'Registration closed (event started)' });

    const alreadyReg = (ev.registrations || []).some((r) => String(r.userId) === String(userId));
    if (alreadyReg) return res.status(409).json({ success: false, message: 'Already registered' });
    const alreadyWL = (ev.waitlist || []).some((r) => String(r.userId) === String(userId));
    if (alreadyWL) return res.status(409).json({ success: false, message: 'Already on waitlist' });

    // Try to register if seats available (atomic)
    const canRegister = (ev.registrations || []).length < (ev.seats || 0);
    if (canRegister) {
      const updated = await HostelEvent.findOneAndUpdate(
        { _id: eventId, 'registrations.userId': { $ne: uid }, $expr: { $lt: [{ $size: '$registrations' }, ev.seats || 0] } },
        { $push: { registrations: { userId: uid, registeredAt: new Date() } } },
        { new: true }
      ).lean();
      if (updated) {
        await broadcastEventChange(eventId, 'event_registered');
        await createNotification({
          userId,
          type: 'general',
          title: 'Event registration confirmed',
          message: `You are registered for ${ev.title}.`,
          meta: { key: `event:${eventId}:registered:${userId}`, eventId },
        });
        return res.json({ success: true, status: 'registered', registrationCount: (updated.registrations || []).length });
      }
      // fallthrough to waitlist if race filled the seats
    }

    // Add to waitlist
    const wlUpdated = await HostelEvent.findOneAndUpdate(
      { _id: eventId, 'waitlist.userId': { $ne: uid } },
      { $push: { waitlist: { userId: uid, registeredAt: new Date() } } },
      { new: true }
    ).lean();
    if (wlUpdated) {
      await broadcastEventChange(eventId, 'event_waitlisted');
      await createNotification({
        userId,
        type: 'general',
        title: 'Event waitlisted',
        message: `You are on the waitlist for ${ev.title}.`,
        meta: { key: `event:${eventId}:waitlisted:${userId}`, eventId },
      });
      return res.status(200).json({ success: true, status: 'waitlisted', waitlistCount: (wlUpdated.waitlist || []).length });
    }

    // Re-fetch to determine reason
    const fresh = await HostelEvent.findById(eventId).lean();
    const nowReg = (fresh.registrations || []).some((r) => String(r.userId) === String(userId));
    if (nowReg) return res.json({ success: true, status: 'registered', registrationCount: (fresh.registrations || []).length });
    const nowWL = (fresh.waitlist || []).some((r) => String(r.userId) === String(userId));
    if (nowWL) return res.status(200).json({ success: true, status: 'waitlisted', waitlistCount: (fresh.waitlist || []).length });

    return res.status(400).json({ success: false, message: 'Could not register' });
  } catch (e) {
    next(e);
  }
}

export async function unregisterEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event id' });
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const uid = new mongoose.Types.ObjectId(userId);

    const ev = await HostelEvent.findById(eventId).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });

    const inReg = (ev.registrations || []).some((r) => String(r.userId) === String(userId));
    const inWL = (ev.waitlist || []).some((r) => String(r.userId) === String(userId));

    if (inReg) {
      // remove from registrations
      await HostelEvent.updateOne({ _id: eventId }, { $pull: { registrations: { userId: uid } } });
      // promote first waitlist entry if present
      const fresh = await HostelEvent.findById(eventId).lean();
      const next = (fresh.waitlist || [])[0];
      let promoted = null;
      if (next) {
        const nextId = next.userId;
        const r = await HostelEvent.findOneAndUpdate(
          { _id: eventId, 'waitlist.userId': nextId },
          { $pull: { waitlist: { userId: nextId } }, $push: { registrations: { userId: nextId, registeredAt: new Date() } } },
          { new: true }
        ).lean();
        if (r) promoted = String(nextId);
      }
      const after = await HostelEvent.findById(eventId).lean();
      await broadcastEventChange(eventId, 'event_unregistered');
      await createNotification({
        userId,
        type: 'general',
        title: 'Event registration removed',
        message: `Your registration for ${ev.title} was removed.`,
        meta: { key: `event:${eventId}:unregistered:${userId}`, eventId },
      });
      return res.json({ success: true, registrationCount: (after.registrations || []).length, promotedUserId: promoted });
    }

    if (inWL) {
      await HostelEvent.updateOne({ _id: eventId }, { $pull: { waitlist: { userId: uid } } });
      const after = await HostelEvent.findById(eventId).lean();
      await broadcastEventChange(eventId, 'event_waitlist_removed');
      await createNotification({
        userId,
        type: 'general',
        title: 'Removed from waitlist',
        message: `You were removed from the waitlist for ${ev.title}.`,
        meta: { key: `event:${eventId}:waitlist-removed:${userId}`, eventId },
      });
      return res.json({ success: true, waitlistCount: (after.waitlist || []).length });
    }

    return res.status(400).json({ success: false, message: 'User not registered or on waitlist' });
  } catch (e) {
    next(e);
  }
}
