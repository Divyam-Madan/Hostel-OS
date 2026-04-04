// src/pages/Gym.jsx
import { useState } from 'react';
import { Card, SectionHeader, GlowCard, Badge, ProgressBar, Modal, Field } from '../components/ui';
import { gymData } from '../data/mockData';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const MORNING_SLOTS = ['5:30','6:00','6:30','7:00','7:30'];
const EVENING_SLOTS = ['5:00','5:30','6:00','6:30','7:00','7:30','8:00','8:30'];

export default function Gym() {
  const [tab, setTab] = useState('free'); // 'free' | 'paid'
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [session, setSession] = useState('morning');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [booked, setBooked] = useState(null);

  const slots = session === 'morning' ? MORNING_SLOTS : EVENING_SLOTS;
  const capPct = Math.round((gymData.currentCapacity / gymData.maxCapacity) * 100);

  const confirmBook = () => {
    setBooked({ day: selectedDay, slot: selectedSlot, session, mode: tab });
    setSelectedSlot(null);
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Gym & Wellness</h1>
        <p className="page-desc">Fitness center registration, slot booking and facility info</p>
      </div>

      {/* Membership status */}
      {gymData.registered ? (
        <GlowCard color="var(--green)" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 40 }}>🏋️</span>
            <div style={{ flex: 1 }}>
              <Badge variant="green" style={{ marginBottom: 4 }}>Active Member</Badge>
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>Membership Valid</p>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                {gymData.plan} plan · Expires {new Date(gymData.expiresOn).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm">Renew</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setComplaintOpen(true)}>Report Issue</button>
            </div>
          </div>
        </GlowCard>
      ) : (
        <Card className="card-p" style={{ marginBottom: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🏋️</span>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 6px' }}>Join the Gym</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Fully equipped gym with certified trainer.</p>
          <button className="btn btn-primary">Register Now</button>
        </Card>
      )}

      {/* Confirmed booking */}
      {booked && (
        <div className="animate-fadeUp" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Slot Booked!</p>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              {booked.day} · {booked.session === 'morning' ? '🌅' : '🌆'} {booked.slot} AM · {booked.mode === 'paid' ? '💳 Paid (₹50)' : '🆓 Free'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setBooked(null)} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>Cancel</button>
        </div>
      )}

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Live occupancy */}
        <Card className="card-p">
          <SectionHeader title="Live Occupancy" subtitle="Current gym status" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font2)' }}>{gymData.currentCapacity}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)', alignSelf: 'flex-end' }}>/ {gymData.maxCapacity} max</span>
            </div>
            <ProgressBar value={gymData.currentCapacity} max={gymData.maxCapacity}
              color={capPct > 80 ? 'var(--red)' : capPct > 60 ? 'var(--amber)' : 'var(--green)'} />
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
              {capPct > 80 ? '🔴 Very busy — consider off-peak' : capPct > 60 ? '🟡 Moderate crowd' : '🟢 Plenty of space'}
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}><strong>Trainer:</strong> {gymData.trainer}</p>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}><strong>Timings:</strong> {gymData.timings}</p>
          </div>
        </Card>

        {/* Equipment */}
        <Card className="card-p">
          <SectionHeader title="Equipment Available" />
          {gymData.equipment.map(eq => (
            <div key={eq} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--green)' }}>✓</span><span>{eq}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Slot booking — paid/free toggle */}
      <Card className="card-p">
        <SectionHeader title="Book a Slot" subtitle="Reserve your gym time in advance" />

        {/* Paid / Free toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ v:'free', label:'🆓 Free Access', sub:'Walk-in · No booking needed' },
            { v:'paid', label:'💳 Priority Booking (₹50)', sub:'Reserved slot · No wait' }].map(m => (
            <div key={m.v} onClick={() => setTab(m.v)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer',
              border: `1.5px solid ${tab === m.v ? 'var(--accent)' : 'var(--border2)'}`,
              background: tab === m.v ? 'rgba(99,102,241,0.08)' : 'var(--bg3)', transition: 'all .2s',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: tab === m.v ? 'var(--accent2)' : 'var(--text)' }}>{m.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Day picker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {DAYS.map(d => (
            <button key={d} onClick={() => { setSelectedDay(d); setSelectedSlot(null); }} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: selectedDay === d ? 'var(--accent)' : 'var(--bg3)',
              color: selectedDay === d ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)', transition: 'all .2s',
            }}>{d}</button>
          ))}
        </div>

        {/* Session toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[{ v:'morning', label:'🌅 Morning (5:30–8 AM)' }, { v:'evening', label:'🌆 Evening (5–9 PM)' }].map(s => (
            <button key={s.v} onClick={() => { setSession(s.v); setSelectedSlot(null); }} style={{
              flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${session === s.v ? 'var(--accent)' : 'var(--border2)'}`,
              background: session === s.v ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: session === s.v ? 'var(--accent2)' : 'var(--text2)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .2s',
            }}>{s.label}</button>
          ))}
        </div>

        {/* Slot cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {slots.map(slot => {
            const busy = ['6:00','7:00','6:30'].includes(slot);
            const sel = selectedSlot === slot;
            return (
              <div key={slot} onClick={() => !busy && setSelectedSlot(s => s === slot ? null : slot)} style={{
                padding: '10px 16px', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${sel ? 'var(--accent)' : busy ? 'transparent' : 'var(--border2)'}`,
                background: sel ? 'rgba(99,102,241,0.12)' : busy ? 'rgba(239,68,68,0.08)' : 'var(--bg3)',
                opacity: busy ? 0.5 : 1, transition: 'all .2s', textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: sel ? 'var(--accent2)' : busy ? 'var(--red)' : 'var(--text)' }}>
                  {slot} {session === 'morning' ? 'AM' : 'PM'}
                </p>
                <p style={{ fontSize: 10, color: busy ? 'var(--red)' : 'var(--text3)', marginTop: 2 }}>
                  {busy ? 'Full' : 'Available'}
                </p>
              </div>
            );
          })}
        </div>

        {selectedSlot && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary flex-1" style={{ justifyContent: 'center' }} onClick={confirmBook}>
              {tab === 'paid' ? '💳 Pay ₹50 & Book' : '✓ Confirm Free Slot'} — {selectedSlot} {session === 'morning' ? 'AM' : 'PM'}
            </button>
            <button className="btn btn-ghost" onClick={() => setSelectedSlot(null)}>Cancel</button>
          </div>
        )}
      </Card>

      {/* Complaint modal */}
      <Modal open={complaintOpen} onClose={() => setComplaintOpen(false)} title="Report Gym Issue">
        <Field label="Issue Type">
          <select className="select">
            <option>Equipment broken / damaged</option>
            <option>Cleanliness problem</option>
            <option>AC / ventilation not working</option>
            <option>Trainer absent</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Description">
          <textarea className="input" rows={3} placeholder="Describe the issue…" style={{ resize: 'none' }} />
        </Field>
        <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setComplaintOpen(false)}>
          Submit Complaint
        </button>
      </Modal>
    </div>
  );
}
