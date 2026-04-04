// src/pages/Counselling.jsx
import { useState } from 'react';
import { Card, SectionHeader, GlowCard, Modal } from '../components/ui';
import { counsellingSlots } from '../data/mockData';

export default function Counselling() {
  const [anonymous, setAnonymous] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState('online');
  const [booked, setBooked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedDay = counsellingSlots.find(d => d.id === selectedDate);

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      {/* Calm header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(20,184,166,0.06))',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px',
        marginBottom: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
        <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>
          Student Counselling Portal
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          A safe, confidential space to talk. Sessions with certified counsellors — online or in-person.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {['🔒 100% Confidential', '🧑‍⚕️ Certified Counsellors', '💬 Anonymous Option'].map(tag => (
            <span key={tag} style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 20,
              background: 'rgba(168,85,247,0.1)', color: 'var(--purple)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Emergency */}
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 20 }}>🆘</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Need immediate help?</p>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>
            iCall: <strong style={{ color: 'var(--text)' }}>9152987821</strong> &nbsp;·&nbsp;
            Vandrevala: <strong style={{ color: 'var(--text)' }}>1860-2662-345</strong> (24×7)
          </p>
        </div>
        <button className="btn btn-danger btn-sm">Call Now</button>
      </div>

      {booked ? (
        <GlowCard color="var(--purple)" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, marginBottom: 8 }}>Session Booked!</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4 }}>
            {selectedDay?.day}, {selectedDay?.date} at {selectedSlot}
          </p>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
            {mode === 'online' ? '💻 Google Meet link will be sent to your email' : '🏢 In-Person — Admin Block, Room 12'}
          </p>
          {anonymous && (
            <p style={{ fontSize: 12, color: 'var(--purple)', background: 'rgba(168,85,247,0.08)', padding: '8px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>
              🔒 Booked anonymously
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {mode === 'online' && <button className="btn btn-primary" style={{ background: 'var(--purple)' }}>Join Meet Link</button>}
            <button className="btn btn-ghost" onClick={() => { setBooked(false); setSelectedDate(null); setSelectedSlot(null); }}>
              Book Another
            </button>
          </div>
        </GlowCard>
      ) : (
        <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Anonymous toggle */}
            <Card className="card-p">
              <SectionHeader title="Privacy Settings" />
              <div
                onClick={() => setAnonymous(a => !a)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: anonymous ? 'rgba(168,85,247,0.08)' : 'var(--bg3)',
                  border: `1px solid ${anonymous ? 'rgba(168,85,247,0.25)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🔒</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Book Anonymously</p>
                    <p style={{ fontSize: 12, color: 'var(--text2)' }}>Your name won't be shared</p>
                  </div>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: anonymous ? 'var(--purple)' : 'var(--border3)',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: anonymous ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s',
                  }} />
                </div>
              </div>
            </Card>

            {/* Mode */}
            <Card className="card-p">
              <SectionHeader title="Session Mode" />
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ value: 'online', label: '💻 Online', sub: 'Google Meet / Zoom' },
                  { value: 'in-person', label: '🏢 In-Person', sub: 'Admin Block, Room 12' }].map(m => (
                  <div key={m.value} onClick={() => setMode(m.value)} style={{
                    flex: 1, padding: '12px 10px', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: `1.5px solid ${mode === m.value ? 'var(--purple)' : 'var(--border2)'}`,
                    background: mode === m.value ? 'rgba(168,85,247,0.08)' : 'var(--bg3)',
                    textAlign: 'center', transition: 'all .2s',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: mode === m.value ? 'var(--purple)' : 'var(--text)' }}>{m.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Topics */}
            <Card className="card-p">
              <SectionHeader title="What to talk about?" subtitle="Optional" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Academic Stress', 'Anxiety', 'Homesickness', 'Relationships',
                  'Sleep Issues', 'Career Confusion', 'Low Motivation', 'Just want to talk'].map(c => (
                  <span key={c} className="chip">{c}</span>
                ))}
              </div>
            </Card>
          </div>

          {/* Slots */}
          <Card className="card-p">
            <SectionHeader title="Available Slots" subtitle="Select date and time" />
            {counsellingSlots.map(day => (
              <div key={day.id} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {day.day}, {new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {day.slots.map(slot => {
                    const sel = selectedDate === day.id && selectedSlot === slot;
                    return (
                      <span key={slot} onClick={() => { setSelectedDate(day.id); setSelectedSlot(slot); }} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${sel ? 'var(--purple)' : 'var(--border2)'}`,
                        background: sel ? 'rgba(168,85,247,0.12)' : 'var(--bg3)',
                        color: sel ? 'var(--purple)' : 'var(--text2)', transition: 'all .15s',
                      }}>{slot}</span>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              className="btn w-full"
              style={{
                marginTop: 8, background: selectedDate && selectedSlot ? 'var(--purple)' : 'var(--bg4)',
                color: selectedDate && selectedSlot ? '#fff' : 'var(--text3)',
                justifyContent: 'center', cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
              }}
              onClick={() => selectedDate && selectedSlot && setConfirmOpen(true)}
            >
              {selectedDate && selectedSlot ? `Book — ${selectedSlot}` : 'Select a slot to continue'}
            </button>
          </Card>
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Session">
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 44 }}>🧠</span>
          <div style={{ margin: '16px 0', padding: 14, background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Date & Time</p>
            <p style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{selectedDay?.day}, {selectedDay?.date} at {selectedSlot}</p>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Mode: <strong style={{ color: 'var(--text)' }}>{mode === 'online' ? '💻 Online' : '🏢 In-Person'}</strong></p>
            {anonymous && <p style={{ fontSize: 12, color: 'var(--purple)', marginTop: 8 }}>🔒 Booking anonymously</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn flex-1" style={{ background: 'var(--purple)', color: '#fff', justifyContent: 'center' }}
              onClick={() => { setBooked(true); setConfirmOpen(false); }}>Confirm Booking</button>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Back</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
