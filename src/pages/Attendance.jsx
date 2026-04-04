// src/pages/Attendance.jsx
import { useState, useRef } from 'react';
import { Card, SectionHeader, Badge, ProgressBar, GlowCard } from '../components/ui';
import { attendanceData, currentUser } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const statusColor = { present: 'var(--green)', absent: 'var(--red)', leave: 'var(--amber)' };
const statusLabel = { present: 'Present', absent: 'Absent', leave: 'On Leave' };
const statusBg    = { present: 'var(--green-bg)', absent: 'var(--red-bg)', leave: 'var(--amber-bg)' };

export default function Attendance() {
  const { user, role } = useAuth();
  const roomLine = role === 'student' && user?.room ? user.room : currentUser.room;

  const [markState, setMarkState] = useState('idle'); // idle|locating|camera|verified|done
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef();

  const startMark = async () => {
    setMarkState('locating');
    await new Promise(r => setTimeout(r, 1200));
    setMarkState('camera');
    // Try to open camera (gracefully fails in sandbox)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraOn(true); }
    } catch { /* camera not available in demo */ }
    await new Promise(r => setTimeout(r, 1500));
    setMarkState('verified');
    await new Promise(r => setTimeout(r, 1000));
    setMarkState('done');
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Attendance</h1>
        <p className="page-desc">GPS geo-fenced + camera-verified anti-proxy attendance</p>
      </div>

      {/* Mark attendance panel */}
      <GlowCard color="var(--accent)" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px', gap: 16 }}>

          {markState === 'idle' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Mark Today's Hostel Attendance</p>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>Check-in window: 9:00 PM – 11:59 PM</p>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                {[{ label:'GPS',       icon:'📍', ok: true },
                  { label:'Camera',    icon:'📷', ok: true },
                  { label:'Anti-Proxy',icon:'🛡️', ok: true }].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 6px' }}>{s.icon}</div>
                    <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{s.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--text3)' }}>Ready</p>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14 }} onClick={startMark}>
                📍 Mark Attendance
              </button>
            </>
          )}

          {markState === 'locating' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Acquiring GPS location…</p>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Verifying you are within hostel boundary</p>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '12px auto 0' }} />
            </div>
          )}

          {markState === 'camera' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>✓ GPS Verified — In hostel zone</div>
              <div style={{
                width: 160, height: 120, borderRadius: 12, overflow: 'hidden',
                background: 'var(--bg3)', border: '2px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px', position: 'relative',
              }}>
                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!cameraOn && <span style={{ fontSize: 36, position: 'absolute' }}>📷</span>}
                {/* Scan overlay */}
                <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent)', borderRadius: 10, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Camera verification in progress…</p>
            </div>
          )}

          {markState === 'verified' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>👤</div>
              <p style={{ fontWeight: 700, color: 'var(--green)' }}>Face Verified!</p>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Identity confirmed — marking attendance…</p>
            </div>
          )}

          {markState === 'done' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font2)', color: 'var(--green)' }}>Checked in successfully!</p>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
                {new Date().toLocaleTimeString('en-IN')} · {roomLine}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['📍 GPS Verified', '📷 Camera Verified', '🛡️ Anti-Proxy OK'].map(tag => (
                  <span key={tag} style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)', padding: '4px 12px', borderRadius: 20 }}>{tag}</span>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setMarkState('idle')}>Reset Demo</button>
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </GlowCard>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label:'Percentage', value:`${attendanceData.percentage}%`, color:'var(--green)' },
          { label:'Present',    value:attendanceData.present,          color:'var(--accent)' },
          { label:'Absent',     value:attendanceData.absent,           color:'var(--red)' },
          { label:'On Leave',   value:attendanceData.leave,            color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-value font2" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Area chart */}
        <Card className="card-p">
          <SectionHeader title="Monthly Attendance" subtitle="Last 6 months" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceData.chartData}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70,100]} tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
              <Area type="monotone" dataKey="pct" name="Attendance %" stroke="var(--accent)" fill="url(#attGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Attendance log */}
        <Card className="card-p">
          <SectionHeader title="Recent Logs" subtitle="Last 8 days" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attendanceData.history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: 'var(--bg3)', borderRadius: 'var(--radius)',
                border: `1px solid ${h.status === 'absent' ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: statusColor[h.status] }} />
                <span style={{ fontSize: 13, flex: 1 }}>
                  {new Date(h.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{h.time || '—'}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: statusColor[h.status], background: statusBg[h.status] }}>
                  {statusLabel[h.status]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
