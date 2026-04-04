// src/components/layout/Topbar.jsx
import { useState } from 'react';
import { Bell, Search, LogOut, Settings } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'Dashboard', 'my-info': 'My Profile', attendance: 'Attendance',
  'entry-exit': 'Entry / Exit Logs', room: 'Room Allotment', mess: 'Mess Management',
  laundry: 'Laundry Slots', complaints: 'Complaints', leave: 'Leave & Outing',
  fees: 'Hostel Fees', 'lost-found': 'Lost & Found', events: 'Events & Hackathons',
  gym: 'Gym & Wellness', counselling: 'Counselling Portal', hospital: 'Hospital & Ambulance',
  admin: 'Admin Dashboard', timetable: 'Timetable & Alerts',
};

const NOTIFS = [
  { id:1, text:'Leave request (Dec 5–8) approved ✅', time:'2h ago', unread:true, dot:'green' },
  { id:2, text:'Complaint C001 is now In Progress',    time:'4h ago', unread:true, dot:'blue' },
  { id:3, text:'Mess feedback for dinner is open',     time:'6h ago', unread:false, dot:'amber' },
  { id:4, text:'Laundry slot reminder: 9–10 AM',       time:'1d ago', unread:false, dot:'purple' },
];

export default function Topbar({ activePage, onLogout, onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = NOTIFS.filter(n => n.unread).length;

  return (
    <header style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: 'var(--bg2)', flexShrink: 0, position: 'relative', zIndex: 50 }}>
      <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 600, fontSize: 16, flex: 1 }}>
        {PAGE_TITLES[activePage] || 'HostelOS'}
      </h1>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: '7px 12px', color: 'var(--text3)', fontSize: 13, cursor: 'text', minWidth: 180 }}>
        <Search size={14} /><span>Search…</span>
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button className="btn-icon" onClick={() => setNotifOpen(o => !o)} style={{ position: 'relative' }}>
          <Bell size={16} />
          {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid var(--bg2)' }} />}
        </button>
        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
            <div className="animate-fadeUp" style={{ position: 'absolute', top: 44, right: 0, width: 320, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                <span style={{ fontSize: 11, color: 'var(--accent2)', cursor: 'pointer' }}>Mark all read</span>
              </div>
              {NOTIFS.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.unread ? 'rgba(99,102,241,0.04)' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(99,102,241,0.04)' : 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: n.unread ? `var(--${n.dot})` : 'var(--border3)' }} />
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{n.text}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button className="btn-icon"><Settings size={15} /></button>

      {/* Logout button */}
      <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <LogOut size={13} />
        <span className="hide-mobile">Sign Out</span>
      </button>
    </header>
  );
}
