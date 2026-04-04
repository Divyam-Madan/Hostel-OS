// HostelOS Warden Console — analytics & operations (distinct UI from student app)
import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

const CHART_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#94a3b8'];
const PIE_STATUS = ['#fbbf24', '#38bdf8', '#34d399'];
const DARK_TOOLTIP = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
};

function Card({ title, subtitle, children, style }) {
  return (
    <div
      style={{
        background: 'rgba(22,25,34,0.95)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 14,
        padding: 20,
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 16 }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--font2)' }}>{title}</h3>
          )}
          {subtitle && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function Metric({ label, value, hint, accent }) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12,
        padding: '18px 20px',
        minWidth: 140,
        flex: '1 1 140px',
      }}
    >
      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font2)', color: accent || '#22d3ee', margin: '8px 0 4px', lineHeight: 1 }}>{value}</p>
      {hint && <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{hint}</p>}
    </div>
  );
}

export default function WardenConsole({ activePage }) {
  const { user } = useAuth();
  const name = user?.name || user?.username || 'Warden';

  const [dash, setDash] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [cFilters, setCFilters] = useState({ category: '', status: '', search: '', dateFrom: '', dateTo: '' });
  const [events, setEvents] = useState([]);
  const [feedbackAi, setFeedbackAi] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [wellbeing, setWellbeing] = useState(null);
  const [students, setStudents] = useState([]);
  const [sq, setSq] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const d = await api('/admin/dashboard');
      setDash(d);
      setLoadErr('');
    } catch (e) {
      setLoadErr(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const fn = () => loadDashboard();
    window.addEventListener('hostel:admin-stats', fn);
    return () => window.removeEventListener('hostel:admin-stats', fn);
  }, [loadDashboard]);

  const loadComplaints = useCallback(async () => {
    const q = new URLSearchParams();
    if (cFilters.category) q.set('category', cFilters.category);
    if (cFilters.status) q.set('status', cFilters.status);
    if (cFilters.search) q.set('search', cFilters.search);
    if (cFilters.dateFrom) q.set('dateFrom', cFilters.dateFrom);
    if (cFilters.dateTo) q.set('dateTo', cFilters.dateTo);
    const qs = q.toString();
    try {
      const d = await api(`/admin/complaints${qs ? `?${qs}` : ''}`);
      setComplaints(d.complaints || []);
    } catch {
      setComplaints([]);
    }
  }, [cFilters]);

  useEffect(() => {
    if (activePage === 'admin-complaints') loadComplaints();
  }, [activePage, loadComplaints]);

  useEffect(() => {
    if (activePage !== 'admin-events') return;
    (async () => {
      try {
        const d = await api('/admin/events');
        setEvents(d.events || []);
      } catch {
        setEvents([]);
      }
    })();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'admin-wellbeing') return;
    (async () => {
      try {
        const d = await api('/admin/wellbeing');
        setWellbeing(d);
      } catch {
        setWellbeing(null);
      }
    })();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'admin-students') return;
    (async () => {
      try {
        const d = await api(`/admin/students?q=${encodeURIComponent(sq)}`);
        setStudents(d.students || []);
      } catch {
        setStudents([]);
      }
    })();
  }, [activePage, sq]);

  const runFeedbackAi = async () => {
    setFbLoading(true);
    setFeedbackAi(null);
    try {
      const d = await api('/admin/feedback-analysis');
      setFeedbackAi(d.analyses || []);
    } catch (e) {
      setFeedbackAi([{ messHall: 'Error', feedbackCount: 0, summary: e.message, sentiment: 'neutral' }]);
    } finally {
      setFbLoading(false);
    }
  };

  const patchComplaint = async (id, status) => {
    await api(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadComplaints();
    loadDashboard();
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm('Permanently delete this resolved complaint?')) return;
    await api(`/admin/complaints/${id}`, { method: 'DELETE' });
    loadComplaints();
    loadDashboard();
  };

  const openStudent = async (id) => {
    try {
      const d = await api(`/admin/students/${id}`);
      setSelectedStudent(d);
    } catch {
      setSelectedStudent(null);
    }
  };

  const ov = dash?.overview;
  const charts = dash?.charts;
  const insights = dash?.insights;

  const view = activePage || 'admin-dashboard';

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, #080a0f 0%, #0f1419 40%, #0c1018 100%)',
        color: '#e2e8f0',
        padding: 28,
      }}
    >
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Signed in as {name}</p>
        <h1 style={{ fontFamily: 'var(--font2)', fontSize: 26, fontWeight: 800, margin: '6px 0 0', color: '#f8fafc' }}>
          {view === 'admin-dashboard' && 'Operations overview'}
          {view === 'admin-complaints' && 'Complaint management'}
          {view === 'admin-events' && 'Events & registrations'}
          {view === 'admin-feedback' && 'Mess feedback intelligence'}
          {view === 'admin-wellbeing' && 'Wellbeing insights'}
          {view === 'admin-students' && 'Student directory'}
        </h1>
      </header>

      {loadErr && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {loadErr}
        </div>
      )}

      {/* ─── DASHBOARD ─── */}
      {view === 'admin-dashboard' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
            <Metric label="Students" value={loading ? '…' : ov?.totalStudents ?? '0'} hint="Registered" accent="#22d3ee" />
            <Metric label="Complaints" value={loading ? '…' : ov?.totalComplaints ?? '0'} hint={`${ov?.pendingComplaints ?? 0} pending`} accent="#fbbf24" />
            <Metric label="Resolved" value={loading ? '…' : ov?.resolvedComplaints ?? '0'} hint="Closed cases" accent="#34d399" />
            <Metric label="Event sign-ups" value={loading ? '…' : ov?.totalEventRegistrations ?? '0'} hint={`${ov?.activeEvents ?? 0} active events`} accent="#a78bfa" />
            <Metric label="Mess feedback" value={loading ? '…' : ov?.totalFeedbackEntries ?? '0'} hint="All entries" accent="#f472b6" />
            <Metric label="Support visits" value={loading ? '…' : ov?.totalWellbeingLogs ?? '0'} hint="Logged appointments" accent="#38bdf8" />
          </div>

          {insights?.mostFrequentComplaintCategory && (
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Most common issue category: <strong style={{ color: '#e2e8f0' }}>{insights.mostFrequentComplaintCategory}</strong>
              {insights.mostPopularEvent && (
                <>
                  {' · '}Popular event: <strong style={{ color: '#e2e8f0' }}>{insights.mostPopularEvent.title}</strong> ({insights.mostPopularEvent.count} regs)
                </>
              )}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 18 }}>
            <Card title="Complaints by category" subtitle="All time">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts?.complaintsByCategory || []} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(charts?.complaintsByCategory || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Complaint trend" subtitle="Last 30 days">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={charts?.complaintTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Complaint status" subtitle="Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: charts?.complaintStatusPie?.pending || 0 },
                      { name: 'In progress', value: charts?.complaintStatusPie?.in_progress || 0 },
                      { name: 'Resolved', value: charts?.complaintStatusPie?.resolved || 0 },
                    ]}
                    dataKey="value"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {PIE_STATUS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Feedback sentiment (ratings)" subtitle="Heuristic from star ratings">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive (4–5★)', value: charts?.feedbackSentiment?.positive || 0 },
                      { name: 'Neutral (3★)', value: charts?.feedbackSentiment?.neutral || 0 },
                      { name: 'Negative (1–2★)', value: charts?.feedbackSentiment?.negative || 0 },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={85}
                  >
                    {['#34d399', '#fbbf24', '#f87171'].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Events — registrations" subtitle="Per event">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts?.eventRegistrations || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="title" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-18} textAnchor="end" height={70} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {/* ─── COMPLAINTS ─── */}
      {view === 'admin-complaints' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>
              Category
              <input
                className="input"
                style={{ display: 'block', marginTop: 4, background: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                value={cFilters.category}
                onChange={(e) => setCFilters((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Electricity"
              />
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>
              Status
              <select
                className="select"
                style={{ display: 'block', marginTop: 4, background: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                value={cFilters.status}
                onChange={(e) => setCFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>
              Search
              <input
                className="input"
                style={{ display: 'block', marginTop: 4, minWidth: 180, background: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                value={cFilters.search}
                onChange={(e) => setCFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Name, room, text…"
              />
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadComplaints} style={{ marginBottom: 2 }}>
              Apply filters
            </button>
          </div>

          <Card title={`All complaints (${complaints.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    background: 'rgba(15,23,42,0.6)',
                    borderRadius: 10,
                    border: '1px solid rgba(51,65,85,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <strong style={{ color: '#f1f5f9' }}>{c.title}</strong>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>
                        {c.student?.username} · Room {c.student?.room || c.roomHint || '—'} · {c.category}
                      </p>
                      {c.description && <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{c.description}</p>}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: c.status === 'resolved' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                        color: c.status === 'resolved' ? '#6ee7b7' : '#fcd34d',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {c.status === 'pending' && (
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => patchComplaint(c.id, 'in-progress')}>
                        Mark in progress
                      </button>
                    )}
                    {c.status !== 'resolved' && (
                      <button type="button" className="btn btn-success btn-xs" onClick={() => patchComplaint(c.id, 'resolved')}>
                        Resolve
                      </button>
                    )}
                    {c.status === 'resolved' && (
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => deleteComplaint(c.id)}>
                        Delete record
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {complaints.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No complaints match filters.</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ─── EVENTS ─── */}
      {view === 'admin-events' && (
        <Card title="Campus events">
          <div style={{ display: 'grid', gap: 12 }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: 'rgba(15,23,42,0.6)',
                  borderRadius: 10,
                  border: '1px solid #334155',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <strong>{ev.title}</strong>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0' }}>{ev.venue || '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>{ev.registrationCount}</span>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>registrations</p>
                </div>
              </div>
            ))}
            {events.length === 0 && <p style={{ color: '#64748b' }}>No events in database. Run seed script or add events via API.</p>}
          </div>
        </Card>
      )}

      {/* ─── FEEDBACK AI ─── */}
      {view === 'admin-feedback' && (
        <Card title="Gemini analysis by mess group" subtitle="Tags on reviews bucket feedback (default: Campus-wide).">
          <button type="button" className="btn btn-primary" disabled={fbLoading} onClick={runFeedbackAi} style={{ marginBottom: 20 }}>
            {fbLoading ? 'Analyzing…' : 'Run AI analysis'}
          </button>
          <div style={{ display: 'grid', gap: 16 }}>
            {(feedbackAi || []).map((row) => (
              <div
                key={row.messHall}
                style={{
                  padding: 16,
                  background: 'rgba(15,23,42,0.7)',
                  borderRadius: 10,
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: '#e0e7ff' }}>{row.messHall}</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{row.feedbackCount} entries</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: row.sentiment === 'positive' ? 'rgba(52,211,153,0.2)' : row.sentiment === 'negative' ? 'rgba(248,113,113,0.2)' : 'rgba(148,163,184,0.2)',
                    color: '#e2e8f0',
                  }}
                >
                  {row.sentiment}
                </span>
                <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{row.summary}</p>
              </div>
            ))}
            {!feedbackAi && !fbLoading && <p style={{ color: '#64748b', fontSize: 13 }}>Click to analyze all mess feedback with Gemini.</p>}
          </div>
        </Card>
      )}

      {/* ─── WELLBEING ─── */}
      {view === 'admin-wellbeing' && wellbeing && (
        <div>
          <Metric label="Logged appointments" value={String(wellbeing.totalAppointments)} hint="All records" accent="#38bdf8" />
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '18px 0' }}>{wellbeing.highlight}</p>
          <Card title="Visit trend" subtitle="Last 90 days" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={wellbeing.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={DARK_TOOLTIP} />
                <Area type="monotone" dataKey="count" stroke="#38bdf8" fill="rgba(56,189,248,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ─── STUDENTS ─── */}
      {view === 'admin-students' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 1.1fr' : '1fr', gap: 20 }}>
          <Card title="Search students">
            <input
              className="input"
              style={{ width: '100%', marginBottom: 16, background: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
              placeholder="Name, email, room…"
              value={sq}
              onChange={(e) => setSq(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => openStudent(s.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #334155',
                    background: 'rgba(15,23,42,0.5)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{s.username}</strong>
                  <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>{s.email}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Room {s.roomNumber || '—'}</span>
                </button>
              ))}
            </div>
          </Card>
          {selectedStudent && (
            <Card title="Student profile">
              <p style={{ fontSize: 14, marginTop: 0 }}>
                <strong>{selectedStudent.user?.username}</strong> · {selectedStudent.user?.email}
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Room {selectedStudent.user?.roomNumber || '—'}</p>
              <h4 style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', margin: '20px 0 8px' }}>Complaints</h4>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: '#cbd5e1' }}>
                {(selectedStudent.complaints || []).slice(0, 8).map((x) => (
                  <li key={x.id}>
                    {x.title} — <span style={{ color: '#94a3b8' }}>{x.status}</span>
                  </li>
                ))}
              </ul>
              <h4 style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', margin: '16px 0 8px' }}>Feedback</h4>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: '#cbd5e1' }}>
                {(selectedStudent.feedback || []).slice(0, 6).map((x) => (
                  <li key={x.id}>
                    {x.foodItem} ({x.rating}★)
                  </li>
                ))}
              </ul>
              <h4 style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', margin: '16px 0 8px' }}>Support visits</h4>
              <p style={{ fontSize: 13, color: '#cbd5e1' }}>{(selectedStudent.wellbeingLogs || []).length} on file</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
