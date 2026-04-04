// src/App.jsx
import { useState, Suspense, lazy, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import Topbar from './components/layout/Topbar';
import Login from './pages/Login';

// Lazy-load all pages for performance
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const MyInfo      = lazy(() => import('./pages/MyInfo'));
const Attendance  = lazy(() => import('./pages/Attendance'));
const EntryExit   = lazy(() => import('./pages/EntryExit'));
const Room        = lazy(() => import('./pages/Room'));
const Mess        = lazy(() => import('./pages/Mess'));
const Laundry     = lazy(() => import('./pages/Laundry'));
const Complaints  = lazy(() => import('./pages/Complaints'));
const Leave       = lazy(() => import('./pages/Leave'));
const Fees        = lazy(() => import('./pages/Fees'));
const LostFound   = lazy(() => import('./pages/LostFound'));
const Events      = lazy(() => import('./pages/Events'));
const Gym         = lazy(() => import('./pages/Gym'));
const Counselling = lazy(() => import('./pages/Counselling'));
const Hospital    = lazy(() => import('./pages/Hospital'));
const Timetable   = lazy(() => import('./pages/Timetable'));
const WardenConsole = lazy(() => import('./pages/admin/WardenConsole.jsx'));

const PAGE_MAP = {
  dashboard:   Dashboard,
  'my-info':   MyInfo,
  attendance:  Attendance,
  'entry-exit':EntryExit,
  room:        Room,
  mess:        Mess,
  laundry:     Laundry,
  complaints:  Complaints,
  leave:       Leave,
  fees:        Fees,
  'lost-found':LostFound,
  events:      Events,
  gym:         Gym,
  counselling: Counselling,
  hospital:    Hospital,
  timetable:   Timetable,
  'admin-dashboard': WardenConsole,
  'admin-complaints': WardenConsole,
  'admin-events': WardenConsole,
  'admin-feedback': WardenConsole,
  'admin-wellbeing': WardenConsole,
  'admin-students': WardenConsole,
};

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text2)' }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13 }}>Loading…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function App() {
  const { isLoggedIn, hydrating, login, logout, role } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const resolvedPage =
    role === 'admin' && !activePage.startsWith('admin-') ? 'admin-dashboard' : activePage;

  useEffect(() => {
    if (!isLoggedIn || hydrating) return;
    const socket = io({ path: '/socket.io' });
    const fire = (name) => () => window.dispatchEvent(new CustomEvent(name));
    socket.on('complaint:update', fire('hostel:complaints'));
    socket.on('order:update', fire('hostel:orders'));
    socket.on('alert:new', fire('hostel:alerts'));
    socket.on('admin:stats', fire('hostel:admin-stats'));
    return () => socket.close();
  }, [isLoggedIn, hydrating]);

  if (hydrating) {
    return <PageLoader />;
  }

  if (!isLoggedIn) {
    return <Login onLogin={login} />;
  }

  const PageComponent = PAGE_MAP[resolvedPage] || (role === 'admin' ? WardenConsole : Dashboard);

  const isWarden = role === 'admin';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: isWarden ? '#080a0f' : 'var(--bg)' }}>
      {isWarden ? (
        <AdminSidebar activePage={resolvedPage} onNavigate={setActivePage} onLogout={logout} />
      ) : (
        <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={logout} role={role} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {isWarden ? (
          <header
            style={{
              height: 52,
              borderBottom: '1px solid rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 22px',
              background: 'rgba(12,14,20,0.95)',
              flexShrink: 0,
            }}
          >
            <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 600, fontSize: 15, color: '#e2e8f0', flex: 1, margin: 0 }}>
              Warden · Hostel intelligence
            </h1>
            <button
              type="button"
              onClick={logout}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid rgba(248,113,113,0.35)',
                background: 'transparent',
                color: '#fca5a5',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </header>
        ) : (
          <Topbar activePage={activePage} onLogout={logout} onNavigate={setActivePage} />
        )}

        <main style={{ flex: 1, overflowY: 'auto', background: isWarden ? '#080a0f' : 'var(--bg)' }}>
          <Suspense fallback={<PageLoader />}>
            {isWarden ? (
              <WardenConsole activePage={resolvedPage} />
            ) : (
              <PageComponent onNavigate={setActivePage} role={role} />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
