// Warden console — navigation only (distinct from student sidebar)
const ITEMS = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'admin-timetable', label: 'Timetable', icon: '📅' },
  { id: 'admin-complaints', label: 'Complaints', icon: '🛠️' },
  { id: 'admin-leaves', label: 'Leave Approvals', icon: '✈️' },
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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 22%), linear-gradient(180deg, var(--bg2) 0%, var(--bg) 100%)',
        borderRight: '1px solid var(--border2)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 100,
        boxShadow: '8px 0 28px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(196,131,83,0.95), rgba(127,143,115,0.85))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⌁
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>HostelOS</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Warden Console</div>
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
                background: active ? 'rgba(196,131,83,0.16)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text2)',
                borderLeft: active ? '3px solid var(--accent2)' : '3px solid transparent',
                transition: 'transform .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text2)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid color-mix(in oklab, var(--red) 55%, transparent)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'transform .18s ease, background-color .18s ease, color .18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in oklab, var(--red-bg) 72%, transparent)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--red-bg)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
