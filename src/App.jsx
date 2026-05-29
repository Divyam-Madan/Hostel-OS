// src/App.jsx
import { useState, Suspense, lazy, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { ensureRealtimeSocket } from './realtime/socket';
import Sidebar from './components/layout/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import Topbar from './components/layout/Topbar';
import GlobalFooter from './components/layout/GlobalFooter';
import Login from './pages/Login';
import { ToastProvider, useToast } from './components/ui';

function SessionListener() {
  const toast = useToast();
  useEffect(() => {
    let shown = false;
    const onExp = () => {
      if (shown) return;
      shown = true;
      toast.error('Session expired');
    };
    window.addEventListener('hostel:session-expired', onExp);
    return () => window.removeEventListener('hostel:session-expired', onExp);
  }, [toast]);
  return null;
}

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
  'admin-leaves': WardenConsole,
  'admin-events': WardenConsole,
  'admin-feedback': WardenConsole,
  'admin-wellbeing': WardenConsole,
  'admin-students': WardenConsole,
  'admin-laundry': WardenConsole,
  'admin-timetable': WardenConsole,
};

const ADMIN_CONSOLE_PAGES = new Set([
  'admin-dashboard',
  'admin-complaints',
  'admin-leaves',
  'admin-events',
  'admin-feedback',
  'admin-wellbeing',
  'admin-students',
  'admin-laundry',
  'admin-timetable',
]);

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
  const { isLoggedIn, hydrating, login, logout, role, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const resolvedPage =
    role === 'admin' && !activePage.startsWith('admin-') ? 'admin-dashboard' : activePage;

  useEffect(() => {
    if (!isLoggedIn || hydrating) return;
    const socket = ensureRealtimeSocket();

    const fire = (name) => (payload) => window.dispatchEvent(new CustomEvent(name, { detail: payload }));
    const onComplaintUpdate = fire('hostel:complaints');
    const onOrderUpdate = fire('hostel:orders');
    const onAlertNew = fire('hostel:alerts');
    const onNotificationNew = fire('hostel:notifications');
    const onEventsUpdate = fire('hostel:events');
    const onWellbeingUpdate = fire('hostel:wellbeing');
    const onTimetableUpdate = fire('hostel:timetable');
    const onAdminStats = fire('hostel:admin-stats');
    const onLostFoundUpdate = fire('hostel:lostfound');
    const onLeaveUpdate = fire('hostel:leave-update');
    const onLeaveNew = fire('hostel:leave-new');
    socket.on('complaint:update', onComplaintUpdate);
    socket.on('order:update', onOrderUpdate);
    socket.on('alert:new', onAlertNew);
    socket.on('notification:new', onNotificationNew);
    socket.on('event:new', onEventsUpdate);
    socket.on('event:update', onEventsUpdate);
    socket.on('wellbeing:update', onWellbeingUpdate);
    socket.on('timetable:update', onTimetableUpdate);
    socket.on('admin:stats', onAdminStats);
    socket.on('lostfound:update', onLostFoundUpdate);
    socket.on('leave:update', onLeaveUpdate);
    socket.on('leave:new', onLeaveNew);

    return () => {
      socket.off('complaint:update', onComplaintUpdate);
      socket.off('order:update', onOrderUpdate);
      socket.off('alert:new', onAlertNew);
      socket.off('notification:new', onNotificationNew);
      socket.off('event:new', onEventsUpdate);
      socket.off('event:update', onEventsUpdate);
      socket.off('wellbeing:update', onWellbeingUpdate);
      socket.off('timetable:update', onTimetableUpdate);
      socket.off('admin:stats', onAdminStats);
      socket.off('lostfound:update', onLostFoundUpdate);
      socket.off('leave:update', onLeaveUpdate);
      socket.off('leave:new', onLeaveNew);
      socket.close();
    };
  }, [isLoggedIn, hydrating]);

  if (hydrating) {
    return <PageLoader />;
  }

  return (
    <ToastProvider>
      <SessionListener />
      {!isLoggedIn ? (
        <Login onLogin={login} />
      ) : (
        (() => {
          const PageComponent = PAGE_MAP[resolvedPage] || (role === 'admin' ? WardenConsole : Dashboard);
          const isWarden = role === 'admin';
          const showWardenConsole = isWarden && ADMIN_CONSOLE_PAGES.has(resolvedPage);

          return (
            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%), linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)' }}>
                {showWardenConsole ? (
                <AdminSidebar activePage={resolvedPage} onNavigate={setActivePage} onLogout={logout} />
              ) : (
                <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={logout} role={role} />
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <Topbar activePage={showWardenConsole ? resolvedPage : activePage} onLogout={logout} onNavigate={setActivePage} role={role} user={user} />

                <main style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%), linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <Suspense fallback={<PageLoader />}>
                        {showWardenConsole ? (
                          <WardenConsole activePage={resolvedPage} />
                        ) : (
                          <PageComponent onNavigate={setActivePage} role={role} />
                        )}
                      </Suspense>
                    </div>
                    <GlobalFooter />
                  </div>
                </main>
              </div>
            </div>
          );
        })()
      )}
    </ToastProvider>
  );
}
