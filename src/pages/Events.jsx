// src/pages/Events.jsx
import { useState, useEffect, useCallback } from 'react';
import { Card, SectionHeader, Badge, ProgressBar, Modal, Field, useToast } from '../components/ui';
import { api } from '../api/client';

const catColors = { hackathon:'var(--accent)', cultural:'var(--pink)', sports:'var(--green)', art:'var(--amber)', networking:'var(--teal)' };

function formatTeam(team) {
  return {
    id: team.id || team._id,
    teamName: team.teamName,
    teamCode: team.teamCode,
    maxSize: team.maxSize || 4,
    members: team.members || [],
  };
}

function TeamModal({ event, onClose, onSuccess }) {
  const [mode, setMode] = useState('create');
  const [members, setMembers] = useState([{ id: 1, roll: '', name: '' }, { id: 2, roll: '', name: '' }]);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [joinRoll, setJoinRoll] = useState('');
  const [joinName, setJoinName] = useState('');
  const [submittedTeam, setSubmittedTeam] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => setMembers((current) => [...current, { id: Date.now(), roll: '', name: '' }]);
  const removeMember = (id) => setMembers((current) => current.filter((member) => member.id !== id));
  const updateMember = (id, field, val) => setMembers((current) => current.map((member) => (member.id === id ? { ...member, [field]: val } : member)));

  const loadTeamMembers = (team) => setSubmittedTeam(formatTeam(team));

  const createTeam = async () => {
    const normalizedMembers = members.map((member) => ({ roll: member.roll.trim(), name: member.name.trim() })).filter((member) => member.roll && member.name);
    if (!teamName.trim()) return setError('Team name is required');
    if (normalizedMembers.length === 0) return setError('Add at least one member');
    const rolls = new Set(normalizedMembers.map((member) => member.roll.toLowerCase()));
    if (rolls.size !== normalizedMembers.length) return setError('Duplicate roll numbers are not allowed');
    try {
      setBusy(true);
      setError('');
      const response = await api(`/events/${event.id}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamName: teamName.trim(), members: normalizedMembers, maxSize: Math.max(4, normalizedMembers.length) }),
      });
      loadTeamMembers(response.team);
      onSuccess?.({ action: 'create', team: response.team, event: response.event });
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not create team');
    } finally {
      setBusy(false);
    }
  };

  const joinTeam = async () => {
    if (!teamCode.trim()) return setError('Enter a team code');
    if (!joinRoll.trim() || !joinName.trim()) return setError('Enter your roll number and name');
    try {
      setBusy(true);
      setError('');
      const response = await api(`/events/${event.id}/teams/join`, {
        method: 'POST',
        body: JSON.stringify({ teamCode: teamCode.trim(), roll: joinRoll.trim(), name: joinName.trim() }),
      });
      loadTeamMembers(response.team);
      onSuccess?.({ action: 'join', team: response.team, event: response.event });
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not join team');
    } finally {
      setBusy(false);
    }
  };

  const removeTeamMember = async (memberId) => {
    if (!submittedTeam) return;
    try {
      setBusy(true);
      setError('');
      const response = await api(`/events/${event.id}/teams/${submittedTeam.id}/members/${memberId}`, { method: 'DELETE' });
      loadTeamMembers(response.team);
    } catch (err) {
      setError(err.message || 'Could not remove member');
    } finally {
      setBusy(false);
    }
  };

  if (submittedTeam) {
    return (
      <div style={{ padding: '4px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700, marginBottom: 6 }}>Team saved</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{submittedTeam.teamName}</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace' }}>{submittedTeam.teamCode}</p>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'var(--text2)' }}>
            <span>Members</span>
            <span>{submittedTeam.members.length}/{submittedTeam.maxSize}</span>
          </div>
          {submittedTeam.members.map((member) => (
            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{member.roll}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeTeamMember(member.id)} disabled={busy}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary flex-1" onClick={onClose}>Done</button>
          <button className="btn btn-ghost" onClick={() => setSubmittedTeam(null)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Create or join a team for <strong style={{ color: 'var(--text)' }}>{event?.title}</strong></p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`btn btn-sm ${mode === 'create' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('create')}>Create</button>
        <button className={`btn btn-sm ${mode === 'join' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('join')}>Join</button>
      </div>
      {error && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--danger)' }}>{error}</div>}
      {mode === 'create' ? (
        <>
          <Field label="Team Name"><input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Team Phoenix" /></Field>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Team Members</label>
            {members.map((member, index) => (
              <div key={member.id} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input className="input" placeholder={`Roll No. (Member ${index + 1})`} value={member.roll} onChange={(e) => updateMember(member.id, 'roll', e.target.value)} style={{ flex: 1 }} />
                <input className="input" placeholder="Name" value={member.name} onChange={(e) => updateMember(member.id, 'name', e.target.value)} style={{ flex: 1 }} />
                {members.length > 1 && <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => removeMember(member.id)}>✕</button>}
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addMember}>+ Add Member</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary flex-1" onClick={createTeam} disabled={busy}>{busy ? 'Saving…' : 'Create Team'}</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <Field label="Team Code"><input className="input" value={teamCode} onChange={(e) => setTeamCode(e.target.value)} placeholder="Paste the team code" /></Field>
          <div className="grid-2" style={{ gap: 8 }}>
            <Field label="Your Roll Number"><input className="input" value={joinRoll} onChange={(e) => setJoinRoll(e.target.value)} placeholder="Roll number" /></Field>
            <Field label="Your Name"><input className="input" value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Full name" /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary flex-1" onClick={joinTeam} disabled={busy}>{busy ? 'Joining…' : 'Join Team'}</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [regs, setRegs] = useState({});
  const [teamStates, setTeamStates] = useState({});
  const [teamEvent, setTeamEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const normalizeEvent = (ev) => ({
    id: ev.id || ev._id || (ev._id && ev._id.toString()),
    title: ev.title,
    date: ev.startsAt || ev.date,
    time: ev.startsAt ? new Date(ev.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ev.time || '',
    venue: ev.venue || '',
    category: ev.category || 'hackathon',
    registered: !!ev.registered,
    waitlisted: !!ev.waitlisted,
    seats: ev.seats || ev.capacity || Math.max(100, (ev.registrationCount || 0) * 2),
    filled: (ev.registrationCount || 0) + (ev.teamCount || 0),
    waitlistCount: ev.waitlistCount || 0,
    prize: ev.prize || null,
    emoji: ev.emoji || '🎉',
  });

  const handleTeamSuccess = ({ action, team, event }) => {
    if (!event?.id || !team?.teamName) return;
    setTeamStates((current) => ({
      ...current,
      [event.id]: { action, teamName: team.teamName, teamCode: team.teamCode },
    }));
    toast.success(action === 'create' ? 'Team Created Successfully' : 'Successfully Registered');
    loadEvents({ silent: true });
  };

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const d = await api('/events');
      const list = (d.events || []).map(normalizeEvent);
      setEvents(list);
      setRegs(Object.fromEntries(list.map((e) => [e.id, e.registered ? 'registered' : e.waitlisted ? 'waitlisted' : 'none'])));
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const refresh = () => loadEvents({ silent: true });
    window.addEventListener('hostel:events', refresh);
    window.addEventListener('hostel:admin-stats', refresh);
    return () => {
      window.removeEventListener('hostel:events', refresh);
      window.removeEventListener('hostel:admin-stats', refresh);
    };
  }, [loadEvents]);

  const toggle = async (id) => {
    const state = regs[id] || 'none';
    const isRegistered = state === 'registered';
    const isWaitlisted = state === 'waitlisted';
    try {
      setActionId(id);
      setError(null);
      if (isWaitlisted) {
        const res = await api(`/events/${id}/register`, { method: 'DELETE' });
        setNotice('Removed from waitlist');
        if (res.promotedUserId) setNotice('A waitlisted student was promoted');
      } else if (!isRegistered) {
        const res = await api(`/events/${id}/register`, { method: 'POST' });
        if (res.status === 'registered') {
          setNotice('Registered successfully');
        } else if (res.status === 'waitlisted') {
          setNotice('Event is full — you were added to the waitlist');
        } else {
          setError('Unknown response from server');
        }
      } else {
        const res = await api(`/events/${id}/register`, { method: 'DELETE' });
        setNotice('Registration cancelled');
        if (res.promotedUserId) setNotice('A waitlisted student was promoted');
      }
      await loadEvents({ silent: true });
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Events & Hackathons</h1>
        <p className="page-desc">Campus events, competitions and team registration</p>
      </div>

      {(notice || refreshing) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{refreshing ? 'Refreshing event list…' : notice}</span>
          {refreshing && <span style={{ fontSize: 12, color: 'var(--accent)' }}>Live</span>}
        </div>
      )}

      {/* Featured */}
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>Loading events…</div>
      ) : error ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : events.slice(0, 1).map(e => {
        const color = catColors[e.category];
        return (
          <div key={e.id} style={{ background: `linear-gradient(135deg, ${color}18, var(--bg2))`, border: `1px solid ${color}44`, borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
            <Badge variant="blue" style={{ marginBottom: 10 }}>⭐ Featured</Badge>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 48 }}>{e.emoji}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{e.title}</h2>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text2)', flexWrap: 'wrap', marginBottom: 10 }}>
                  <span>📅 {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                  <span>⏰ {e.time}</span>
                  <span>📍 {e.venue}</span>
                  {e.prize && <span>🏆 {e.prize}</span>}
                </div>
                  {teamStates[e.id]?.action && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <Badge variant="green">{teamStates[e.id].action === 'create' ? 'Team Created' : 'Team Joined'}</Badge>
                    </div>
                  )}
                <ProgressBar value={e.filled} max={Math.max(1, e.seats)} color={color} />
                <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{e.filled} / {e.seats} registered{e.waitlistCount ? ` · ${e.waitlistCount} waitlisted` : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className={`btn ${regs[e.id] === 'registered' ? 'btn-ghost' : 'btn-primary'}`} disabled={actionId === e.id} onClick={() => toggle(e.id)}>
                  {actionId === e.id ? 'Working…' : regs[e.id] === 'registered' ? '✓ Registered' : regs[e.id] === 'waitlisted' ? '✓ Waitlisted' : 'Register →'}
                </button>
                {e.category === 'hackathon' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setTeamEvent(e)}>👥 Create Team</button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* All events */}
      <div className="grid-2" style={{ gap: 14 }}>
        {events.map(e => {
          const color = catColors[e.category];
          const fillPct = Math.round((e.filled / Math.max(1, e.seats)) * 100);
          const status = regs[e.id] || 'none';
          return (
            <div key={e.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'all .2s' }}
              onMouseEnter={el => { el.currentTarget.style.borderColor = color + '44'; el.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={el => { el.currentTarget.style.borderColor = 'var(--border)'; el.currentTarget.style.transform = ''; }}
            >
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{e.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }} className="truncate">{e.title}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge variant="gray">{e.category}</Badge>
                    {status === 'registered' && <Badge variant="green">Registered ✓</Badge>}
                    {status === 'waitlisted' && <Badge variant="amber">Waitlisted</Badge>}
                    {teamStates[e.id]?.action === 'create' && <Badge variant="green">Team Created</Badge>}
                    {teamStates[e.id]?.action === 'join' && <Badge variant="blue">Team Joined</Badge>}
                    {e.prize && <Badge variant="amber">🏆 {e.prize}</Badge>}
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span>📅 {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <span>⏰ {e.time}</span>
                  <span>📍 {e.venue}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--text3)' }}>
                    <span>{e.filled}/{e.seats} seats</span><span>{fillPct}%</span>
                  </div>
                  <ProgressBar value={e.filled} max={Math.max(1, e.seats)} color={color} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn flex-1 ${status === 'registered' ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ background: status === 'none' ? color : '', justifyContent: 'center' }}
                    disabled={actionId === e.id}
                    onClick={() => toggle(e.id)}>
                    {actionId === e.id ? 'Working…' : status === 'registered' ? '✓ Cancel Registration' : status === 'waitlisted' ? 'Leave Waitlist' : 'Register'}
                  </button>
                  {e.category === 'hackathon' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setTeamEvent(e)}>👥 Team</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!teamEvent} onClose={() => setTeamEvent(null)} title="Create / Join Team" width={480}>
        <TeamModal event={teamEvent} onClose={() => setTeamEvent(null)} onSuccess={handleTeamSuccess} />
      </Modal>
    </div>
  );
}
