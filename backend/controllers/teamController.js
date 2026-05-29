import crypto from 'crypto';
import mongoose from 'mongoose';
import { HostelEvent } from '../models/HostelEvent.js';
import { EventTeam } from '../models/EventTeam.js';
import { emitEventUpdate, emitAdminStatsUpdate } from '../services/socketService.js';
import { createNotification } from '../services/notificationService.js';

function normalizeRoll(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim();
}

function serializeTeam(team) {
  return {
    id: team._id.toString(),
    eventId: team.eventId.toString(),
    teamName: team.teamName,
    teamCode: team.teamCode,
    maxSize: team.maxSize,
    members: (team.members || []).map((member) => ({
      id: member._id?.toString?.() || String(member._id || ''),
      userId: member.userId ? member.userId.toString() : null,
      roll: member.roll,
      name: member.name,
      joinedAt: member.joinedAt,
    })),
    createdBy: team.createdBy.toString(),
    createdAt: team.createdAt,
  };
}

async function findEventOr404(eventId, res) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    res.status(400).json({ success: false, message: 'Invalid event id' });
    return null;
  }
  const event = await HostelEvent.findById(eventId).lean();
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return null;
  }
  return event;
}

export async function listTeams(req, res, next) {
  try {
    const event = await findEventOr404(req.params.eventId, res);
    if (!event) return;
    const teams = await EventTeam.find({ eventId: event._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, teams: teams.map(serializeTeam) });
  } catch (e) {
    next(e);
  }
}

export async function createTeam(req, res, next) {
  try {
    const event = await findEventOr404(req.params.eventId, res);
    if (!event) return;
    const teamName = normalizeName(req.body?.teamName);
    const rawMembers = Array.isArray(req.body?.members) ? req.body.members : [];
    const maxSize = Math.min(8, Math.max(1, Number(req.body?.maxSize) || rawMembers.length || 4));
    if (!teamName) return res.status(400).json({ success: false, message: 'Team name is required' });
    if (rawMembers.length === 0) return res.status(400).json({ success: false, message: 'At least one member is required' });
    if (rawMembers.length > maxSize) return res.status(400).json({ success: false, message: 'Team exceeds maximum size' });

    const members = rawMembers.map((member) => ({
      roll: normalizeRoll(member.roll),
      name: normalizeName(member.name),
    }));

    if (members.some((member) => !member.roll || !member.name)) {
      return res.status(400).json({ success: false, message: 'Each team member needs a roll number and name' });
    }

    const seen = new Set();
    for (const member of members) {
      if (seen.has(member.roll)) {
        return res.status(400).json({ success: false, message: 'Duplicate roll numbers are not allowed within a team' });
      }
      seen.add(member.roll);
    }

    const existingRolls = await EventTeam.find({ eventId: event._id }).lean();
    const existingRollSet = new Set();
    existingRolls.forEach((team) => {
      (team.members || []).forEach((member) => existingRollSet.add(normalizeRoll(member.roll)));
    });
    const clash = members.find((member) => existingRollSet.has(member.roll));
    if (clash) {
      return res.status(409).json({ success: false, message: `Roll number ${clash.roll} is already in another team` });
    }

    const teamCode = `TEAM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const team = await EventTeam.create({
      eventId: event._id,
      teamName,
      teamCode,
      createdBy: req.user.id,
      maxSize,
      members: members.map((member) => ({
        ...member,
        userId: null,
      })),
    });

    await createNotification({
      userId: req.user.id,
      type: 'event',
      title: 'Team created',
      message: `Your team ${teamName} has been created for ${event.title}.`,
      meta: { key: `team:${team._id}`, eventId: event._id.toString(), teamId: team._id.toString() },
    });

    emitEventUpdate({ action: 'team:create', eventId: event._id.toString(), team: serializeTeam(team) });
    emitAdminStatsUpdate({ reason: 'team_created' });

    res.status(201).json({ success: true, team: serializeTeam(team), event: { id: event._id.toString(), title: event.title } });
  } catch (e) {
    next(e);
  }
}

export async function joinTeam(req, res, next) {
  try {
    const event = await findEventOr404(req.params.eventId, res);
    if (!event) return;
    const teamId = req.body?.teamId || req.body?.teamCode;
    const roll = normalizeRoll(req.body?.roll);
    const name = normalizeName(req.body?.name);
    if (!teamId || !roll || !name) {
      return res.status(400).json({ success: false, message: 'teamId/teamCode, roll and name are required' });
    }

    const teamQuery = mongoose.Types.ObjectId.isValid(String(teamId))
      ? { _id: teamId, eventId: event._id }
      : { eventId: event._id, teamCode: String(teamId).trim().toUpperCase() };
    const team = await EventTeam.findOne(teamQuery);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.members.length >= team.maxSize) {
      return res.status(409).json({ success: false, message: 'Team is full' });
    }
    if (team.members.some((member) => normalizeRoll(member.roll) === roll)) {
      return res.status(409).json({ success: false, message: 'This roll number is already in the team' });
    }

    const duplicate = await EventTeam.findOne({
      eventId: event._id,
      _id: { $ne: team._id },
      'members.roll': new RegExp(`^${roll}$`, 'i'),
    }).lean();
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'This roll number already belongs to another team' });
    }

    team.members.push({ roll, name, userId: null, joinedAt: new Date() });
    await team.save();

    await createNotification({
      userId: req.user.id,
      type: 'event',
      title: 'Joined team',
      message: `You joined ${team.teamName} for ${event.title}.`,
      meta: { key: `team:${team._id}:joined:${roll}`, eventId: event._id.toString(), teamId: team._id.toString() },
    });

    emitEventUpdate({ action: 'team:join', eventId: event._id.toString(), team: serializeTeam(team) });
    emitAdminStatsUpdate({ reason: 'team_joined' });

    res.json({ success: true, team: serializeTeam(team), event: { id: event._id.toString(), title: event.title } });
  } catch (e) {
    next(e);
  }
}

export async function removeTeamMember(req, res, next) {
  try {
    const event = await findEventOr404(req.params.eventId, res);
    if (!event) return;
    const team = await EventTeam.findOne({ _id: req.params.teamId, eventId: event._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (String(team.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the team creator can remove members' });
    }

    const memberId = req.params.memberId;
    const before = team.members.length;
    team.members = team.members.filter((member) => String(member._id) !== String(memberId));
    if (team.members.length === before) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    await team.save();
    emitEventUpdate({ action: 'team:member-removed', eventId: event._id.toString(), team: serializeTeam(team) });
    emitAdminStatsUpdate({ reason: 'team_member_removed' });
    res.json({ success: true, team: serializeTeam(team) });
  } catch (e) {
    next(e);
  }
}
