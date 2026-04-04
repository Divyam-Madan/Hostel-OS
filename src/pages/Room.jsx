// src/pages/Room.jsx
import { useState } from 'react';
import { Card, SectionHeader, GlowCard, Badge, InfoRow, Modal, Field } from '../components/ui';
import { currentUser, availableRooms } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

const roommates = [
  { id: 'S2024002', name: 'Rahul Verma', roll: '21CS102', email: 'rahul.v@college.edu', photo: 'RV', phone: '+91 87654 32109' },
  { id: 'S2024003', name: 'Dev Patel',   roll: '21ME045', email: 'dev.p@college.edu',  photo: 'DP', phone: '+91 76543 21098' },
];

function OTPVerify({ onClose, onVerified }) {
  const [otp, setOtp] = useState(['','','','','','']);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleOtp = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };

  const verify = () => {
    const code = otp.join('');
    if (code === '123456') { setVerified(true); setTimeout(() => { onVerified(); onClose(); }, 1200); }
    else setError('Invalid OTP. Use demo code: 123456');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {verified ? (
        <div className="animate-fadeUp">
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>Roommate Verified!</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📱</div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>OTP Verification</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
            {sent ? 'OTP sent to registered mobile. Demo code: 123456' : 'Send OTP to verify roommate identity'}
          </p>
          {sent ? (
            <>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {otp.map((d, i) => (
                  <input key={i} id={`otp-${i}`} value={d} onChange={e => handleOtp(i, e.target.value)} maxLength={1}
                    style={{ width: 40, height: 48, textAlign: 'center', borderRadius: 8, border: `1.5px solid ${error ? 'var(--red)' : 'var(--border2)'}`, background: 'var(--bg3)', color: 'var(--text)', fontSize: 20, fontWeight: 700, outline: 'none', fontFamily: 'var(--font2)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border2)'}
                  />
                ))}
              </div>
              {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary flex-1" onClick={verify}>Verify OTP</button>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={() => setSent(true)}>Send OTP</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Room() {
  const { user, role } = useAuth();
  const display = role === 'student' && user
    ? { ...currentUser, room: user.room || currentUser.room, name: user.name, photo: user.photo }
    : currentUser;

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapDone, setSwapDone] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState(null);
  const [verified, setVerified] = useState({});

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Room Allotment</h1>
        <p className="page-desc">Room details, OTP roommate verification and swap portal</p>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'start', marginBottom: 20 }}>
        {/* Current room */}
        <GlowCard color="var(--accent)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏠</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Your Room</p>
              <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 28, color: 'var(--accent2)' }}>{display.room}</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{display.hostel}</p>
            </div>
          </div>
          <InfoRow label="Block"         value="Block B" />
          <InfoRow label="Floor"         value="2nd Floor" />
          <InfoRow label="Type"          value="Triple Occupancy" />
          <InfoRow label="Amenities"     value="AC · WiFi · Attached Bath" />
          <InfoRow label="Allotted Since" value="July 2021" />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSwapOpen(true)}>🔄 Request Swap</button>
            <button className="btn btn-ghost btn-sm">📋 Room Rules</button>
          </div>
        </GlowCard>

        {/* Roommates with OTP verify */}
        <Card className="card-p">
          <SectionHeader title="Roommates" subtitle="OTP verification for safety" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{display.photo}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>{display.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text2)' }}>{display.roll} · {display.phone}</p>
            </div>
            <Badge variant="purple">You</Badge>
          </div>
          {roommates.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${verified[r.id] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', marginBottom: 8, transition: 'all .2s', background: verified[r.id] ? 'rgba(16,185,129,0.04)' : '' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{r.photo}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text2)' }}>{r.roll} · {r.phone}</p>
              </div>
              {verified[r.id] ? (
                <Badge variant="green">✓ Verified</Badge>
              ) : (
                <button className="btn btn-ghost btn-xs" onClick={() => { setOtpTarget(r); setOtpOpen(true); }}>Verify OTP</button>
              )}
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
            🔐 OTP verification confirms actual occupancy. Required for room swap requests.
          </p>
        </Card>
      </div>

      {/* Bed vacancy cards */}
      <Card className="card-p">
        <SectionHeader title="Available Rooms (Bed Vacancies)" subtitle="Tap a room to request swap" />
        <div className="grid-2" style={{ gap: 12 }}>
          {availableRooms.map(r => (
            <div key={r.room} style={{
              padding: '14px 16px', background: 'var(--bg3)',
              border: `1.5px solid ${selectedRoom === r.room ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all .2s',
            }}
              onClick={() => setSelectedRoom(r.room === selectedRoom ? null : r.room)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font2)', color: selectedRoom === r.room ? 'var(--accent2)' : 'var(--text)' }}>{r.room}</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>Block {r.block} · Floor {r.floor} · {r.type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{r.vacancies}</p>
                  <p style={{ fontSize: 10, color: 'var(--text3)' }}>bed{r.vacancies > 1 ? 's' : ''} free</p>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${(r.occupants/r.capacity)*100}%`, background: 'var(--blue)' }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{r.occupants}/{r.capacity} occupied</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.amenities.map(a => <span key={a} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)' }}>{a}</span>)}
              </div>
              {selectedRoom === r.room && (
                <button className="btn btn-primary w-full btn-sm" style={{ marginTop: 10, justifyContent: 'center' }} onClick={e => { e.stopPropagation(); setSwapOpen(true); }}>
                  Request Swap with {r.room}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* OTP Modal */}
      <Modal open={otpOpen} onClose={() => setOtpOpen(false)} title={`Verify ${otpTarget?.name}`} width={400}>
        <OTPVerify onClose={() => setOtpOpen(false)} onVerified={() => setVerified(v => ({ ...v, [otpTarget?.id]: true }))} />
      </Modal>

      {/* Swap Modal */}
      <Modal open={swapOpen} onClose={() => setSwapOpen(false)} title="Room Swap Request" width={480}>
        {swapDone ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
            <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Swap Request Sent!</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '8px 0 16px' }}>Warden and target occupants notified. Response within 48 hours.</p>
            <button className="btn btn-primary" onClick={() => { setSwapOpen(false); setSwapDone(false); }}>Close</button>
          </div>
        ) : (
          <div>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              ℹ️ Both parties must consent. Requires warden final approval.
            </div>
            <Field label="Your Current Room"><input className="input" defaultValue={display.room} readOnly /></Field>
            <Field label="Requested Room"><input className="input" defaultValue={selectedRoom || ''} placeholder="e.g. A-101" /></Field>
            <Field label="Reason for Swap">
              <select className="select">
                <option>Academic / study schedule mismatch</option>
                <option>Health / medical reason</option>
                <option>Mutual agreement</option>
                <option>Personal preference</option>
              </select>
            </Field>
            <Field label="Additional Notes"><textarea className="input" rows={3} style={{ resize: 'none' }} /></Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={() => setSwapDone(true)}>Submit Request</button>
              <button className="btn btn-ghost" onClick={() => setSwapOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
