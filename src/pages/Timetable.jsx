// src/pages/Timetable.jsx
import { useState } from 'react';
import { Card, SectionHeader, Badge, GlowCard } from '../components/ui';
import { timetable, missedClasses, todayTimeline } from '../data/mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TYPE_STYLES = {
  lecture: { color: 'var(--accent)', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  icon: '📖' },
  lab:     { color: 'var(--green)',  bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: '🔬' },
  project: { color: 'var(--teal)',   bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.2)',  icon: '💻' },
  seminar: { color: 'var(--purple)', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', icon: '🎤' },
};
const TIMELINE_ICONS = { mess: '🍽️', class: '📚', gym: '🏋️', event: '🎮', hostel: '🏠' };

const today = DAYS[new Date().getDay() - 1] || 'Mon';

export default function Timetable() {
  const [activeDay, setActiveDay] = useState(today);
  const [editing, setEditing] = useState(false);

  const todayClasses = timetable[activeDay] || [];

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title-lg">Timetable & Alerts</h1>
          <p className="page-desc">Class schedule, missed lectures and today's agenda</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(e => !e)}>
          {editing ? '✓ Done Editing' : '✏️ Edit Timetable'}
        </button>
      </div>

      {/* Missed class alerts */}
      {missedClasses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={`⚠️ Missed Classes (${missedClasses.length})`} subtitle="Classes you were absent for" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {missedClasses.map((mc, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius)', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{mc.subject}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{mc.date} · {mc.time}</p>
                </div>
                <Badge variant="red">{mc.reason}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Weekly timetable */}
        <Card className="card-p">
          <SectionHeader title="Weekly Schedule" subtitle="Tap a day to view classes" />

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {DAYS.map(d => (
              <button key={d} onClick={() => setActiveDay(d)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeDay === d ? 'var(--accent)' : 'var(--bg3)',
                color: activeDay === d ? '#fff' : 'var(--text2)',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)', transition: 'all .2s',
                outline: d === today ? '2px solid rgba(99,102,241,0.4)' : 'none',
              }}>
                {d}
                {d === today && <span style={{ fontSize: 8, marginLeft: 3, opacity: .7 }}>●</span>}
              </button>
            ))}
          </div>

          {/* Classes for selected day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayClasses.map((cls, i) => {
              const ts = TYPE_STYLES[cls.type] || TYPE_STYLES.lecture;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                  background: ts.bg, border: `1px solid ${ts.border}`, borderRadius: 'var(--radius)',
                  transition: 'all .2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ts.bg}`, border: `1px solid ${ts.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ts.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{cls.subject}</p>
                    <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      {cls.time} · {cls.room} · {cls.faculty}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: ts.bg, color: ts.color, fontWeight: 600, border: `1px solid ${ts.border}` }}>{cls.type}</span>
                  {editing && (
                    <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}>✕</button>
                  )}
                </div>
              );
            })}
            {todayClasses.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                🎉 No classes on {activeDay}!
              </div>
            )}
            {editing && (
              <button className="btn btn-ghost w-full" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
                + Add Class
              </button>
            )}
          </div>
        </Card>

        {/* Today's timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card className="card-p">
            <SectionHeader title="Today's Timeline" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <div style={{ position: 'relative' }}>
              {/* vertical line */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 1, background: 'var(--border)', zIndex: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {todayTimeline.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: ev.done ? 'var(--green-bg)' : 'var(--bg3)',
                      border: `2px solid ${ev.done ? 'var(--green)' : 'var(--border2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, transition: 'all .3s',
                    }}>{TIMELINE_ICONS[ev.type] || '📌'}</div>
                    <div style={{ flex: 1, paddingTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: ev.done ? 500 : 700, opacity: ev.done ? 0.6 : 1, textDecoration: ev.done ? 'line-through' : 'none' }}>{ev.label}</p>
                        {ev.done && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>✓ Done</span>}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text3)' }}>{ev.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Summary stats */}
          <GlowCard color="var(--accent)">
            <SectionHeader title="This Week's Stats" />
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                { label: 'Classes Today',     value: todayClasses.length,         color: 'var(--accent)' },
                { label: 'Missed (semester)', value: missedClasses.length,        color: 'var(--red)' },
                { label: 'Subjects',          value: 6,                           color: 'var(--teal)' },
                { label: 'Lab Sessions/wk',   value: 3,                           color: 'var(--green)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font2)', color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
