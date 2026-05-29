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
import { Field, TimelineItem } from '../../components/ui';
import Timetable from '../Timetable.jsx';

const nowTick = () => Date.now();

const CHART_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', 'var(--text2)'];
const PIE_STATUS = ['#fbbf24', '#38bdf8', '#34d399'];
const DARK_TOOLTIP = {
  backgroundColor: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (value && typeof value === 'object' ? value : {});

function Card({ title, subtitle, children, style }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 28%), var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 14,
        padding: 20,
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 16 }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font2)' }}>{title}</h3>
          )}
          {subtitle && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text2)' }}>{subtitle}</p>
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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%), linear-gradient(145deg, var(--bg3), var(--bg2))',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        padding: '18px 20px',
        minWidth: 140,
        flex: '1 1 140px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font2)', color: accent || 'var(--accent2)', margin: '8px 0 4px', lineHeight: 1 }}>{value}</p>
      {hint && <p style={{ fontSize: 11, color: 'var(--text2)', margin: 0 }}>{hint}</p>}
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
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [lFilters, setLFilters] = useState({ status: '', type: '', search: '' });
  const [events, setEvents] = useState([]);
  const [eFilters, setEFilters] = useState({ status: 'all', search: '', sort: 'startsAt_desc', page: 1, limit: 20 });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    venue: '',
    startsAt: '',
    endsAt: '',
    seats: '100',
    category: 'general',
    emoji: '🎉',
    prize: '',
    isActive: true,
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventNotice, setEventNotice] = useState(null);
  const [selectedEventToDelete, setSelectedEventToDelete] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [feedbackAi, setFeedbackAi] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [wellbeing, setWellbeing] = useState(null);
  const [students, setStudents] = useState([]);
  const [laundrySlots, setLaundrySlots] = useState([]);
  const [laundryBookings, setLaundryBookings] = useState([]);
  const [laundryLoading, setLaundryLoading] = useState(false);
  const [laundryRange, setLaundryRange] = useState({ from: null, to: null });
  const [sq, setSq] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminToast, setAdminToast] = useState(null); // { msg, type }

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

  const loadComplaints = useCallback(async ({ silent = false } = {}) => {
    const q = new URLSearchParams();
    if (cFilters.category) q.set('category', cFilters.category.trim());
    if (cFilters.status) q.set('status', cFilters.status.trim());
    if (cFilters.search) q.set('search', cFilters.search.trim());
    if (cFilters.dateFrom) q.set('dateFrom', cFilters.dateFrom.trim());
    if (cFilters.dateTo) q.set('dateTo', cFilters.dateTo.trim());
    const qs = q.toString();
    if (!silent) setComplaintsLoading(true);
    try {
      const d = await api(`/complaints${qs ? `?${qs}` : ''}`);
      setComplaints(d.complaints || []);
    } catch {
      setComplaints([]);
    } finally {
      if (!silent) setComplaintsLoading(false);
    }
  }, [cFilters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let lastRefreshAt = 0;
    const requestRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < 250) return;
      lastRefreshAt = now;
      loadDashboard();
    };

    const fn = () => requestRefresh();
    window.addEventListener('hostel:admin-stats', fn);

    return () => {
      window.removeEventListener('hostel:admin-stats', fn);
    };
  }, [loadDashboard]);

  useEffect(() => {
    const onComplaintUpdate = () => {
      loadDashboard();
      if (activePage === 'admin-complaints') loadComplaints();
    };

    window.addEventListener('hostel:complaints', onComplaintUpdate);

    return () => window.removeEventListener('hostel:complaints', onComplaintUpdate);
  }, [activePage, loadDashboard, loadComplaints]);

  const loadLeaves = useCallback(async () => {
    const q = new URLSearchParams();
    if (lFilters.status && lFilters.status !== 'all') q.set('status', lFilters.status);
    if (lFilters.type && lFilters.type !== 'all') q.set('type', lFilters.type);
    if (lFilters.search) q.set('search', lFilters.search);
    const qs = q.toString();
    try {
      const d = await api(`/leave/admin/all${qs ? `?${qs}` : ''}`);
      setLeaves(d.leaves || []);
    } catch {
      setLeaves([]);
    }
  }, [lFilters]);

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    if (activePage !== 'admin-events') return;
    try {
      if (!silent) setEventNotice(null);
      const q = new URLSearchParams();
      if (eFilters.status) q.set('status', eFilters.status);
      if (eFilters.search) q.set('search', eFilters.search);
      if (eFilters.sort) q.set('sort', eFilters.sort);
      if (eFilters.page) q.set('page', String(eFilters.page));
      if (eFilters.limit) q.set('limit', String(eFilters.limit));
      const qs = q.toString();
      const d = await api(`/admin/events${qs ? `?${qs}` : ''}`);
      setEvents(d.events || []);
    } catch {
      setEvents([]);
    }
  }, [activePage, eFilters]);

  const loadWellbeing = useCallback(async () => {
    if (activePage !== 'admin-wellbeing') return;
    try {
      const d = await api('/admin/wellbeing');
      setWellbeing(d);
    } catch {
      setWellbeing(null);
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === 'admin-complaints') loadComplaints();
  }, [activePage, loadComplaints]);

  useEffect(() => {
    if (activePage !== 'admin-complaints') return;
    if (!cFilters.search.trim()) return;
    const timer = setTimeout(() => {
      loadComplaints({ silent: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [activePage, cFilters.search, loadComplaints]);

  useEffect(() => {
    if (activePage === 'admin-leaves') loadLeaves();
  }, [activePage, loadLeaves]);

  useEffect(() => {
    if (activePage !== 'admin-leaves') return;
    let lastRefreshAt = 0;
    const refreshLeaves = () => {
      const current = nowTick();
      if (current - lastRefreshAt < 250) return;
      lastRefreshAt = current;
      loadLeaves();
      loadDashboard();
    };
    window.addEventListener('hostel:leave-new', refreshLeaves);
    window.addEventListener('hostel:leave-update', refreshLeaves);
    window.addEventListener('hostel:admin-stats', refreshLeaves);
    return () => {
      window.removeEventListener('hostel:leave-new', refreshLeaves);
      window.removeEventListener('hostel:leave-update', refreshLeaves);
      window.removeEventListener('hostel:admin-stats', refreshLeaves);
    };
  }, [activePage, loadLeaves, loadDashboard]);

  useEffect(() => {
    if (activePage !== 'admin-events') return;
    loadEvents();
  }, [activePage, loadEvents]);

  // Reload when filters change
  useEffect(() => {
    if (activePage !== 'admin-events') return;
    const t = setTimeout(() => loadEvents({ silent: false }), 120);
    return () => clearTimeout(t);
  }, [eFilters, activePage, loadEvents]);

  useEffect(() => {
    if (activePage !== 'admin-events') return;
    const refresh = () => loadEvents({ silent: true });
    window.addEventListener('hostel:events', refresh);
    window.addEventListener('hostel:admin-stats', refresh);
    return () => {
      window.removeEventListener('hostel:events', refresh);
      window.removeEventListener('hostel:admin-stats', refresh);
    };
  }, [activePage, loadEvents]);

  useEffect(() => {
    if (activePage !== 'admin-wellbeing') return;
    loadWellbeing();
  }, [activePage, loadWellbeing]);

  useEffect(() => {
    if (activePage !== 'admin-wellbeing') return;
    const refresh = () => loadWellbeing();
    window.addEventListener('hostel:wellbeing', refresh);
    window.addEventListener('hostel:admin-stats', refresh);
    return () => {
      window.removeEventListener('hostel:wellbeing', refresh);
      window.removeEventListener('hostel:admin-stats', refresh);
    };
  }, [activePage, loadWellbeing]);

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

  // Auto-dismiss admin toast
  useEffect(() => {
    if (!adminToast) return;
    const t = setTimeout(() => setAdminToast(null), 3500);
    return () => clearTimeout(t);
  }, [adminToast]);

  const runFeedbackAi = async () => {
    setFbLoading(true);
    setFeedbackAi(null);
    try {
      const d = await api('/admin/feedback-analysis?ai=1');
      setFeedbackAi(d.analyses || []);
    } catch (e) {
      const friendly = e.message && (e.message.includes('rate') || e.message.includes('quota'))
        ? 'AI temporarily unavailable — please try again later'
        : (e.message || 'AI analysis failed');
      setFeedbackAi([{ messHall: 'Error', feedbackCount: 0, summary: friendly, sentiment: 'neutral' }]);
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

  const approveLeave = async (id) => {
    try {
      await api(`/leave/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
      setAdminToast({ msg: 'Leave approved successfully', type: 'success' });
      loadLeaves();
      loadDashboard();
    } catch (e) {
      setAdminToast({ msg: 'Error approving leave: ' + (e.message || 'Unknown error'), type: 'error' });
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api(`/leave/${id}/reject`, { method: 'POST', body: JSON.stringify({}) });
      setAdminToast({ msg: 'Leave rejected successfully', type: 'success' });
      loadLeaves();
      loadDashboard();
    } catch (e) {
      setAdminToast({ msg: 'Error rejecting leave: ' + (e.message || 'Unknown error'), type: 'error' });
    }
  };

  const formatDateFull = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const openStudent = async (id) => {
    try {
      const d = await api(`/admin/students/${id}`);
      setSelectedStudent(d);
    } catch {
      setSelectedStudent(null);
    }
  };

  // Laundry admin: load slots and bookings, enable/disable slots
  const loadLaundryData = async (range) => {
    try {
      setLaundryLoading(true);
      setLaundrySlots([]);
      setLaundryBookings([]);

      const from = range?.from || new Date().toISOString().slice(0, 10);
      const to = range?.to || (() => { const d=new Date(); d.setDate(d.getDate()+6); return d.toISOString().slice(0,10); })();

      const s = await api(`/laundry/admin/slots?dateFrom=${from}&dateTo=${to}`);
      setLaundrySlots(s.slots || []);

      const b = await api(`/laundry/admin/bookings?dateFrom=${from}&dateTo=${to}`);
      setLaundryBookings(b.bookings || []);

      setLaundryRange({ from, to });
    } catch (e) {
      setAdminToast({ msg: 'Failed to load laundry data: ' + (e.message || 'Unknown'), type: 'error' });
    } finally {
      setLaundryLoading(false);
    }
  };

  useEffect(() => {
    if (activePage !== 'admin-laundry') return;
    loadLaundryData();
  }, [activePage]);

  const toggleBlockSlot = async (slotId, blocked) => {
    try {
      await api(`/laundry/admin/slots/${slotId}/block`, { method: 'POST', body: JSON.stringify({ blocked }) });
      setAdminToast({ msg: blocked ? 'Slot disabled' : 'Slot enabled', type: 'success' });
      loadLaundryData(laundryRange);
      loadDashboard();
    } catch (e) {
      setAdminToast({ msg: 'Action failed: ' + (e.message || 'Unknown'), type: 'error' });
    }
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      setEventNotice({ type: 'error', msg: 'Title is required' });
      return;
    }
    setEventSaving(true);
    setEventNotice(null);
    try {
      await api('/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: eventForm.title.trim(),
          description: eventForm.description.trim(),
          venue: eventForm.venue.trim(),
          startsAt: eventForm.startsAt || undefined,
          endsAt: eventForm.endsAt || undefined,
          seats: Number(eventForm.seats),
          category: eventForm.category,
          emoji: eventForm.emoji.trim() || '🎉',
          prize: eventForm.prize.trim(),
          isActive: !!eventForm.isActive,
        }),
      });
      setEventNotice({ type: 'success', msg: 'Event created successfully' });
      setEventForm({
        title: '',
        description: '',
        venue: '',
        startsAt: '',
        endsAt: '',
        seats: '100',
        category: 'general',
        emoji: '🎉',
        prize: '',
        isActive: true,
      });
      loadEvents({ silent: true });
      loadDashboard();
    } catch (err) {
      setEventNotice({ type: 'error', msg: err.message || 'Failed to create event' });
    } finally {
      setEventSaving(false);
    }
  };

  const safeDash = asObject(dash);
  const safeOv = asObject(safeDash.overview);
  const safeCharts = asObject(safeDash.charts);
  const safeInsights = asObject(safeDash.insights);
  const safeWellbeing = asObject(wellbeing);
  const safeComplaints = asArray(complaints);
  const safeLeaves = asArray(leaves);
  const safeEvents = asArray(events);
  const safeStudents = asArray(students);
  const safeLaundrySlots = asArray(laundrySlots);
  const safeLaundryBookings = asArray(laundryBookings);
  const safeFeedbackAi = asArray(feedbackAi);
  const utilizationPct = safeLaundrySlots.length
    ? Math.round((safeLaundrySlots.reduce((a, s) => a + (Number(s?.bookedCount || 0)), 0) / Math.max(1, safeLaundrySlots.length)) * 100)
    : 0;

  const view = activePage || 'admin-dashboard';

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 22%), linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)',
        color: 'var(--text)',
        padding: 28,
      }}
    >
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Signed in as {name}</p>
        <h1 style={{ fontFamily: 'var(--font2)', fontSize: 26, fontWeight: 800, margin: '6px 0 0', color: 'var(--text)' }}>
          {view === 'admin-dashboard' && 'Operations overview'}
          {view === 'admin-complaints' && 'Complaint management'}
          {view === 'admin-leaves' && 'Leave approvals'}
          {view === 'admin-events' && 'Events & registrations'}
          {view === 'admin-feedback' && 'Mess feedback intelligence'}
          {view === 'admin-wellbeing' && 'Wellbeing insights'}
          {view === 'admin-students' && 'Student directory'}
          {view === 'admin-laundry' && 'Laundry management'}
          {view === 'admin-timetable' && 'Timetable control'}
        </h1>
      </header>

      {loadErr && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {loadErr}
        </div>
      )}

      {adminToast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          padding: '12px 16px', borderRadius: 8, fontSize: 13,
          background: adminToast.type === 'success' ? 'rgba(98,132,90,0.16)' : 'rgba(184,91,51,0.16)',
          border: `1px solid ${adminToast.type === 'success' ? 'rgba(98,132,90,0.38)' : 'rgba(184,91,51,0.38)'}`,
          color: adminToast.type === 'success' ? '#9bd09a' : '#f2b3a0',
        }}>
          {adminToast.type === 'success' ? '✓ ' : '✕ '}{adminToast.msg}
        </div>
      )}

      {/* ─── DASHBOARD ─── */}
      {view === 'admin-dashboard' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
            <Metric label="Students" value={loading ? '…' : (safeOv?.totalStudents ?? '0')} hint="Registered" accent="#22d3ee" />
            <Metric label="Complaints" value={loading ? '…' : (safeOv?.totalComplaints ?? '0')} hint={`${safeOv?.pendingComplaints ?? 0} pending`} accent="#fbbf24" />
            <Metric label="Resolved" value={loading ? '…' : (safeOv?.resolvedComplaints ?? '0')} hint="Closed cases" accent="#34d399" />
            <Metric label="Event sign-ups" value={loading ? '…' : (safeOv?.totalEventRegistrations ?? '0')} hint={`${safeOv?.activeEvents ?? 0} active events`} accent="#a78bfa" />
            <Metric label="Mess feedback" value={loading ? '…' : (safeOv?.totalFeedbackEntries ?? '0')} hint="All entries" accent="#f472b6" />
            <Metric label="Support visits" value={loading ? '…' : (safeOv?.totalWellbeingLogs ?? '0')} hint="Logged appointments" accent="#38bdf8" />
            <Metric label="Leaves" value={loading ? '…' : (safeOv?.totalLeaves ?? '0')} hint={`${safeOv?.pendingLeaves ?? 0} pending`} accent="#34d399" />
          </div>

          {safeInsights?.mostFrequentComplaintCategory && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              Most common issue category: <strong style={{ color: 'var(--text)' }}>{safeInsights.mostFrequentComplaintCategory}</strong>
              {safeInsights.mostPopularEvent && (
                <>
                  {' · '}Popular event: <strong style={{ color: 'var(--text)' }}>{safeInsights.mostPopularEvent?.title || '—'}</strong> ({safeInsights.mostPopularEvent?.count ?? 0} regs)
                </>
              )}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 18 }}>
            <Card title="Complaints by category" subtitle="All time">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={asArray(safeCharts?.complaintsByCategory)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis type="number" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {asArray(safeCharts?.complaintsByCategory).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Fees analytics: status, monthly trend, payment methods */}
            <Card title="Fees — status" subtitle="Paid / Pending / Overdue">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: safeCharts?.feesStatusPie?.paid || 0 },
                      { name: 'Pending', value: safeCharts?.feesStatusPie?.pending || 0 },
                      { name: 'Overdue', value: safeCharts?.feesStatusPie?.overdue || 0 },
                    ]}
                    dataKey="value"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {['#34d399', '#fbbf24', '#ef4444'].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 12 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Monthly collections" subtitle="Collected vs pending">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={asArray(safeCharts?.feesMonthlyTrend)} margin={{ left: 6, right: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="label" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Area type="monotone" dataKey="collected" stackId="a" stroke="#34d399" fill="#034d2b22" />
                  <Area type="monotone" dataKey="pending" stackId="a" stroke="#fbbf24" fill="#7a4f0422" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Payment methods" subtitle="Distribution by amount">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={asArray(safeCharts?.feesPaymentDistribution)}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {asArray(safeCharts?.feesPaymentDistribution).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Complaint trend" subtitle="Last 30 days">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={asArray(safeCharts?.complaintTrend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="date" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
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
                      { name: 'Pending', value: safeCharts?.complaintStatusPie?.pending || 0 },
                      { name: 'In progress', value: safeCharts?.complaintStatusPie?.in_progress || 0 },
                      { name: 'Resolved', value: safeCharts?.complaintStatusPie?.resolved || 0 },
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
                  <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 12 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Feedback sentiment (ratings)" subtitle="Heuristic from star ratings">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive (4–5★)', value: safeCharts?.feedbackSentiment?.positive || 0 },
                      { name: 'Neutral (3★)', value: safeCharts?.feedbackSentiment?.neutral || 0 },
                      { name: 'Negative (1–2★)', value: safeCharts?.feedbackSentiment?.negative || 0 },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={85}
                  >
                    {['#34d399', '#fbbf24', '#f87171'].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Events — registrations" subtitle="Per event">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={asArray(safeCharts?.eventRegistrations)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="title" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 9 }} angle={-18} textAnchor="end" height={70} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Leave by type" subtitle="Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={asArray(safeCharts?.leavesByType)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Leave trends" subtitle="Last 30 days">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={asArray(safeCharts?.leaveTrend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="date" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Leave approval status" subtitle="Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: safeCharts?.leaveStatusPie?.pending || 0 },
                      { name: 'Approved', value: safeCharts?.leaveStatusPie?.approved || 0 },
                      { name: 'Rejected', value: safeCharts?.leaveStatusPie?.rejected || 0 },
                    ]}
                    dataKey="value"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {['#fbbf24', '#34d399', '#ef4444'].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 12 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Frequent leave users" subtitle="Top 5 students">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={asArray(safeCharts?.frequentLeaveUsers)} layout="vertical" margin={{ left: 120, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis type="number" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="studentName" width={115} stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Bar dataKey="leaveCount" fill="#f472b6" radius={[0, 6, 6, 0]}>
                    {asArray(safeCharts?.frequentLeaveUsers).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {/* ─── LAUNDRY ─── */}
      {view === 'admin-laundry' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
            <Metric label="Total Slots" value={laundryLoading ? '…' : safeLaundrySlots.length} hint="Next 7 days" />
            <Metric label="Confirmed Bookings" value={laundryLoading ? '…' : safeLaundryBookings.length} hint="Confirmed" accent="#34d399" />
            <Metric
              label="Utilization"
              value={laundryLoading ? '…' : `${utilizationPct}%`}
              hint="Booked slots / total slots"
              accent="#f472b6"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18, marginBottom: 18 }}>
            <Card title={`Slots (${safeLaundrySlots.length})`} subtitle="Disable/Enable slots for maintenance">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {safeLaundrySlots.map((s) => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg3)', borderRadius: 10, border: '1px solid rgba(51,65,85,0.5)' }}>
                    <div>
                      <strong style={{ color: 'var(--text)' }}>{s.timeStart} – {s.timeEnd} · {new Date(s.date).toLocaleDateString()}</strong>
                      <p style={{ margin: 4, fontSize: 12, color: 'var(--text3)' }}>{s.mode} · Machine {s.machineId || '—'}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>{(s.bookedCount || 0)} bookings</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleBlockSlot(s._id, !s.isBlocked)}>
                        {s.isBlocked ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </div>
                ))}
                {safeLaundrySlots.length === 0 && <p style={{ color: 'var(--text3)' }}>No slots available in range.</p>}
              </div>
            </Card>

            <Card title={`Recent bookings (${safeLaundryBookings.length})`} subtitle="Latest confirmed bookings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {safeLaundryBookings.slice(0, 20).map((b) => (
                  <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg3)', borderRadius: 10, border: '1px solid rgba(51,65,85,0.5)' }}>
                    <div>
                      <strong style={{ color: 'var(--text)' }}>{b.tokenId}</strong>
                      <p style={{ margin: 4, fontSize: 12, color: 'var(--text3)' }}>{b.userId?.username || b.userId?.name} · {b.slotId?.timeStart}–{b.slotId?.timeEnd}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(b.bookingDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {safeLaundryBookings.length === 0 && <p style={{ color: 'var(--text3)' }}>No bookings in range.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {view === 'admin-timetable' && (
        <div style={{ minHeight: 'calc(100vh - 140px)' }}>
          <Timetable />
        </div>
      )}

      {/* ─── COMPLAINTS ─── */}
      {view === 'admin-complaints' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Category
              <input
                className="input"
                style={{
                  display: 'block',
                  marginTop: 4,
                  background: cFilters.category ? 'rgba(180,115,51,0.12)' : 'var(--bg3)',
                  borderColor: cFilters.category ? 'rgba(180,115,51,0.55)' : 'var(--border2)',
                  color: 'var(--text)',
                  boxShadow: cFilters.category ? '0 0 0 1px rgba(180,115,51,0.08)' : 'none',
                }}
                value={cFilters.category}
                onChange={(e) => setCFilters((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Electricity"
              />
            </label>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Status
              <select
                className="select"
                style={{
                  display: 'block',
                  marginTop: 4,
                  background: cFilters.status ? 'rgba(180,115,51,0.12)' : 'var(--bg3)',
                  borderColor: cFilters.status ? 'rgba(180,115,51,0.55)' : 'var(--border2)',
                  color: 'var(--text)',
                }}
                value={cFilters.status}
                onChange={(e) => setCFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Search
              <input
                className="input"
                style={{
                  display: 'block',
                  marginTop: 4,
                  minWidth: 180,
                  background: cFilters.search ? 'rgba(180,115,51,0.12)' : 'var(--bg3)',
                  borderColor: cFilters.search ? 'rgba(180,115,51,0.55)' : 'var(--border2)',
                  color: 'var(--text)',
                }}
                value={cFilters.search}
                onChange={(e) => setCFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Name, room, text…"
              />
            </label>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => loadComplaints()}
              disabled={complaintsLoading}
              style={{ marginBottom: 2, opacity: complaintsLoading ? 0.75 : 1 }}
            >
              {complaintsLoading ? 'Applying…' : 'Apply filters'}
            </button>
          </div>

          {(cFilters.category || cFilters.status || cFilters.search) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {cFilters.category && (
                <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(180,115,51,0.14)', border: '1px solid rgba(180,115,51,0.3)', color: '#fcd9b6' }}>
                  Category: {cFilters.category}
                </span>
              )}
              {cFilters.status && (
                <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: 'var(--blue)' }}>
                  Status: {cFilters.status}
                </span>
              )}
              {cFilters.search && (
                <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--green)' }}>
                  Search: {cFilters.search}
                </span>
              )}
            </div>
          )}

          <Card title={`All complaints (${safeComplaints.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {safeComplaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    background: 'var(--bg3)',
                    borderRadius: 10,
                    border: '1px solid rgba(51,65,85,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <strong style={{ color: 'var(--text)' }}>{c.title}</strong>
                      <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0' }}>
                        {c.student?.username} · Room {c.student?.room || c.roomHint || '—'} · {c.category}
                      </p>
                      {c.description && <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{c.description}</p>}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: c.status === 'resolved' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                        color: c.status === 'resolved' ? 'var(--success)' : '#fcd34d',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {c.status === 'pending' && (
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => patchComplaint(c._id || c.id, 'in-progress')}>
                        Mark in progress
                      </button>
                    )}
                    {c.status !== 'resolved' && (
                      <button type="button" className="btn btn-success btn-xs" onClick={() => patchComplaint(c._id || c.id, 'resolved')}>
                        Resolve
                      </button>
                    )}
                    {c.status === 'resolved' && (
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => deleteComplaint(c._id || c.id)}>
                        Delete record
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {safeComplaints.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>No complaints found for selected filters</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ─── LEAVES ─── */}
      {view === 'admin-leaves' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Status
              <select
                className="select"
                style={{ display: 'block', marginTop: 4, background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                value={lFilters.status}
                onChange={(e) => setLFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Type
              <select
                className="select"
                style={{ display: 'block', marginTop: 4, background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                value={lFilters.type}
                onChange={(e) => setLFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="">All</option>
                <option value="leave">Leave</option>
                <option value="outing">Outing</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: 'var(--text3)' }}>
              Search
              <input
                className="input"
                style={{ display: 'block', marginTop: 4, minWidth: 180, background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                value={lFilters.search}
                onChange={(e) => setLFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Name, username…"
              />
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadLeaves} style={{ marginBottom: 2 }}>
              Apply filters
            </button>
          </div>

          <Card title={`Leave applications (${safeLeaves.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {safeLeaves.map((l) => (
                <div
                  key={l._id}
                  style={{
                    padding: 14,
                    background: 'var(--bg3)',
                    borderRadius: 10,
                    border: '1px solid rgba(51,65,85,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <strong style={{ color: 'var(--text)' }}>{l.type === 'leave' ? '✈️ Leave' : '🚪 Outing'}</strong>
                      <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0' }}>
                        {l.userId?.username} ({l.userId?.name}) · {formatDateFull(l.from)}{l.to !== l.from ? ` → ${formatDateFull(l.to)}` : ''}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{l.reason}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: l.status === 'approved' ? 'rgba(16,185,129,0.15)' :
                                   l.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                        color: l.status === 'approved' ? 'var(--success)' :
                          l.status === 'rejected' ? 'var(--danger)' : 'var(--amber)',
                      }}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {l.status === 'pending' && (
                      <>
                        <button type="button" className="btn btn-success btn-xs" onClick={() => approveLeave(l._id)}>
                          Approve
                        </button>
                        <button type="button" className="btn btn-danger btn-xs" onClick={() => rejectLeave(l._id)}>
                          Reject
                        </button>
                      </>
                    )}
                    {l.status !== 'pending' && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {l.approverNotes ? `📝 ${l.approverNotes}` : 'No notes'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {safeLeaves.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>No leave applications match filters.</p>}
            </div>
          </Card>
        </div>
      )}
      {view === 'admin-events' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <Card title="Create event" subtitle="Saved to MongoDB and pushed live to students">
            <form onSubmit={submitEvent} style={{ display: 'grid', gap: 12 }}>
              <div className="grid-2" style={{ gap: 12 }}>
                <Field label="Title">
                  <input className="input" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="Inter-Hostel Hackathon" />
                </Field>
                <Field label="Category">
                  <input className="input" value={eventForm.category} onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))} placeholder="general / hackathon / cultural" />
                </Field>
              </div>
              <Field label="Description">
                <textarea className="input" rows="3" value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short event description" />
              </Field>
              <div className="grid-2" style={{ gap: 12 }}>
                <Field label="Venue">
                  <input className="input" value={eventForm.venue} onChange={(e) => setEventForm((f) => ({ ...f, venue: e.target.value }))} placeholder="Main Auditorium" />
                </Field>
                <Field label="Emoji">
                  <input className="input" value={eventForm.emoji} onChange={(e) => setEventForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🎉" />
                </Field>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <Field label="Starts at">
                  <input className="input" type="datetime-local" value={eventForm.startsAt} onChange={(e) => setEventForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </Field>
                <Field label="Ends at">
                  <input className="input" type="datetime-local" value={eventForm.endsAt} onChange={(e) => setEventForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </Field>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <Field label="Seats">
                  <input className="input" type="number" min="1" value={eventForm.seats} onChange={(e) => setEventForm((f) => ({ ...f, seats: e.target.value }))} />
                </Field>
                <Field label="Prize / Notes">
                  <input className="input" value={eventForm.prize} onChange={(e) => setEventForm((f) => ({ ...f, prize: e.target.value }))} placeholder="₹10k prize pool" />
                </Field>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={eventForm.isActive} onChange={(e) => setEventForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Accept registrations immediately
              </label>
              {eventNotice && (
                <div style={{ padding: '10px 12px', borderRadius: 10, background: eventNotice.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${eventNotice.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: eventNotice.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
                  {eventNotice.msg}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={eventSaving} style={{ width: 'fit-content' }}>
                {eventSaving ? 'Creating…' : 'Create event'}
              </button>
            </form>
          </Card>

          <Card title="Campus events">
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input className="input" placeholder="Search events" value={eFilters.search} onChange={(e) => setEFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} style={{ minWidth: 200 }} />
                <select className="input" value={eFilters.status} onChange={(e) => setEFilters((p) => ({ ...p, status: e.target.value, page: 1 }))} style={{ width: 160 }}>
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="full">Full</option>
                </select>
                <select className="input" value={eFilters.sort} onChange={(e) => setEFilters((p) => ({ ...p, sort: e.target.value }))} style={{ width: 160 }}>
                  <option value="startsAt_desc">Starts (new→old)</option>
                  <option value="startsAt_asc">Starts (old→new)</option>
                  <option value="title_asc">Title A→Z</option>
                </select>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEFilters({ status: 'all', search: '', sort: 'startsAt_desc', page: 1, limit: 20 }); }}>Clear</button>
              </div>
              {safeEvents.map((ev) => (
                <div
                  key={ev._id || ev.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    background: 'var(--bg3)',
                    borderRadius: 10,
                    border: '1px solid var(--border2)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>{ev.title}</strong>
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: '6px 0 0' }}>{ev.venue || '—'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent2)' }}>{ev.registrationCount}</span>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>registrations</p>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {selectedEventToDelete === (ev._id || ev.id) ? (
                        <>
                          <button type="button" className="btn btn-danger btn-sm" onClick={async () => {
                            const id = ev._id || ev.id;
                            try {
                              setDeletingEventId(id);
                              await api(`/events/${id}`, { method: 'DELETE' });
                              setEvents((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
                              setAdminToast({ msg: 'Event deleted', type: 'success' });
                              // trigger dashboard / other listeners
                              try { window.dispatchEvent(new CustomEvent('hostel:events')); } catch {}
                            } catch (e) {
                              setAdminToast({ msg: 'Failed to delete event: ' + (e.message || 'Unknown'), type: 'error' });
                            } finally {
                              setDeletingEventId(null);
                              setSelectedEventToDelete(null);
                              loadDashboard();
                            }
                          }} disabled={deletingEventId === (ev._id || ev.id)} style={{ minWidth: 90 }}>
                            {deletingEventId === (ev._id || ev.id) ? 'Deleting…' : 'Confirm delete'}
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEventToDelete(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEventToDelete(ev._id || ev.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {safeEvents.length === 0 && <p style={{ color: 'var(--text3)' }}>No events in database. Add one above to get started.</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ─── FEEDBACK AI ─── */}
      {view === 'admin-feedback' && (
        <Card title="Gemini analysis by mess group" subtitle="Tags on reviews bucket feedback (default: Campus-wide).">
          <button type="button" className="btn btn-primary" disabled={fbLoading} onClick={runFeedbackAi} style={{ marginBottom: 20 }}>
            {fbLoading ? 'Analyzing…' : 'Run AI analysis'}
          </button>
          <div style={{ display: 'grid', gap: 16 }}>
            {safeFeedbackAi.map((row) => (
              <div
                key={row.messHall}
                style={{
                  padding: 16,
                  background: 'var(--bg3)',
                  borderRadius: 10,
                  border: '1px solid var(--border2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>{row.messHall}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{row.feedbackCount} entries</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: row.sentiment === 'positive' ? 'rgba(52,211,153,0.2)' : row.sentiment === 'negative' ? 'var(--red-bg)' : 'rgba(148,163,184,0.2)',
                    color: 'var(--text)',
                  }}
                >
                  {row.sentiment}
                </span>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{row.summary}</p>
              </div>
            ))}
            {safeFeedbackAi.length === 0 && !fbLoading && <p style={{ color: 'var(--text3)', fontSize: 13 }}>Click to analyze all mess feedback with Gemini.</p>}
          </div>
        </Card>
      )}

      {/* ─── WELLBEING ─── */}
      {view === 'admin-wellbeing' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Metric label="Logged check-ins" value={String(safeWellbeing.totalAppointments ?? 0)} hint="All records" accent="#38bdf8" />
            <Metric label="Avg stress" value={String(safeWellbeing.averageStress ?? 0)} hint="1 = calm, 5 = high" accent="#fbbf24" />
            <Metric label="High stress" value={String(safeWellbeing.highStressCount ?? 0)} hint="Recent logs ≥ 4" accent="#fb7185" />
            <Metric label="Mood groups" value={String(asArray(safeWellbeing.moodDistribution).length)} hint="Tracked moods" accent="#34d399" />
          </div>

          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>{safeWellbeing.highlight ?? ''}</p>

          <div className="grid-2" style={{ gap: 18 }}>
            <Card title="Mood distribution" subtitle="Last 90 days">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={asArray(safeWellbeing.moodDistribution).map((row) => ({ name: row.name, value: row.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {asArray(safeWellbeing.moodDistribution).map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Stress trend" subtitle="Average stress over the last 30 days">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={asArray(safeWellbeing.stressTrend || safeWellbeing.trend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="date" stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <YAxis domain={[1, 5]} allowDecimals={false} stroke="var(--text3)" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip contentStyle={DARK_TOOLTIP} />
                  <Area type="monotone" dataKey="avgStress" stroke="#fbbf24" fill="rgba(251,191,36,0.16)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Recent wellbeing activity" subtitle="Latest student check-ins">
            <div style={{ display: 'grid', gap: 10 }}>
              {asArray(safeWellbeing.recentActivity).map((row) => (
                <TimelineItem key={row.id} dot={row.stressLevel >= 4 ? 'red' : row.stressLevel >= 3 ? 'amber' : 'green'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ color: 'var(--text)' }}>{row.username}</strong>
                      <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0 0' }}>
                        {row.roomNumber ? `Room ${row.roomNumber} · ` : ''}{row.kind || 'general'} · {new Date(row.visitDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 120 }}>
                      <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'var(--accent-glow)', color: 'var(--accent2)', fontSize: 11, fontWeight: 700 }}>
                        {row.mood}
                      </span>
                      <p style={{ fontSize: 11, color: 'var(--text2)', margin: '6px 0 0' }}>Stress {row.stressLevel}/5</p>
                    </div>
                  </div>
                  {row.notes && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{row.notes}</p>}
                </TimelineItem>
              ))}
              {asArray(safeWellbeing.recentActivity).length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>No wellbeing activity yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ─── STUDENTS ─── */}
      {view === 'admin-students' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 1.1fr' : '1fr', gap: 20 }}>
          <Card title="Search students">
            <input
              className="input"
              style={{ width: '100%', marginBottom: 16, background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' }}
              placeholder="Name, email, room…"
              value={sq}
              onChange={(e) => setSq(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {safeStudents.map((s) => (
                <button
                type="button"
                key={s._id || s.id}
                  onClick={() => openStudent(s._id || s.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--border2)',
                    background: 'var(--bg3)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{s.username}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>{s.email}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Room {s.roomNumber || '—'}</span>
                </button>
              ))}
            </div>
          </Card>
          {selectedStudent && (
            <Card title="Student profile">
              <p style={{ fontSize: 14, marginTop: 0 }}>
                <strong>{selectedStudent.user?.username}</strong> · {selectedStudent.user?.email}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Room {selectedStudent.user?.roomNumber || '—'}</p>
              <h4 style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', margin: '20px 0 8px' }}>Complaints</h4>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text2)' }}>
                {asArray(selectedStudent?.complaints).slice(0, 8).map((x) => (
                  <li key={x.id || x._id}>
                    {x.title} — <span style={{ color: 'var(--text2)' }}>{x.status}</span>
                  </li>
                ))}
              </ul>
              <h4 style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', margin: '16px 0 8px' }}>Feedback</h4>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text2)' }}>
                {asArray(selectedStudent?.feedback).slice(0, 6).map((x) => (
                  <li key={x.id || x._id}>
                    {x.foodItem} ({x.rating}★)
                  </li>
                ))}
              </ul>
              <h4 style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', margin: '16px 0 8px' }}>Support visits</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{asArray(selectedStudent?.wellbeingLogs).length} on file</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
