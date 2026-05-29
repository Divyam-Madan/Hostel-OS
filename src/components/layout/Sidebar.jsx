// src/components/layout/Sidebar.jsx — shows real user name/role from auth hook
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Main' },
  { id: 'dashboard',   label: 'Dashboard',            icon: '⊞'  },
  { id: 'my-info',     label: 'My Profile',            icon: '👤' },
  { id: 'timetable',   label: 'Timetable',             icon: '📅' },
  { section: 'Hostel' },
  { id: 'attendance',  label: 'Attendance',            icon: '📍' },
  { id: 'entry-exit',  label: 'Entry / Exit Logs',     icon: '🚪' },
  { id: 'room',        label: 'Room Allotment',        icon: '🏠' },
  { section: 'Services' },
  { id: 'mess',        label: 'Mess Management',       icon: '🍽️' },
  { id: 'laundry',     label: 'Laundry Slots',         icon: '🧺' },
  { id: 'complaints',  label: 'Complaints',            icon: '🛠️', badge: null },
  { id: 'leave',       label: 'Leave & Outing',        icon: '✈️' },
  { id: 'fees',        label: 'Hostel Fees',           icon: '💰' },
  { section: 'Campus' },
  { id: 'lost-found',  label: 'Lost & Found',          icon: '🔍' },
  { id: 'events',      label: 'Events & Hackathons',   icon: '🎮' },
  { id: 'gym',         label: 'Gym & Wellness',        icon: '🏋️' },
  { id: 'counselling', label: 'Counselling',           icon: '🧠' },
  { id: 'hospital',    label: 'Hospital / Ambulance',  icon: '🏥' },
];

const ADMIN_EXTRA = [
  { section: 'Admin' },
  { id: 'admin', label: 'Admin Dashboard', icon: '🧑‍💼', badge: '●' },
];

export default function Sidebar({ activePage, onNavigate, onLogout, role }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = role === 'admin';
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_EXTRA] : NAV_ITEMS;

  // Display info
  const displayName  = user?.name || user?.username || (isAdmin ? 'Admin' : 'Student');
  const displaySub   = isAdmin
    ? (user?.employeeId || 'Warden Office')
    : (user?.room || 'Hostel');
  const displayPhoto = user?.photo || displayName[0]?.toUpperCase() || '?';

  return (
    <aside style={{
      width: collapsed ? 64 : 248,
      minWidth: collapsed ? 64 : 248,
      height: '100vh',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 26%), var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width .32s cubic-bezier(.4,0,.2,1), min-width .32s cubic-bezier(.4,0,.2,1), background-color .2s ease',
      flexShrink: 0,
      zIndex: 100,
      boxShadow: '0 0 0 1px rgba(255,255,255,0.01), 8px 0 30px rgba(0,0,0,0.06)',
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'18px 14px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg, var(--accent), var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontFamily:'var(--font2)', fontWeight:700, color:'#fff' }}>H</div>
        <div style={{ overflow:'hidden', opacity: collapsed?0:1, transition:'opacity .2s', whiteSpace:'nowrap' }}>
          <div style={{ fontFamily:'var(--font2)', fontWeight:700, fontSize:15, color:'var(--text)' }}>HostelOS</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{isAdmin ? 'Admin Portal' : 'Smart Portal'}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' }}>
        {items.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} style={{
                fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'var(--text3)',
                padding:'14px 16px 4px', whiteSpace:'nowrap', overflow:'hidden',
                opacity: collapsed?0:1, transition:'opacity .2s', textTransform:'uppercase',
              }}>
                {item.section}
              </div>
            );
          }
          const active = activePage === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : ''}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 14px', cursor:'pointer', transition:'transform .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease',
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                background: active ? 'rgba(196,131,83,0.12)' : 'transparent',
                color: active ? 'var(--accent2)' : 'var(--text2)',
                fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', margin:'1px 0',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--text)'; e.currentTarget.style.transform='translateX(2px)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text2)'; e.currentTarget.style.transform='translateX(0)'; }}}
            >
              <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
              <span style={{ opacity: collapsed?0:1, transition:'opacity .2s', flex:1 }}>{item.label}</span>
              {item.badge && !collapsed && (
                <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', flexShrink:0, boxShadow:'0 0 6px var(--red)' }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* User card + collapse */}
      <div style={{ padding:10, borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:10,
          background:'var(--bg3)', borderRadius:'var(--radius)',
          marginBottom:8, overflow:'hidden',
        }}>
          <div style={{
            width:30, height:30, borderRadius:'50%', flexShrink:0,
            background: isAdmin
              ? 'linear-gradient(135deg, var(--purple), var(--accent))'
              : 'linear-gradient(135deg, var(--accent), var(--blue))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'#fff',
          }}>
            {String(displayPhoto).slice(0,2).toUpperCase()}
          </div>
          <div style={{ overflow:'hidden', flex:1, opacity: collapsed?0:1, transition:'opacity .2s' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize:11, color:'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {isAdmin ? '🧑‍💼 ' : ''}{displaySub}
            </div>
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              title="Logout"
              style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text3)', display:'flex', alignItems:'center', padding:4, borderRadius:6, transition:'all .15s', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color='var(--red)'; e.currentTarget.style.background='var(--red-bg)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            width:'100%', padding:'7px 10px',
            background:'transparent', border:'1px solid var(--border2)',
            borderRadius:'var(--radius)', cursor:'pointer', color:'var(--text2)',
            fontSize:12, fontWeight:500, fontFamily:'var(--font)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'transform .2s ease, background-color .2s ease, color .2s ease, border-color .2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--text)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text2)'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          <span style={{ transform: collapsed?'rotate(180deg)':'none', transition:'transform .3s', display:'inline-block' }}>←</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
