// src/pages/Login.jsx
// Student: email + password, OTP verify, forgot via email
// Admin: signup (Employee ID emailed) | login (Employee ID + password → OTP → verify)
import { useState, useEffect } from 'react';
import { api } from '../api/client';

/* ─── shape helpers ─────────────────────────────────────────────────── */
function mapStudentSession(data) {
  const u = data.user;
  return {
    token: data.token,
    role: 'student',
    user: {
      id: u.id,
      name: u.username || u.name,
      username: u.username || u.name,
      email: u.email,
      photo: u.photo || (u.username || u.name || '?')[0].toUpperCase(),
      room: u.roomNumber || '',
      role: 'student',
    },
  };
}

function mapAdminSession(data) {
  const u = data.user || data.admin;
  return {
    token: data.token,
    role: 'admin',
    user: {
      id: u.id,
      name: u.name || u.username,
      username: u.username || u.name,
      email: u.email,
      employeeId: u.employeeId,
      photo: (u.name || u.username || 'A')[0].toUpperCase(),
      room: '',
      role: 'admin',
    },
  };
}

/* ─── Spinner ────────────────────────────────────────────────────────── */
const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  }} />
);

/* ─── Shared field ───────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

/* ─── Error box ──────────────────────────────────────────────────────── */
function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      marginBottom: 14, padding: '10px 12px',
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)',
    }}>{msg}</div>
  );
}

/* ─── Success box ────────────────────────────────────────────────────── */
function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      marginBottom: 14, padding: '10px 12px',
      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--green)',
    }}>{msg}</div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  STUDENT PANEL                                                         */
/* ────────────────────────────────────────────────────────────────────── */
function StudentPanel({ onLogin }) {
  // mode: login | signup | verify | forgot | reset
  const [mode, setMode]           = useState('login');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState('');
  const [newPw, setNewPw]         = useState('');

  const go = (m) => { setError(''); setSuccess(''); setMode(m); };

  const run = async (fn) => {
    setError(''); setSuccess(''); setLoading(true);
    try { await fn(); } catch (e) { setError(e.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleLogin = () => run(async () => {
    if (!email.trim() || !password) throw new Error('Email and password required.');
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: email.trim(), password }),
    });
    onLogin(mapStudentSession(data));
  });

  const handleSignup = () => run(async () => {
    if (!username.trim() || !email.trim() || !password) throw new Error('All fields required.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
    });
    setSuccess('OTP sent! Check your inbox.');
    setMode('verify');
  });

  const handleVerify = () => run(async () => {
    if (!otp.trim()) throw new Error('Enter the 6-digit OTP.');
    const data = await api('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    });
    onLogin(mapStudentSession(data));
  });

  const handleForgot = () => run(async () => {
    if (!email.trim()) throw new Error('Enter your registered email.');
    await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
    setSuccess('OTP sent to your email.');
    setMode('reset');
  });

  const handleReset = () => run(async () => {
    if (!otp.trim() || !newPw) throw new Error('OTP and new password required.');
    if (newPw.length < 8) throw new Error('Password must be at least 8 characters.');
    await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword: newPw }),
    });
    setSuccess('Password updated! You can sign in now.');
    go('login');
  });

  const onKey = (e) => {
    if (e.key !== 'Enter') return;
    if (mode === 'login')  handleLogin();
    if (mode === 'signup') handleSignup();
    if (mode === 'verify') handleVerify();
    if (mode === 'forgot') handleForgot();
    if (mode === 'reset')  handleReset();
  };

  const titles = {
    login:  ['Welcome back', 'Sign in with your college email'],
    signup: ['Create account', 'A 6-digit OTP will be sent to verify your email'],
    verify: ['Verify email', `Enter the code sent to ${email}`],
    forgot: ['Forgot password', 'Enter your email — we\'ll send a reset OTP'],
    reset:  ['Set new password', 'Enter the OTP from your email and choose a new password'],
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 24, marginBottom: 4 }}>
        {titles[mode][0]}
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>{titles[mode][1]}</p>

      <ErrorBox msg={error} />
      <SuccessBox msg={success} />

      {mode === 'signup' && (
        <Field label="Full Name / Username">
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={onKey} placeholder="e.g. arjun_sharma" />
        </Field>
      )}

      {['login','signup','verify','forgot','reset'].includes(mode) && (
        <Field label="College Email">
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@college.edu" disabled={mode === 'verify'} />
        </Field>
      )}

      {['verify','reset'].includes(mode) && (
        <Field label="6-digit OTP">
          <input className="input" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} onKeyDown={onKey} placeholder="000000" maxLength={6} style={{ letterSpacing: '0.2em', fontSize: 18, fontFamily: 'var(--font2)' }} />
        </Field>
      )}

      {['login','signup'].includes(mode) && (
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey} placeholder="••••••••" />
        </Field>
      )}

      {mode === 'reset' && (
        <Field label="New Password">
          <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={onKey} placeholder="Min 8 characters" />
        </Field>
      )}

      {mode === 'login' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--accent2)' }} onClick={() => go('forgot')}>
            Forgot password?
          </button>
        </div>
      )}

      {/* Primary CTA */}
      {mode === 'login'  && <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8 }} onClick={handleLogin} disabled={loading}>{loading ? <Spinner /> : null}{loading ? 'Signing in…' : 'Sign in →'}</button>}
      {mode === 'signup' && <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8 }} onClick={handleSignup} disabled={loading}>{loading ? <Spinner /> : null}{loading ? 'Sending OTP…' : 'Send verification code →'}</button>}
      {mode === 'verify' && <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8 }} onClick={handleVerify} disabled={loading}>{loading ? <Spinner /> : null}{loading ? 'Verifying…' : 'Verify & continue →'}</button>}
      {mode === 'forgot' && <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8 }} onClick={handleForgot} disabled={loading}>{loading ? <Spinner /> : null}{loading ? 'Sending…' : 'Send reset OTP →'}</button>}
      {mode === 'reset'  && <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8 }} onClick={handleReset} disabled={loading}>{loading ? <Spinner /> : null}{loading ? 'Updating…' : 'Update password →'}</button>}

      {/* Secondary links */}
      <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
        {mode === 'login' && <p>No account? <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('signup')}>Create one</button></p>}
        {['signup','verify','forgot','reset'].includes(mode) && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('login')}>← Back to sign in</button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  ADMIN PANEL                                                           */
