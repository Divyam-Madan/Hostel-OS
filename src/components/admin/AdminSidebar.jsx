// Warden console — navigation only (distinct from student sidebar)
const ITEMS = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'admin-complaints', label: 'Complaints', icon: '🛠️' },
  { id: 'admin-events', label: 'Events', icon: '🎫' },
  { id: 'admin-feedback', label: 'Feedback Analysis', icon: '🍽️' },
  { id: 'admin-wellbeing', label: 'Wellbeing', icon: '🧠' },
  { id: 'admin-students', label: 'Students', icon: '👥' },
];

export default function AdminSidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        background: 'linear-gradient(180deg, #0c0e14 0%, #11141c 100%)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⌁
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>HostelOS</div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Warden Console</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                marginBottom: 4,
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: active ? '#e0e7ff' : '#94a3b8',
                borderLeft: active ? '3px solid #818cf8' : '3px solid transparent',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(248,113,113,0.35)',
            background: 'rgba(248,113,113,0.08)',
            color: '#fca5a5',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
