// src/pages/Timetable.jsx
import { useState, useEffect, useCallback } from 'react';
import { Card, SectionHeader, Badge, GlowCard, TimelineItem, Modal, Field, useToast } from '../components/ui';
import { fetchTimetable, createClass, updateClass, deleteClass } from '../api/timetable';
import { subscribeRealtimeEvent } from '../realtime/socket';
import { missedClasses, todayTimeline } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

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
  const { role } = useAuth();
  const [activeDay, setActiveDay] = useState(today);
  const [editing, setEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add');
  const [editorTarget, setEditorTarget] = useState(null);
  const [editorDraft, setEditorDraft] = useState({ day: today, subject: '', time: '', room: '', faculty: '', type: 'lecture' });
  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const t = await fetchTimetable();
      setTimetableData(t || {});
    } catch (err) {
      setTimetableData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const off = subscribeRealtimeEvent('timetable:update', () => load());
    const onWindow = () => load();
    window.addEventListener('hostel:timetable', onWindow);
    return () => {
      off();
      window.removeEventListener('hostel:timetable', onWindow);
    };
  }, [load]);

  const todayClasses = timetableData[activeDay] || [];
  const toast = useToast();
  const canEdit = role === 'admin';

  const openAddEditor = () => {
    setEditorMode('add');
    setEditorTarget(null);
    setEditorDraft({ day: activeDay, subject: '', time: '', room: '', faculty: '', type: 'lecture' });
    setEditorOpen(true);
  };

  const openEditEditor = (cls) => {
    setEditorMode('edit');
    setEditorTarget(cls);
    setEditorDraft({
      day: activeDay,
      subject: cls.subject || '',
      time: cls.time || '',
      room: cls.room || '',
      faculty: cls.faculty || '',
      type: cls.type || 'lecture',
    });
    setEditorOpen(true);
  };

  const saveEditor = async () => {
    if (!editorDraft.subject.trim() || !editorDraft.time.trim()) {
      toast.error('Subject and time are required');
      return;
    }
    try {
      if (editorMode === 'edit' && editorTarget?.id) {
        await updateClass(editorTarget.id, editorDraft);
        toast.success('Class updated');
      } else {
        await createClass(editorDraft);
        toast.success('Class added');
      }
      setEditorOpen(false);
      setEditorTarget(null);
      setEditorDraft({ day: activeDay, subject: '', time: '', room: '', faculty: '', type: 'lecture' });
      load();
    } catch (e) {
      toast.error(e?.message || 'Failed to save class');
    }
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title-lg">Timetable & Alerts</h1>
          <p className="page-desc">Class schedule, missed lectures and today's agenda</p>
        </div>
        {canEdit ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(e => !e)}>
            {editing ? '✓ Done Editing' : '✏️ Edit Timetable'}
          </button>
        ) : (
          <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', color: 'var(--amber)', fontSize: 12, fontWeight: 600 }}>
            Admin only: timetable editing is disabled for student sessions
          </div>
        )}
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
                          {editing && canEdit && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-ghost btn-xs"
                                style={{ color: 'var(--amber)' }}
                                onClick={async () => {
                                  openEditEditor(cls);
                                  }}
                              >✎</button>
                              <button
                                className="btn btn-ghost btn-xs"
                                style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}
                                onClick={async () => {
                                  const ok = await toast.confirm({ title: 'Delete class', message: 'Delete this class?' });
                                  if (!ok) return;
                                  try { await deleteClass(cls.id); load(); toast.success('Class deleted'); } catch (e) { toast.error('Delete failed'); }
                                }}
                              >✕</button>
                            </div>
                          )}
                </div>
              );
            })}
            {todayClasses.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                🎉 No classes on {activeDay}!
              </div>
            )}
            {editing && canEdit && (
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'center', borderStyle: 'dashed' }}
                onClick={openAddEditor}
              >
                + Add Class
              </button>
            )}
            {editing && !canEdit && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px dashed var(--border2)', color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>
                Switch to an admin session to add, edit, or delete classes.
              </div>
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

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editorMode === 'edit' ? 'Edit class' : 'Add class'}
        width={560}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Day">
            <select className="input" value={editorDraft.day} onChange={(e) => setEditorDraft((prev) => ({ ...prev, day: e.target.value }))}>
              {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className="input" value={editorDraft.type} onChange={(e) => setEditorDraft((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="lecture">lecture</option>
              <option value="lab">lab</option>
              <option value="project">project</option>
              <option value="seminar">seminar</option>
            </select>
          </Field>
          <Field label="Subject">
            <input className="input" value={editorDraft.subject} onChange={(e) => setEditorDraft((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject name" />
          </Field>
          <Field label="Time">
            <input className="input" value={editorDraft.time} onChange={(e) => setEditorDraft((prev) => ({ ...prev, time: e.target.value }))} placeholder="9:00 - 10:00" />
          </Field>
          <Field label="Room">
            <input className="input" value={editorDraft.room} onChange={(e) => setEditorDraft((prev) => ({ ...prev, room: e.target.value }))} placeholder="LH-101" />
          </Field>
          <Field label="Faculty">
            <input className="input" value={editorDraft.faculty} onChange={(e) => setEditorDraft((prev) => ({ ...prev, faculty: e.target.value }))} placeholder="Dr. Name" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={saveEditor}>{editorMode === 'edit' ? 'Save Changes' : 'Add Class'}</button>
        </div>
      </Modal>
    </div>
  );
}