/* ────────────────────────────────────────────────────────────────────── */
function AdminPanel({ onLogin }) {
  // mode: login | signup | verify (OTP after login)
  const [mode, setMode]           = useState('login');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // signup fields
  const [name, setName]           = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw]   = useState('');

  // login + OTP verify
  const [empId, setEmpId]         = useState('');
  const [loginPw, setLoginPw]     = useState('');
  const [loginOtp, setLoginOtp]   = useState('');
  /** Employee ID pending OTP verification (set after successful password step). */
  const [pendingEmpId, setPendingEmpId] = useState('');

  const go = (m) => { setError(''); setSuccess(''); setMode(m); };

  const run = async (fn) => {
    setError(''); setSuccess(''); setLoading(true);
    try { await fn(); } catch (e) { setError(e.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleSignup = () => run(async () => {
    if (!name.trim() || !signupEmail.trim() || !signupPw) throw new Error('All fields are required.');
    if (signupPw.length < 8) throw new Error('Password must be at least 8 characters.');
    await api('/admin/signup', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: signupEmail.trim(), password: signupPw }),
    });
    setSuccess('Account created. Your Employee ID has been sent to your email. You can sign in once you receive it.');
    setMode('login');
  });

  const handleLogin = () => run(async () => {
    if (!empId.trim() || !loginPw) throw new Error('Employee ID and password required.');
    const normalized = empId.trim().toUpperCase();
    await api('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ employeeId: normalized, password: loginPw }),
    });
    setPendingEmpId(normalized);
    setLoginOtp('');
    setSuccess('A 6-digit OTP was sent to your registered email.');
    setMode('verify');
  });

  const handleVerifyLoginOtp = () => run(async () => {
    if (!loginOtp.trim()) throw new Error('Enter the 6-digit OTP.');
    const data = await api('/admin/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ employeeId: pendingEmpId, otp: loginOtp.trim() }),
    });
    onLogin(mapAdminSession(data));
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--purple), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍💼</div>
        <div>
          <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 20, marginBottom: 1 }}>Admin Portal</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Restricted to authorised hostel staff only</p>
        </div>
      </div>

      <ErrorBox msg={error} />
      <SuccessBox msg={success} />

      {/* ── LOGIN ── */}
      {mode === 'login' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Sign in with your Employee ID and password.</p>
          <Field label="Employee ID">
            <input className="input" value={empId} onChange={e => setEmpId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="e.g. EMP-A1B2C3" style={{ fontFamily: 'var(--font2)', letterSpacing: '0.05em' }} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
          </Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))' }} onClick={handleLogin} disabled={loading}>
            {loading ? <Spinner /> : null}{loading ? 'Signing in…' : 'Admin Sign in →'}
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
            New admin account? <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('signup')}>Register here</button>
          </div>
        </>
      )}

      {/* ── SIGNUP ── */}
      {mode === 'signup' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Register as a new admin. An Employee ID will be auto-generated and emailed to you.</p>
          <Field label="Full Name">
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Rajesh Kumar" />
          </Field>
          <Field label="Official Email">
            <input className="input" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="admin@college.edu" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={signupPw} onChange={e => setSignupPw(e.target.value)} placeholder="Min 8 characters" />
          </Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))' }} onClick={handleSignup} disabled={loading}>
            {loading ? <Spinner /> : null}{loading ? 'Registering…' : 'Register & Get Employee ID →'}
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('login')}>← Back to admin login</button>
          </div>
        </>
      )}

      {/* ── VERIFY OTP (after Employee ID + password) ── */}
      {mode === 'verify' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Enter the 6-digit OTP sent to the email registered for <strong>{pendingEmpId}</strong>
          </p>
          <Field label="6-digit OTP">
            <input
              className="input"
              value={loginOtp}
              onChange={e => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyLoginOtp()}
              placeholder="000000"
              maxLength={6}
              style={{ letterSpacing: '0.25em', fontSize: 20, fontFamily: 'var(--font2)', textAlign: 'center' }}
            />
          </Field>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))' }}
            onClick={handleVerifyLoginOtp}
            disabled={loading}
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Verifying…' : 'Verify & sign in →'}
          </button>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => { setPendingEmpId(''); go('login'); }}>
              ← Back to login
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  ROOT LOGIN PAGE                                                       */
/* ────────────────────────────────────────────────────────────────────── */
export default function Login({ onLogin }) {
  const [portal, setPortal] = useState('student'); // 'student' | 'admin'
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const features = [
    { icon: '🍽️', text: 'Smart Mess Management with QR entry' },
    { icon: '📍', text: 'GPS-based anti-proxy attendance' },
    { icon: '🛠️', text: 'Real-time complaint tracking & AI priority' },
    { icon: '🧠', text: 'Gemini-powered mess & complaint insights' },
    { icon: '🧺', text: 'Laundry slot booking system' },
    { icon: '🏥', text: 'One-tap ambulance dispatch' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Left branding ── */}
      <div
        className="hide-mobile"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '48px 56px', background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* BG decorations */}
        <div style={{ position:'absolute', top:-120, right:-120, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-60, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48, opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition:'all 0.5s ease' }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg, var(--accent), var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', fontFamily:'var(--font2)' }}>H</div>
          <div>
            <p style={{ fontFamily:'var(--font2)', fontWeight:700, fontSize:20 }}>HostelOS</p>
            <p style={{ fontSize:12, color:'var(--text3)' }}>Smart Hostel Portal</p>
          </div>
        </div>

        <div style={{ opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition:'all 0.6s ease 0.1s' }}>
          <h1 style={{ fontFamily:'var(--font2)', fontWeight:800, fontSize:36, lineHeight:1.2, marginBottom:14 }}>
            Everything your hostel<br />
            <span style={{ background:'linear-gradient(135deg, var(--accent2), var(--purple))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              needs. All in one place.
            </span>
          </h1>
          <p style={{ color:'var(--text2)', fontSize:15, lineHeight:1.6, marginBottom:40, maxWidth:400 }}>
            From mess orders to healthcare alerts — connected to a secure Node.js API with live Socket.IO updates and Gemini AI analytics.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, opacity: visible?1:0, transition:'all 0.6s ease 0.2s' }}>
          {features.map((f,i) => (
            <div key={f.text} style={{ display:'flex', alignItems:'center', gap:12, opacity: visible?1:0, transform: visible?'none':'translateX(-16px)', transition:`all 0.5s ease ${0.25+i*0.05}s` }}>
              <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{f.icon}</div>
              <span style={{ fontSize:13, color:'var(--text2)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        width:'100%', maxWidth:500, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'48px 40px', background:'var(--bg)',
        overflowY:'auto',
        opacity: visible?1:0, transform: visible?'none':'translateX(20px)',
        transition:'all 0.5s ease 0.15s',
      }}>

        {/* Portal switcher */}
        <div style={{ display:'flex', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:4, marginBottom:28 }}>
          <button
            type="button"
            onClick={() => setPortal('student')}
            style={{
              flex:1, padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer',
              background: portal==='student' ? 'var(--bg4)' : 'transparent',
              color: portal==='student' ? 'var(--text)' : 'var(--text2)',
              fontSize:13, fontWeight:600, fontFamily:'var(--font)', transition:'all .2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setPortal('admin')}
            style={{
              flex:1, padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer',
              background: portal==='admin' ? 'var(--bg4)' : 'transparent',
              color: portal==='admin' ? 'var(--text)' : 'var(--text2)',
              fontSize:13, fontWeight:600, fontFamily:'var(--font)', transition:'all .2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}
          >
            🧑‍💼 Admin
          </button>
        </div>

        {/* Separator */}
        <div style={{ height:1, background:'var(--border)', marginBottom:24 }} />

        {/* Render correct panel */}
        {portal === 'student'
          ? <StudentPanel onLogin={onLogin} />
          : <AdminPanel   onLogin={onLogin} />
        }

        <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:24, lineHeight:1.6 }}>
          OTP is emailed when SMTP is configured.<br />For testing check the API server console.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hide-mobile { display: flex !important; flex-direction: column !important; }
        @media(max-width:768px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
