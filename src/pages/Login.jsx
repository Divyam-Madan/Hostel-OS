// src/pages/Login.jsx
// Student: email + password, OTP verify, forgot via email
// Admin: signup (Employee ID emailed) | login (Employee ID + password → OTP → verify)
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { applyTheme, getStoredTheme, getThemeOptions } from '../utils/theme';

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
    try {
      await fn();
    } catch (e) {
      // Friendly mapping for common auth errors
      if (e?.isNetwork) setError('Server unavailable');
      else if (e?.status === 401) setError('Incorrect email or password');
      else if (e?.status === 400) setError(e.message || 'Validation error');
      else setError(e.message || 'Something went wrong');
    } finally { setLoading(false); }
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
  // mode: login | signup | verify | forgot | reset
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
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmpId, setForgotEmpId] = useState('');
  const [resetOtp, setResetOtp]   = useState('');
  const [resetPw, setResetPw]     = useState('');
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

  const handleForgot = () => run(async () => {
    if (!forgotEmail.trim() && !forgotEmpId.trim()) throw new Error('Email or Employee ID required.');
    await api('/admin/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: forgotEmail.trim(), employeeId: forgotEmpId.trim() }),
    });
    setSuccess('If an admin account exists, an OTP was sent.');
    setMode('reset');
  });

  const handleReset = () => run(async () => {
    if (!resetOtp.trim() || !resetPw) throw new Error('OTP and new password required.');
    if (resetPw.length < 8) throw new Error('Password must be at least 8 characters.');
    await api('/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: forgotEmail.trim(),
        employeeId: forgotEmpId.trim(),
        otp: resetOtp.trim(),
        newPassword: resetPw,
      }),
    });
    setSuccess('Password updated. You can sign in now.');
    go('login');
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--accent2)' }} onClick={() => go('forgot')}>
              Forgot password?
            </button>
          </div>
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

      {mode === 'forgot' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Use your registered email or Employee ID to receive a reset OTP.</p>
          <Field label="Official Email">
            <input className="input" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="admin@college.edu" />
          </Field>
          <Field label="Employee ID">
            <input className="input" value={forgotEmpId} onChange={e => setForgotEmpId(e.target.value)} placeholder="EMP-ABC123" style={{ fontFamily: 'var(--font2)', letterSpacing: '0.05em' }} />
          </Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))' }} onClick={handleForgot} disabled={loading}>
            {loading ? <Spinner /> : null}{loading ? 'Sending…' : 'Send reset OTP →'}
          </button>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('login')}>← Back to login</button>
          </div>
        </>
      )}

      {mode === 'reset' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Enter the OTP and set a new password.</p>
          <Field label="6-digit OTP">
            <input className="input" value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ letterSpacing: '0.2em', fontSize: 18, fontFamily: 'var(--font2)', textAlign: 'center' }} />
          </Field>
          <Field label="New Password">
            <input className="input" type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min 8 characters" />
          </Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, gap: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))' }} onClick={handleReset} disabled={loading}>
            {loading ? <Spinner /> : null}{loading ? 'Updating…' : 'Update password →'}
          </button>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => go('login')}>← Back to login</button>
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
  const [storyIndex, setStoryIndex] = useState(0);
  const [activeTheme, setActiveTheme] = useState(getStoredTheme());
  const themeOptions = useMemo(() => getThemeOptions(), []);
  const activeThemeIndex = Math.max(themeOptions.findIndex((option) => option.id === activeTheme), 0);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    const next = applyTheme(getStoredTheme());
    setActiveTheme(next);
    const onThemeChanged = (event) => {
      const nextTheme = event?.detail?.theme || getStoredTheme();
      setActiveTheme(nextTheme);
    };
    window.addEventListener('hostel:theme-changed', onThemeChanged);
    window.addEventListener('storage', onThemeChanged);
    return () => {
      window.removeEventListener('hostel:theme-changed', onThemeChanged);
      window.removeEventListener('storage', onThemeChanged);
    };
  }, []);

  const studentStories = useMemo(() => ([
    { title: 'Attendance synced', detail: 'Proxy checks, QR logs, and late entries stay in one clean view.', accent: 'var(--amber)' },
    { title: 'Laundry slots booked live', detail: 'Students see availability update the moment a slot fills up.', accent: 'var(--green)' },
    { title: '247 complaints resolved this month', detail: 'Maintenance conversations feel fast, transparent, and human.', accent: 'var(--accent2)' },
  ]), []);

  const adminStories = useMemo(() => ([
    { title: 'Campus pulse in one screen', detail: 'Complaints, events, leaves, and wellbeing in a single calm dashboard.', accent: 'var(--accent2)' },
    { title: 'Live hostel announcements', detail: 'The right updates reach the right students without noise.', accent: 'var(--green)' },
    { title: 'Operations with less friction', detail: 'Staff can triage faster when the system feels clear.', accent: 'var(--amber)' },
  ]), []);

  const featureCards = useMemo(() => ([
    { icon: '📡', title: 'Real-time operations', caption: 'Socket.IO updates for complaints, attendance, events, and alerts.' },
    { icon: '🧠', title: 'AI-powered insights', caption: 'Gemini-assisted mess feedback and operational intelligence.' },
    { icon: '🧺', title: 'Smart hostel utilities', caption: 'Laundry slots, leave approvals, lost & found, and fee tracking.' },
    { icon: '🏥', title: 'Student wellbeing', caption: 'Counselling, stress tracking, and care workflows in one system.' },
    { icon: '🎟️', title: 'Campus events ecosystem', caption: 'Registrations, team management, and realtime participation pulse.' },
    { icon: '🍽️', title: 'Mess intelligence', caption: 'Meal quality trends and student sentiment, not just ratings.' },
  ]), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStoryIndex((index) => (index + 1) % 3);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const setTheme = (next) => {
    applyTheme(next);
    setActiveTheme(next);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        height: '100%',
        overflow: 'auto',
        overscrollBehavior: 'contain',
        background: activeTheme === 'light'
          ? 'radial-gradient(circle at 18% 14%, rgba(255,213,150,0.36), transparent 24%), radial-gradient(circle at 78% 18%, rgba(196,131,83,0.17), transparent 22%), linear-gradient(135deg, #edddca 0%, #dfc9b1 45%, #cfb499 100%)'
          : activeTheme === 'rose'
            ? 'radial-gradient(circle at 18% 15%, rgba(215,153,173,0.20), transparent 26%), radial-gradient(circle at 80% 18%, rgba(166,127,176,0.16), transparent 30%), linear-gradient(135deg, #2b2026 0%, #362731 46%, #21171d 100%)'
            : 'radial-gradient(circle at 18% 16%, rgba(196,131,83,0.22), transparent 26%), radial-gradient(circle at 78% 18%, rgba(127,143,115,0.16), transparent 28%), linear-gradient(135deg, #211914 0%, #2a2019 46%, #1a1411 100%)',
        transition: 'background 280ms ease',
      }}
    >
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.12fr) minmax(390px, 540px)',
          alignItems: 'start',
          gap: 0,
        }}
      >
        <section
          className="hide-mobile"
          style={{
            position: 'relative',
            overflowY: 'auto',
            padding: '28px 46px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 16,
            userSelect: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02)), var(--bg2)',
            borderRight: '1px solid var(--border2)',
            backdropFilter: 'blur(10px)',
            minHeight: '100dvh',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -140, right: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,230,185,0.68) 0%, rgba(255,230,185,0.20) 35%, transparent 70%)', filter: 'blur(18px)' }} />
            <div style={{ position: 'absolute', bottom: -120, left: -100, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,91,51,0.14) 0%, transparent 68%)', filter: 'blur(20px)' }} />
            <div style={{ position: 'absolute', inset: '12% 8% auto auto', width: 180, height: 180, borderRadius: '40px', background: 'linear-gradient(180deg, rgba(255,255,255,0.40), rgba(255,255,255,0.10))', transform: 'rotate(12deg)', filter: 'blur(0.5px)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 15, alignContent: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, rgba(196,131,83,0.95), rgba(127,143,115,0.92))', boxShadow: '0 16px 30px rgba(124,92,64,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font2)', fontSize: 22, fontWeight: 800 }}>H</div>
                <div>
                  <p style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 2 }}>HostelOS</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Student-tech, but warm</p>
                  <p style={{ fontSize: 12.5, color: 'var(--accent2)', marginTop: 5, fontWeight: 700, textShadow: '0 0 16px rgba(196,131,83,0.12)' }}>Built &amp; designed by Divyam Madan</p>
                </div>
              </div>
              <div className="theme-switcher" style={{ width: 320 }}>
                <div className="theme-switcher-thumb" style={{ transform: `translateX(${activeThemeIndex * 100}%)` }} />
                {themeOptions.map((option) => (
                  <button key={`login-${option.id}`} type="button" className={`theme-option ${activeTheme === option.id ? 'active' : ''}`} onClick={() => setTheme(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ maxWidth: 560, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.58s ease 0.06s' }}>
              <p style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Morning dashboard for hostel life</p>
              <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 800, fontSize: 50, lineHeight: 1.0, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 11 }}>
                Calm, modern hostel operations.
                <span style={{ display: 'block', color: 'var(--accent2)' }}>Built for real student life.</span>
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.55, maxWidth: 520 }}>
                HostelOS brings attendance, complaints, laundry, mess, wellbeing, and admin workflows into one thoughtful place so the app feels less like software and more like a well-run campus.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 10, maxWidth: 700, paddingBottom: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {featureCards.map((card, index) => (
                  <div key={card.title} style={{
                    padding: '12px 12px',
                    borderRadius: 15,
                    border: '1px solid var(--border2)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), var(--bg3)',
                    boxShadow: '0 10px 20px rgba(124,92,64,0.08)',
                    transform: `translateY(${index % 2 === 0 ? 0 : 6}px)`,
                    opacity: visible ? 1 : 0,
                    transition: `all 0.38s ease ${0.12 + index * 0.05}s`,
                    minHeight: 112,
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 11, background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent), var(--bg4)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, color: 'var(--accent2)', fontSize: 14 }}>{card.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--text2)' }}>{card.caption}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 10 }}>
                <div style={{
                  borderRadius: 22,
                  padding: 14,
                  border: '1px solid var(--border2)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), var(--bg3)',
                  boxShadow: '0 12px 24px rgba(124,92,64,0.08)',
                  transform: 'rotate(-1.5deg)',
                }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: 8 }}>Live hostel pulse</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{(portal === 'student' ? studentStories : adminStories)[storyIndex].title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text2)' }}>{(portal === 'student' ? studentStories : adminStories)[storyIndex].detail}</div>
                </div>
                <div style={{
                  borderRadius: 22,
                  padding: 14,
                  border: '1px solid var(--border2)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), var(--bg3)',
                  boxShadow: '0 12px 24px rgba(124,92,64,0.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)' }}>Today</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)' }}>{portal === 'student' ? 'Student view' : 'Admin view'}</span>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[
                      'Attendance synced',
                      'Laundry slots booked live',
                      'Live hostel announcements',
                      'Wellbeing alerts triaged',
                      'Event registrations updated',
                    ].map((item, index) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: `all 0.45s ease ${0.15 + index * 0.08}s` }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: index === 0 ? 'var(--green)' : index === 1 ? 'var(--amber)' : 'var(--accent2)', boxShadow: '0 0 0 4px rgba(255,255,255,0.42)' }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                borderRadius: 20,
                border: '1px solid var(--border2)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)), var(--bg3)',
                padding: '11px 13px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 7,
              }}>
                {[
                  { label: 'Live sockets', value: '12 streams' },
                  { label: 'AI digest', value: 'Mess + complaints' },
                  { label: 'Operations today', value: '143 actions' },
                ].map((widget, index) => (
                  <div key={widget.label} style={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    padding: '9px 10px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent), var(--bg4)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(8px)',
                    transition: `all 0.4s ease ${0.22 + index * 0.06}s`,
                  }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 6 }}>{widget.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{widget.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '12px 18px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 540, marginTop: 4, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.45s ease 0.05s' }}>
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06)), var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 28,
              padding: 14,
              boxShadow: '0 20px 44px rgba(124,92,64,0.10)',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>Secure portal</p>
                  <h2 style={{ fontFamily: 'var(--font2)', fontWeight: 800, fontSize: 24, lineHeight: 1.15, color: 'var(--text)' }}>Welcome back.</h2>
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border2)',
                  fontSize: 12,
                  color: 'var(--accent2)',
                  fontWeight: 700,
                }}>
                  {portal === 'student' ? 'Student' : 'Admin'} access
                </div>
              </div>

              <div style={{ display: 'flex', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 18, padding: 4, marginBottom: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)' }}>
                {[
                  { key: 'student', icon: '🎓', label: 'Student' },
                  { key: 'admin', icon: '🧑‍💼', label: 'Admin' },
                ].map((item) => {
                  const active = portal === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPortal(item.key)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 14,
                        border: 'none',
                        cursor: 'pointer',
                        background: active ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)), var(--bg4)' : 'transparent',
                        color: active ? 'var(--text)' : 'var(--text2)',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: active ? 'var(--shadow)' : 'none',
                        transform: active ? 'translateY(-1px)' : 'translateY(0)',
                        transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease',
                      }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div style={{
                borderRadius: 24,
                border: '1px solid var(--border2)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)), var(--bg3)',
                boxShadow: '0 14px 28px rgba(124,92,64,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
                  {portal === 'student' ? <StudentPanel onLogin={onLogin} /> : <AdminPanel onLogin={onLogin} />}
                </div>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 10, lineHeight: 1.4 }}>
                OTP is emailed when SMTP is configured. For testing, check the API server console.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10, alignItems: 'center' }}>
                <a href="https://github.com/Divyam-Madan" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--text2)', textDecoration: 'none', opacity: 0.85, fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ display: 'block' }}>
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.11-.76.41-1.27.75-1.56-2.56-.29-5.25-1.28-5.25-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.44-2.7 5.41-5.27 5.7.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" fill="currentColor"/>
                  </svg>
                  <span>Divyam-Madan</span>
                </a>
                <a href="https://www.linkedin.com/in/divyam-madan/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)', textDecoration: 'none', opacity: 0.75, fontSize: 13 }}>
                  LinkedIn
                </a>
                <a href="mailto:divyam.madan.6106@gmail.com" style={{ color: 'var(--text2)', textDecoration: 'none', opacity: 0.75, fontSize: 13 }}>
                  divyam.madan.6106@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseOrb {
          0% { transform: scale(1); opacity: 0.36; }
          100% { transform: scale(1.22); opacity: 0; }
        }
        .hide-mobile { display: flex !important; }
        .hide-mobile::after {
          content: '';
          position: absolute;
          right: 36px;
          bottom: 30px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent2);
          box-shadow: 0 0 0 0 rgba(196,131,83,0.24);
          animation: pulseOrb 1800ms ease-out infinite;
          pointer-events: none;
        }
        .hide-mobile::before {
          content: '';
          position: absolute;
          left: 22%;
          top: 16%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-glow), transparent 66%);
          filter: blur(16px);
          pointer-events: none;
        }
        @media(max-width: 1120px) {
          .hide-mobile { display: none !important; }
          [style*="grid-template-columns: minmax(0, 1.18fr) minmax(360px, 520px)"] { grid-template-columns: 1fr; }
          [style*="padding: 28px 20px 34px"] { padding-top: 20px !important; }
        }
        @media(max-width: 768px) {
          [style*="grid-template-columns: minmax(0, 1.18fr) minmax(360px, 520px)"] { grid-template-columns: 1fr; }
          [style*="padding: 28px 20px"] { padding: 16px 12px !important; }
          [style*="padding: 28px 20px 34px"] { padding: 16px 12px 22px !important; }
        }
      `}</style>
    </div>
  );
}
