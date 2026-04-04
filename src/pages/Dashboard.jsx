// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { StatCard, Card, SectionHeader, TimelineItem, GlowCard } from '../components/ui';
import { attendanceData, messMenu, adminStats, recentActivity, todayTimeline } from '../data/mockData';
import { greet } from '../utils';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// MacOS-style Dock
function Dock({ onNavigate }) {
  const [hovered, setHovered] = useState(null);
  const dockItems = [
    { label: 'Dashboard',   icon: '⊞',  page: 'dashboard',   color: '#6366f1' },
    { label: 'Mess',        icon: '🍽️', page: 'mess',         color: '#10b981' },
    { label: 'Attendance',  icon: '📍', page: 'attendance',   color: '#3b82f6' },
    { label: 'Complaints',  icon: '🛠️', page: 'complaints',   color: '#ef4444' },
    { label: 'Leave',       icon: '✈️', page: 'leave',        color: '#f59e0b' },
    { label: 'Laundry',     icon: '🧺', page: 'laundry',      color: '#14b8a6' },
    { label: 'Events',      icon: '🎮', page: 'events',       color: '#a855f7' },
    { label: 'Hospital',    icon: '🏥', page: 'hospital',     color: '#ec4899' },
    { label: 'Lost+Found',  icon: '🔍', page: 'lost-found',   color: '#f97316' },
    { label: 'Timetable',   icon: '📅', page: 'timetable',    color: '#84cc16' },
  ];

  const getScale = (i) => {
    if (hovered === null) return 1;
    const dist = Math.abs(i - hovered);
    if (dist === 0) return 1.5;
    if (dist === 1) return 1.25;
    if (dist === 2) return 1.1;
    return 1;
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', marginBottom: 28,
      padding: '8px 16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 20, backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {dockItems.map((item, i) => {
          const scale = getScale(i);
          return (
            <div key={item.page} title={item.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNavigate(item.page)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
                transform: `scale(${scale}) translateY(${hovered === i ? -8 : 0}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${item.color}22`,
                border: `1px solid ${item.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, transition: 'all .15s',
                boxShadow: hovered === i ? `0 4px 16px ${item.color}44` : 'none',
              }}>{item.icon}</div>
              {hovered === i && (
                <div style={{
                  position: 'absolute', bottom: '100%', marginBottom: 6,
                  background: 'var(--bg4)', border: '1px solid var(--border2)',
                  borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                  color: 'var(--text)', whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow)',
                }}>{item.label}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Today's Events Timeline Panel
function TodayPanel() {
  const typeIcon = { mess: '🍽️', class: '📚', gym: '🏋️', event: '🎮', hostel: '🏠' };
  const typeColor = { mess: 'var(--green)', class: 'var(--accent)', gym: 'var(--teal)', event: 'var(--purple)', hostel: 'var(--amber)' };
  const upcoming = todayTimeline.filter(e => !e.done);
  const done = todayTimeline.filter(e => e.done);

  return (
    <Card className="card-p">
      <SectionHeader title="Today's Agenda" subtitle={`${done.length} done · ${upcoming.length} upcoming`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {todayTimeline.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            borderRadius: 8, background: ev.done ? 'transparent' : 'var(--bg3)',
            border: `1px solid ${ev.done ? 'transparent' : 'var(--border)'}`,
            opacity: ev.done ? 0.5 : 1, transition: 'all .2s',
          }}>
            <span style={{ fontSize: 16 }}>{typeIcon[ev.type]}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: ev.done ? 400 : 600, textDecoration: ev.done ? 'line-through' : 'none' }}>{ev.label}</p>
            </div>
            <span style={{ fontSize: 11, color: typeColor[ev.type], fontWeight: 600, flexShrink: 0 }}>{ev.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard({ onNavigate }) {
  const { user, role } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(0);

  const loadComplaints = useCallback(async () => {
    if (role !== 'student') return;
    try {
      const d = await api('/complaints/user');
      const list = d.complaints || [];
      setComplaintOpen(list.filter((c) => c.status !== 'resolved').length);
    } catch {
      setComplaintOpen(0);
    }
  }, [role]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    window.addEventListener('hostel:complaints', loadComplaints);
    return () => window.removeEventListener('hostel:complaints', loadComplaints);
  }, [loadComplaints]);

  const isAdmin = role === 'admin';
  const firstName = (user?.name || 'Student').split(' ')[0];

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 22 }}>
          {greet()}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; Room {user?.room || '—'}
        </p>
      </div>

      {/* MacOS Dock */}
      <Dock onNavigate={onNavigate} />

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="📍" label="Attendance"       value={`${attendanceData.percentage}%`} change="2.1% this month"  changeType="up"  accentColor="var(--accent)" />
        <StatCard icon="🛠️" label="Active Complaints" value={isAdmin ? adminStats.activeComplaints : complaintOpen} change={isAdmin ? '3 resolved today' : 'Live from API'} changeType="up" accentColor="var(--red)" />
        <StatCard icon="🍽️" label="Mess Attendance"  value="89%"  change="3% vs avg"         changeType="up"  accentColor="var(--green)" />
        <StatCard icon="✈️" label="Pending Leaves"   value="1"    change="Next: Dec 5–8"      accentColor="var(--amber)" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Attendance Chart */}
        <Card className="card-p">
          <SectionHeader title="Attendance Trend" subtitle="Monthly percentage" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={attendanceData.chartData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pct" name="Attendance" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Mess Feedback Chart */}
        <Card className="card-p">
          <SectionHeader title="Mess Feedback" subtitle="This week's ratings" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={messMenu.feedbackTrend} barSize={8}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[3, 5]} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="breakfast" name="Breakfast" fill="var(--amber)"  radius={[4,4,0,0]} />
              <Bar dataKey="lunch"     name="Lunch"     fill="var(--green)"  radius={[4,4,0,0]} />
              <Bar dataKey="dinner"    name="Dinner"    fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Today's Timeline */}
        <TodayPanel />

        {/* Recent Activity */}
        <Card className="card-p">
          <SectionHeader title="Recent Activity" />
          {recentActivity.slice(0, 5).map(a => (
            <TimelineItem key={a.id} dot={a.color}>
              <p style={{ fontSize: 13 }}>{a.text}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{a.time}</p>
            </TimelineItem>
          ))}
        </Card>
      </div>

      {/* AI Mess Insights */}
      <GlowCard color="var(--green)" style={{ marginBottom: 24 }}>
        <SectionHeader title="🤖 AI Mess Insights" subtitle="Powered by feedback analytics" />
        <div className="grid-2" style={{ gap: 10 }}>
          {messMenu.aiInsights.map((ins, i) => (
            <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Today's Mess */}
      <Card className="card-p">
        <SectionHeader title="Today's Mess" subtitle={messMenu.date} action={
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('mess')}>Full Menu →</button>
        } />
        <div className="grid-4" style={{ gap: 10 }}>
          {messMenu.meals.map(meal => (
            <div key={meal.id} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{meal.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{meal.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{meal.time}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--amber)', fontSize: 12 }}>★</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{meal.rating}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>({meal.votes})</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Admin Panel */}
      {isAdmin && (
        <div style={{ marginTop: 24 }}>
          <SectionHeader title="🧑‍💼 Admin Overview" subtitle="Live hostel status" action={
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('admin')}>Full Dashboard →</button>
          } />
          <div className="stats-grid" style={{ marginTop: 12 }}>
            <StatCard icon="👥" label="Total Students"  value={adminStats.totalStudents}  accentColor="var(--accent)" />
            <StatCard icon="🛠️" label="Active Complaints" value={adminStats.activeComplaints} accentColor="var(--red)" />
            <StatCard icon="✈️" label="Pending Leaves"  value={adminStats.pendingLeaves}  accentColor="var(--amber)" />
            <StatCard icon="💰" label="Fee Defaulters"   value={adminStats.pendingFees}    accentColor="var(--pink)" />
          </div>
        </div>
      )}
    </div>
  );
}
