// src/pages/Counselling.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, SectionHeader, GlowCard, Modal, Field, ProgressBar, TimelineItem, EmptyState } from '../components/ui';
import { counsellingSlots } from '../data/mockData';
import { createWellbeingLog, fetchMyWellbeingLogs } from '../api/wellbeing';
import { subscribeRealtimeEvent } from '../realtime/socket';

const MOODS = [
  { value: 'very-low', label: 'Very low', icon: '😣', color: 'var(--red)' },
  { value: 'low', label: 'Low', icon: '😕', color: 'var(--amber)' },
  { value: 'okay', label: 'Okay', icon: '😌', color: 'var(--blue)' },
  { value: 'good', label: 'Good', icon: '🙂', color: 'var(--green)' },
  { value: 'great', label: 'Great', icon: '😄', color: 'var(--purple)' },
];

const MOOD_LABELS = Object.fromEntries(MOODS.map((m) => [m.value, m.label]));

function moodColor(value) {
  return MOODS.find((m) => m.value === value)?.color || 'var(--accent)';
}

export default function Counselling() {
  const [anonymous, setAnonymous] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState('online');
  const [booked, setBooked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mood, setMood] = useState('okay');
  const [stressLevel, setStressLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [topics, setTopics] = useState([]);
  const [wellbeingLogs, setWellbeingLogs] = useState([]);
  const [wellbeingLoading, setWellbeingLoading] = useState(true);
  const [wellbeingSaving, setWellbeingSaving] = useState(false);
  const [wellbeingNotice, setWellbeingNotice] = useState(null);

  const selectedDay = counsellingSlots.find(d => d.id === selectedDate);

  const loadWellbeing = useCallback(async () => {
    try {
      setWellbeingLoading(true);
      const d = await fetchMyWellbeingLogs();
      setWellbeingLogs(d.logs || []);
      setWellbeingNotice(null);
    } catch (err) {
      setWellbeingLogs([]);
      setWellbeingNotice({ type: 'error', msg: err.message || 'Failed to load wellbeing logs' });
    } finally {
      setWellbeingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWellbeing();
  }, [loadWellbeing]);

  useEffect(() => {
    let lastRefreshAt = 0;
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < 250) return;
      lastRefreshAt = now;
      loadWellbeing();
    };

    const onRefresh = () => refresh();
    window.addEventListener('hostel:wellbeing', onRefresh);
    const offSocket = subscribeRealtimeEvent('wellbeing:update', refresh);

    return () => {
      window.removeEventListener('hostel:wellbeing', onRefresh);
      offSocket();
    };
  }, [loadWellbeing]);

  const recentStressTrend = useMemo(() => wellbeingLogs.slice(0, 6).map((log) => Number(log.stressLevel) || 3).reverse(), [wellbeingLogs]);

  const submitWellbeing = async () => {
    setWellbeingSaving(true);
    setWellbeingNotice(null);
    try {
      await createWellbeingLog({ mood, stressLevel, notes, topics });
      setNotes('');
      setStressLevel(3);
      setMood('okay');
      setTopics([]);
      setWellbeingNotice({ type: 'success', msg: 'Wellbeing check-in saved' });
      loadWellbeing();
    } catch (err) {
      setWellbeingNotice({ type: 'error', msg: err.message || 'Failed to save check-in' });
    } finally {
      setWellbeingSaving(false);
    }
  };

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

      <div className="grid-2" style={{ gap: 20, marginBottom: 20, alignItems: 'start' }}>
        <Card className="card-p">
          <SectionHeader title="Daily wellbeing check-in" subtitle="Quick mood and stress log saved to MongoDB" />
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Mood">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MOODS.map((item) => {
                  const active = mood === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setMood(item.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: `1px solid ${active ? item.color : 'var(--border)'}`,
                        background: active ? `${item.color}18` : 'var(--bg3)',
                        color: active ? item.color : 'var(--text2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label={`Stress level: ${stressLevel}/5`}>
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <ProgressBar value={stressLevel} max={5} color={stressLevel >= 4 ? 'var(--red)' : stressLevel >= 3 ? 'var(--amber)' : 'var(--green)'} />
              </div>
            </Field>

            <Field label="Notes">
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional thoughts, triggers, or support needed"
              />
            </Field>

            {wellbeingNotice && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: wellbeingNotice.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${wellbeingNotice.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, color: wellbeingNotice.type === 'success' ? '#6ee7b7' : '#fca5a5', fontSize: 13 }}>
                {wellbeingNotice.msg}
              </div>
            )}

            <button className="btn btn-primary" type="button" onClick={submitWellbeing} disabled={wellbeingSaving}>
              {wellbeingSaving ? 'Saving…' : 'Save check-in'}
            </button>
          </div>
        </Card>

        <Card className="card-p">
          <SectionHeader title="Recent activity" subtitle="Your latest wellbeing logs" />
          <div style={{ marginBottom: 14 }}>
            {recentStressTrend.length > 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'end', height: 90 }}>
                {recentStressTrend.map((value, index) => (
                  <div key={`${index}-${value}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: '100%', height: `${Math.max(18, value * 18)}%`, minHeight: 18, borderRadius: 8, background: moodColor(wellbeingLogs[wellbeingLogs.length - 1 - index]?.mood || 'okay') }} />
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{value}/5</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {wellbeingLoading ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading wellbeing history…</p>
          ) : wellbeingLogs.length === 0 ? (
            <EmptyState icon="🫶" title="No check-ins yet" desc="Save your first wellbeing log to see trends here." />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {wellbeingLogs.slice(0, 5).map((log) => (
                <TimelineItem key={log.id} dot={log.stressLevel >= 4 ? 'red' : log.stressLevel >= 3 ? 'amber' : 'green'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{MOOD_LABELS[log.mood] || log.mood}</p>
                      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        {new Date(log.visitDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ minWidth: 120 }}>
                      <ProgressBar value={Number(log.stressLevel) || 3} max={5} color={moodColor(log.mood)} />
                      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Stress {log.stressLevel}/5</p>
                    </div>
                  </div>
                  {log.notes && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{log.notes}</p>}
                </TimelineItem>
              ))}
            </div>
          )}
        </Card>
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
                  <button
                    key={c}
                    type="button"
                    className={`chip ${topics.includes(c) ? 'active-accent' : ''}`}
                    onClick={() => setTopics((prev) => (prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c].slice(0, 5)))}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {topics.length > 0 && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Selected: {topics.join(' · ')}</p>}
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
