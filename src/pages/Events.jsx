// src/pages/Events.jsx
import { useState } from 'react';
import { Card, SectionHeader, Badge, ProgressBar, Modal, Field } from '../components/ui';
import { events } from '../data/mockData';
import { randomId } from '../utils';

const catColors = { hackathon:'var(--accent)', cultural:'var(--pink)', sports:'var(--green)', art:'var(--amber)', networking:'var(--teal)' };

function TeamModal({ event, onClose }) {
  const [members, setMembers] = useState([{ id:1, roll:'', name:'' }, { id:2, roll:'', name:'' }]);
  const [teamName, setTeamName] = useState('');
  const [created, setCreated] = useState(null);

  const addMember = () => setMembers(m => [...m, { id: Date.now(), roll: '', name: '' }]);
  const removeMember = (id) => setMembers(m => m.filter(x => x.id !== id));
  const updateMember = (id, field, val) => setMembers(m => m.map(x => x.id === id ? { ...x, [field]: val } : x));

  if (created) return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Team Created!</h3>
      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14, margin: '12px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Team Name</p>
        <p style={{ fontSize: 16, fontWeight: 700 }}>{created.name}</p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>Team ID</p>
        <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent2)' }}>{created.id}</p>
      </div>
      <button className="btn btn-primary" onClick={onClose}>Done</button>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Create a team for <strong style={{ color: 'var(--text)' }}>{event?.title}</strong></p>
      <Field label="Team Name"><input className="input" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Team Phoenix" /></Field>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Team Members</label>
        {members.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input className="input" placeholder={`Roll No. (Member ${i+1})`} value={m.roll} onChange={e => updateMember(m.id, 'roll', e.target.value)} style={{ flex: 1 }} />
            <input className="input" placeholder="Name" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} style={{ flex: 1 }} />
            {members.length > 1 && <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => removeMember(m.id)}>✕</button>}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addMember}>+ Add Member</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary flex-1" onClick={() => teamName && setCreated({ name: teamName, id: randomId('TEAM') })}>
          Create Team
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function Events() {
  const [regs, setRegs] = useState(() => Object.fromEntries(events.map(e => [e.id, e.registered])));
  const [teamEvent, setTeamEvent] = useState(null);

  const toggle = (id) => setRegs(r => ({ ...r, [id]: !r[id] }));

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Events & Hackathons</h1>
        <p className="page-desc">Campus events, competitions and team registration</p>
      </div>

      {/* Featured */}
      {events.slice(0, 1).map(e => {
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
                <ProgressBar value={e.filled} max={e.seats} color={color} />
                <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{e.filled} / {e.seats} registered</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className={`btn ${regs[e.id] ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggle(e.id)}>
                  {regs[e.id] ? '✓ Registered' : 'Register →'}
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
          const fillPct = Math.round((e.filled / e.seats) * 100);
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
                    {regs[e.id] && <Badge variant="green">Registered ✓</Badge>}
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
                  <ProgressBar value={e.filled} max={e.seats} color={color} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn flex-1 ${regs[e.id] ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ background: !regs[e.id] ? color : '', justifyContent: 'center' }}
                    onClick={() => toggle(e.id)}>
                    {regs[e.id] ? '✓ Cancel Registration' : 'Register'}
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
        <TeamModal event={teamEvent} onClose={() => setTeamEvent(null)} />
      </Modal>
    </div>
  );
}
