// src/pages/Complaints.jsx — live data from API + Socket.IO refresh
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, SectionHeader, StatusBadge, PriorityBadge, ChipFilter, Modal, Field } from '../components/ui';
import { complaintCategories } from '../data/mockData';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#84cc16','#a855f7','#ec4899','#f97316','#14b8a6','#64748b'];

export default function Complaints() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [newOpen, setNewOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [roomHint, setRoomHint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/complaints/user');
      setList(data.complaints || []);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'Failed to load complaints');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('hostel:complaints', onRefresh);
    return () => window.removeEventListener('hostel:complaints', onRefresh);
  }, [load]);

  useEffect(() => {
    if (user?.room) setRoomHint(user.room);
  }, [user?.room]);

  const complaintsByCategory = useMemo(() => {
    const m = {};
    for (const c of list) {
      const k = c.category || 'General';
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [list]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const filtered = filter === 'all' ? list : list.filter(c => c.status === filter);

  const stats = {
    total: list.length,
    pending: list.filter(c => c.status === 'pending').length,
    inProgress: list.filter(c => c.status === 'in-progress').length,
    resolved: list.filter(c => c.status === 'resolved').length,
  };

  const submitComplaint = async () => {
    if (!category || !title.trim()) return;
    setSubmitting(true);
    try {
      await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          priority,
          roomHint: roomHint.trim(),
        }),
      });
      setSubmitted(true);
      await load();
    } catch (e) {
      alert(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title-lg">Complaints</h1>
          <p className="page-desc">Track and manage hostel maintenance requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setSubmitted(false);
          setTitle('');
          setDescription('');
          setPriority('medium');
          setCategory('');
          setNewOpen(true);
        }}>
          + New Complaint
        </button>
      </div>

      {loadError && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{loadError}</p>
      )}

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total',       value: stats.total,      color: 'var(--accent)' },
          { label: 'Pending',     value: stats.pending,    color: 'var(--amber)' },
          { label: 'In Progress', value: stats.inProgress, color: 'var(--blue)' },
          { label: 'Resolved',    value: stats.resolved,   color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <span className="stat-value font2" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <Card className="card-p">
          <SectionHeader title="Complaint Categories" subtitle="Tap to raise a new complaint" />
          <div className="grid-4" style={{ gap: 8 }}>
            {complaintCategories.slice(0, 8).map(cat => (
              <div
                key={cat.label}
                onClick={() => { setCategory(cat.label); setSubmitted(false); setNewOpen(true); }}
                style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 8px',
                  cursor: 'pointer', textAlign: 'center', transition: 'all .2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + '66'; e.currentTarget.style.background = cat.color + '12'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
              >
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.3, textAlign: 'center' }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-p">
          <SectionHeader title="Complaints by Category" subtitle="Your tickets" />
          {complaintsByCategory.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13, padding: 24 }}>No complaints yet — chart will populate after you file one.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complaintsByCategory} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0,6,6,0]}>
                  {complaintsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="card-p">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <SectionHeader title={`My Complaints (${filtered.length})`} />
          <ChipFilter options={filterOptions} value={filter} onChange={setFilter} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px', background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{c.icon}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg5)', padding: '2px 8px', borderRadius: 6 }}>{c.category}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.id.slice(-6)} · {c.date} · {c.updatedAt}</span>
                </div>
                {c.description && (
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{c.description}</p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Raise New Complaint" width={500}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Complaint Submitted!</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '8px 0 16px' }}>
              Your complaint has been logged. Admins are notified in real time.
            </p>
            <button className="btn btn-primary" onClick={() => setNewOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            <Field label="Category">
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category…</option>
                {complaintCategories.map(c => (
                  <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Title / Subject">
              <input className="input" placeholder="Brief description of the issue" value={title} onChange={e => setTitle(e.target.value)} />
            </Field>
            <Field label="Detailed Description">
              <textarea className="input" rows={4} placeholder="Describe the problem in detail…" style={{ resize: 'none' }} value={description} onChange={e => setDescription(e.target.value)} />
            </Field>
            <Field label="Priority">
              <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Location / Room">
              <input className="input" value={roomHint} onChange={e => setRoomHint(e.target.value)} placeholder="Your room or location" />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={submitComplaint} disabled={submitting || !category || !title.trim()}>
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </button>
              <button className="btn btn-ghost" onClick={() => setNewOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
