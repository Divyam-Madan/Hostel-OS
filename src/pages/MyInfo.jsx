// src/pages/MyInfo.jsx
import { useState } from 'react';
import { Card, InfoRow, Badge, GlowCard, SectionHeader } from '../components/ui';
import { currentUser, attendanceData } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

const roommates = [
  { id: 'S2024002', name: 'Rahul Verma', roll: '21CS102', email: 'rahul.v@college.edu', photo: 'RV', phone: '+91 87654 32109', course: 'B.Tech CSE' },
  { id: 'S2024003', name: 'Dev Patel',   roll: '21ME045', email: 'dev.p@college.edu',  photo: 'DP', phone: '+91 76543 21098', course: 'B.Tech ME' },
];

export default function MyInfo() {
  const { user, role } = useAuth();
  const [credVisible, setCredVisible] = useState(false);
  const live = user && role === 'student';

  const hostelRank = { rank: 12, total: 624, percentile: 98, badge: 'Top 2%' };
  const display = live
    ? { ...currentUser, name: user.name, email: user.email, room: user.room, photo: user.photo }
    : currentUser;

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">My Profile</h1>
        <p className="page-desc">Student information and hostel details</p>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <GlowCard color="var(--accent)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {display.photo}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 18 }}>{display.name}</h2>
                <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{currentUser.roll} · {currentUser.branch}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <Badge variant="blue">{currentUser.year}</Badge>
                  <Badge variant="purple">{currentUser.hostel.split('–')[0].trim()}</Badge>
                </div>
              </div>
            </div>
            <InfoRow label="Email"        value={display.email} />
            <InfoRow label="Phone"        value={currentUser.phone} />
            <InfoRow label="Blood Group"  value={currentUser.bloodGroup} />
            <InfoRow label="Parent Phone" value={currentUser.parentPhone} />
            <InfoRow label="Admitted"     value={new Date(currentUser.admissionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
          </GlowCard>

          {/* Hostel Rank */}
          <Card className="card-p" style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.03)' }}>
            <SectionHeader title="🏆 Hostel Rank" subtitle="Based on attendance, behaviour & fees" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font2)', fontWeight: 800, fontSize: 42, color: 'var(--amber)', lineHeight: 1 }}>#{hostelRank.rank}</p>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>of {hostelRank.total}</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Percentile</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>{hostelRank.percentile}th</span>
                </div>
                <div className="progress" style={{ marginBottom: 10 }}>
                  <div className="progress-fill" style={{ width: `${hostelRank.percentile}%`, background: 'var(--amber)' }} />
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--amber-bg)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20 }}>
                  <span style={{ fontSize: 14 }}>⭐</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>{hostelRank.badge}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Credentials Panel */}
          <Card className="card-p">
            <SectionHeader title="🔐 Credentials" action={
              <button className="btn btn-ghost btn-sm" onClick={() => setCredVisible(v => !v)}>
                {credVisible ? '🙈 Hide' : '👁 Show'}
              </button>
            } />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Portal Login ID', value: currentUser.roll },
                { label: 'Email',           value: display.email },
                { label: 'WiFi Password',   value: credVisible ? 'WIFI@2024hostel' : '••••••••••••••' },
                { label: 'Mess Card ID',    value: credVisible ? `MESS-${live ? user.id : currentUser.id}` : '•••••••••••' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent2)' }}>{c.value}</span>
                </div>
              ))}
            </div>
            {!credVisible && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>🔒 Credentials hidden for security. Tap Show to reveal.</p>}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hostel details */}
          <Card className="card-p">
            <SectionHeader title="🏠 Hostel Details" />
            <InfoRow label="Room Number"  value={display.room} />
            <InfoRow label="Block"        value={currentUser.hostel} />
            <InfoRow label="Proctor"      value={currentUser.proctor} />
            <InfoRow label="Proctor Email" value={currentUser.proctorEmail} />
            <InfoRow label="Proctor Phone" value={currentUser.proctorPhone} />
            <InfoRow label="Mess Type"    value="Veg + Non-Veg (Common)" />
            <InfoRow label="Laundry Days" value="Mon, Wed, Fri, Sat" />
          </Card>

          {/* Roommates with photo + phone */}
          <Card className="card-p">
            <SectionHeader title="🏠 Roommates" subtitle={`Room ${display.room} · ${roommates.length + 1} occupants`} />
            {/* You */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{display.photo}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{display.name} <span style={{ fontSize: 11, color: 'var(--accent2)' }}>(You)</span></p>
                <p style={{ fontSize: 11, color: 'var(--text2)' }}>{currentUser.roll} · {currentUser.phone}</p>
              </div>
              <Badge variant="purple">You</Badge>
            </div>
            {roommates.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 8, transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{r.photo}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text2)' }}>{r.roll} · {r.course}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    <a href={`tel:${r.phone}`} style={{ fontSize: 11, color: 'var(--accent2)' }}>📞 {r.phone}</a>
                    <a href={`mailto:${r.email}`} style={{ fontSize: 11, color: 'var(--text3)' }}>✉️ {r.email}</a>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Attendance */}
          <Card className="card-p">
            <SectionHeader title="📍 Attendance" />
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Pct',      value: `${attendanceData.percentage}%`, color: 'var(--green)' },
                { label: 'Present',  value: attendanceData.present,          color: 'var(--accent)' },
                { label: 'Absent',   value: attendanceData.absent,           color: 'var(--red)' },
                { label: 'Leave',    value: attendanceData.leave,            color: 'var(--amber)' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 4px' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font2)', color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${attendanceData.percentage}%`, background: 'var(--green)' }} />
            </div>
          </Card>

          {/* Digital ID */}
          <div style={{ background: 'linear-gradient(135deg, var(--accent3), var(--purple))', borderRadius: 'var(--radius-md)', padding: 20, color: '#fff' }}>
            <div style={{ fontSize: 11, opacity: .7, marginBottom: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Digital Hostel ID</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font2)', marginBottom: 4 }}>{display.name}</div>
            <div style={{ fontSize: 13, opacity: .8, marginBottom: 16 }}>{currentUser.roll} · {currentUser.branch}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ fontSize: 11, opacity: .6 }}>Room</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font2)' }}>{display.room}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, opacity: .6 }}>Blood</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font2)' }}>{currentUser.bloodGroup}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
