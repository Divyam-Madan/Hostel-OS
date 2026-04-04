// src/pages/Admin.jsx — real DB stats, Gemini AI, live notifications panel, admin personalisation
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  Card, SectionHeader, StatCard, StatusBadge, Badge,
  TimelineItem, GlowCard,
} from '../components/ui';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const PIE_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#84cc16','#a855f7','#ef4444','#ec4899'];

/* ─── Heatmap ──────────────────────────────────────────────────────── */
const heatmapData = Array.from({length:7}, (_,d) =>
  Array.from({length:10}, (_,hi) => {
    const h = [6,8,10,12,14,16,18,20,22,0][hi];
    return {
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d],
      hour: h,
      value: h>=22||h<=6 ? Math.floor(Math.random()*30) : Math.floor(Math.random()*80)+20,
    };
  })
).flat();

function Heatmap() {
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = [6,8,10,12,14,16,18,20,22,0];
  return (
    <div>
      <div style={{ display:'flex', gap:2, marginBottom:4, paddingLeft:32 }}>
        {hours.map(h=>(
          <div key={h} style={{ flex:1, fontSize:9, color:'var(--text3)', textAlign:'center' }}>
            {h===0?'12a':h>12?`${h-12}p`:`${h}a`}
          </div>
        ))}
      </div>
      {days.map(day=>{
        const dd = heatmapData.filter(d=>d.day===day);
        return (
          <div key={day} style={{ display:'flex', alignItems:'center', gap:2, marginBottom:2 }}>
            <div style={{ width:30, fontSize:10, color:'var(--text3)', textAlign:'right', flexShrink:0 }}>{day}</div>
            {hours.map(h=>{
              const v = dd.find(d=>d.hour===h)?.value||0;
              const op = Math.max(0.12, v/100);
              const bg = v>70?'var(--red)':v>40?'var(--amber)':'var(--green)';
              return (
                <div key={h} title={`${day} ${h}:00 — ${v}%`} style={{ flex:1, height:16, borderRadius:3, background:bg, opacity:op, cursor:'default', transition:'opacity .2s' }} />
              );
            })}
          </div>
        );
      })}
      <div style={{ display:'flex', gap:12, marginTop:8, justifyContent:'flex-end' }}>
        {[['var(--green)','Low'],['var(--amber)','Medium'],['var(--red)','High']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:c }} />
            <span style={{ fontSize:10, color:'var(--text3)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Notification bell with live updates ──────────────────────────── */
function NotifPanel({ notifications, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n=>!n.read).length;
  const ref = useRef();

  useEffect(()=>{
    const handler = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown', handler);
  },[]);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{ position:'relative', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'8px 14px', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}
      >
        🔔 Notifications
        {unread>0 && (
          <span style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'var(--red)', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg)' }}>
            {unread>9?'9+':unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          width:340, background:'var(--bg2)', border:'1px solid var(--border2)',
          borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-lg)',
          zIndex:200, maxHeight:400, overflow:'hidden', display:'flex', flexDirection:'column',
        }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontWeight:600, fontSize:14 }}>Live Notifications</span>
            <div style={{ display:'flex', gap:8 }}>
              {unread>0 && <button onClick={onClear} style={{ fontSize:11, color:'var(--accent2)', background:'none', border:'none', cursor:'pointer' }}>Mark all read</button>}
              <button onClick={()=>setOpen(false)} style={{ fontSize:16, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {notifications.length===0 && (
              <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>No new notifications</div>
            )}
            {notifications.map((n,i)=>(
              <div key={i} style={{
                padding:'12px 16px', borderBottom:'1px solid var(--border)',
                background: n.read?'transparent':'rgba(99,102,241,0.04)',
                display:'flex', gap:10, alignItems:'flex-start',
              }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:n.read?400:600, color:'var(--text)', lineHeight:1.4 }}>{n.text}</p>
                  <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{n.time}</p>
                </div>
                {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:5 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Fee chart data ────────────────────────────────────────────────── */
const feeMonthly = [
  {month:'Jul',collected:420000,pending:80000},{month:'Aug',collected:380000,pending:120000},
  {month:'Sep',collected:450000,pending:50000},{month:'Oct',collected:410000,pending:90000},
  {month:'Nov',collected:395000,pending:105000},{month:'Dec',collected:280000,pending:220000},
];

/* ─── Custom tooltip ────────────────────────────────────────────────── */
const CT = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <p style={{color:'var(--text2)',marginBottom:4}}>{label}</p>
      {payload.map(p=><p key={p.name} style={{color:p.color||'var(--text)',fontWeight:600}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════ */
export default function Admin({ onNavigate }) {
  const { user } = useAuth();
  const adminName = user?.name || user?.username || 'Admin';

  /* ── state ── */
  const [activeTab, setActiveTab]     = useState('overview');
  const [dbStats, setDbStats]         = useState(null);
  const [dbComplaints, setDbComplaints] = useState([]);
  const [dbLeaves, setDbLeaves]       = useState([]);
  const [dbStudents, setDbStudents]   = useState([]);
  const [alerts, setAlerts]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaveActions, setLeaveActions]   = useState({});
  const [searchTerm, setSearchTerm]   = useState('');
  const [yearFilter, setYearFilter]   = useState('all');
  const [statsLoading, setStatsLoading] = useState(true);

  const [aiComplaintText, setAiComplaintText] = useState('');
  const [aiFoodText, setAiFoodText]           = useState('');
  const [aiLoading, setAiLoading]             = useState(false);
  const [dateFrom, setDateFrom] = useState(()=>new Date(Date.now()-30*864e5).toISOString().slice(0,10));
  const [dateTo, setDateTo]     = useState(()=>new Date().toISOString().slice(0,10));

  /* ── push a notification to the panel ── */
  const pushNotif = useCallback((icon, text) => {
    const time = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    setNotifications(prev => [{ icon, text, time, read:false }, ...prev].slice(0, 50));
  }, []);

  const markAllRead = () => setNotifications(prev=>prev.map(n=>({...n,read:true})));

  /* ── loaders ── */
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const d = await api('/admin/stats');
      setDbStats(d.stats || d);
    } catch {
      setDbStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadComplaints = useCallback(async () => {
    try {
      const d = await api('/complaints/all');
      const prev = dbComplaints.length;
      const next = (d.complaints||[]);
      if (prev > 0 && next.length > prev) {
        const newOnes = next.length - prev;
        pushNotif('🛠️', `${newOnes} new complaint${newOnes>1?'s':''} filed`);
      }
      setDbComplaints(next);
    } catch { setDbComplaints([]); }
  }, [dbComplaints.length, pushNotif]);

  const loadLeaves = useCallback(async () => {
    try {
      const d = await api('/leave/all');
      const prev = dbLeaves.length;
      const next = (d.leaves||d.requests||[]);
      if (prev > 0 && next.length > prev) {
        pushNotif('✈️', `New leave request submitted`);
      }
      setDbLeaves(next);
    } catch { setDbLeaves([]); }
  }, [dbLeaves.length, pushNotif]);

  const loadStudents = useCallback(async () => {
    try {
      const d = await api('/admin/students');
      const prev = dbStudents.length;
      const next = (d.students||d.users||[]);
      if (prev > 0 && next.length > prev) {
        pushNotif('👤', `New student registered: ${next[next.length-1]?.username||''}`);
      }
      setDbStudents(next);
    } catch { setDbStudents([]); }
  }, [dbStudents.length, pushNotif]);

  const loadAlerts = useCallback(async () => {
    try {
      const d = await api('/admin/alerts');
      const next = (d.alerts||[]);
      const prev = alerts.length;
      if (prev > 0 && next.length > prev) {
        pushNotif('🔔', `New alert: ${next[0]?.title||'System alert'}`);
      }
      setAlerts(next);
    } catch { setAlerts([]); }
  }, [alerts.length, pushNotif]);

  /* ── initial load ── */
  useEffect(()=>{
    loadStats();
    loadComplaints();
    loadLeaves();
    loadStudents();
    loadAlerts();
    pushNotif('✅', 'Admin dashboard loaded successfully');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  /* ── socket events ── */
  useEffect(()=>{
    const refresh = ()=>{ loadComplaints(); loadAlerts(); loadStats(); loadLeaves(); };
    window.addEventListener('hostel:complaints', refresh);
    window.addEventListener('hostel:alerts', refresh);
    window.addEventListener('hostel:orders', ()=>{ loadStats(); pushNotif('🍽️','Mess order activity detected'); });
    return ()=>{
      window.removeEventListener('hostel:complaints', refresh);
      window.removeEventListener('hostel:alerts', refresh);
      window.removeEventListener('hostel:orders', refresh);
    };
  }, [loadComplaints, loadAlerts, loadStats, loadLeaves, pushNotif]);

  /* ── poll every 30 s for updates ── */
  useEffect(()=>{
    const id = setInterval(()=>{ loadComplaints(); loadLeaves(); loadAlerts(); loadStats(); }, 30000);
    return ()=>clearInterval(id);
  },[loadComplaints, loadLeaves, loadAlerts, loadStats]);

  /* ── derive stats ── */
  const totalStudents   = dbStats?.totalStudents   ?? dbStudents.length   ?? '…';
  const activeComplaints= dbStats?.activeComplaints ?? dbComplaints.filter(c=>c.status!=='resolved').length ?? '…';
  const pendingLeaves   = dbStats?.pendingLeaves    ?? dbLeaves.filter(l=>l.status==='pending').length ?? '…';
  const messAttendance  = dbStats?.messAttendanceToday ?? '…';
  const feeDefaulters   = dbStats?.pendingFees      ?? '…';
  const vacantBeds      = dbStats?.openRooms        ?? '…';

  /* ── complaints by category (from real data) ── */
  const complaintCatMap = {};
  dbComplaints.forEach(c=>{
    const cat = c.category||'Other';
    complaintCatMap[cat] = (complaintCatMap[cat]||0)+1;
  });
  const complaintChartData = Object.entries(complaintCatMap).map(([name,count])=>({name,count}));

  /* ── filtered students ── */
  const filteredStudents = dbStudents.filter(s=>{
    const nm = (s.username||s.name||'').toLowerCase();
    const rm = (s.roomNumber||s.room||'');
    const yr = (s.year||'');
    const matchSearch = nm.includes(searchTerm.toLowerCase()) || rm.includes(searchTerm);
    const matchYear   = yearFilter==='all' || yr.startsWith(yearFilter[0]);
    return matchSearch && matchYear;
  });

  /* ── pending leave list ── */
  const pendingLeaveList = dbLeaves.filter(l=>l.status==='pending');

  /* ── AI handlers ── */
  const runComplaintAI = async () => {
    setAiLoading(true);
    try {
      const d = await api('/admin/complaint-summary', { method:'POST', body:JSON.stringify({dateFrom,dateTo}) });
      setAiComplaintText(d.summary||JSON.stringify(d,null,2));
    } catch(e) { setAiComplaintText(e.message||'Failed — check GEMINI_API_KEY'); }
    finally { setAiLoading(false); }
  };

  const runFoodAI = async () => {
    setAiLoading(true);
    try {
      const d = await api('/admin/food-summary', { method:'POST', body:JSON.stringify({days:7}) });
      setAiFoodText(typeof d.analysis==='string'?d.analysis:JSON.stringify(d.analysis,null,2));
    } catch(e) { setAiFoodText(e.message||'Failed — check GEMINI_API_KEY'); }
    finally { setAiLoading(false); }
  };

  /* ── priority auto-predict (Gemini) for new complaint ── */
  const predictPriority = async (complaint) => {
    try {
      const d = await api('/admin/predict-priority', { method:'POST', body:JSON.stringify({ complaint }) });
      return d.priority || 'medium';
    } catch { return 'medium'; }
  };

  /* ── resolve / progress complaint ── */
  const patchComplaint = async (id, status) => {
    try {
      await api(`/complaints/${id}`, { method:'PATCH', body:JSON.stringify({status}) });
      pushNotif('✅', `Complaint ${id} marked as ${status}`);
      loadComplaints();
    } catch(e) { alert(e.message); }
  };

  const tabs = [
    { id:'overview',   label:'📊 Overview'    },
    { id:'students',   label:'👥 Students'    },
    { id:'complaints', label:'🛠️ Complaints'  },
    { id:'alerts',     label:'🔔 Alerts'      },
    { id:'insights',   label:'🤖 AI Insights' },
    { id:'leaves',     label:'✈️ Leaves'      },
    { id:'fees',       label:'💰 Fees'        },
    { id:'heatmap',    label:'🗺️ Heatmap'     },
  ];

  return (
    <div style={{ padding:24 }} className="animate-fadeUp">

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title-lg">Admin Dashboard</h1>
          <p className="page-desc">
            Hi, <strong style={{ color:'var(--accent2)' }}>{adminName}</strong> 👋  — Hostel operations control centre
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <NotifPanel notifications={notifications} onClear={markAllRead} />
          <button className="btn btn-ghost btn-sm" onClick={()=>{ loadStats(); loadComplaints(); loadLeaves(); loadStudents(); pushNotif('🔄','Dashboard refreshed'); }}>↻ Refresh</button>
          <button className="btn btn-ghost btn-sm">📤 Export</button>
          <button className="btn btn-primary btn-sm">⚙️ Settings</button>
        </div>
      </div>

      {/* ── Stats grid (real DB) ── */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <StatCard icon="👥" label="Total Students"    value={statsLoading?'…':String(totalStudents)}        change="from DB"          accentColor="var(--accent)" />
        <StatCard icon="🛠️" label="Active Complaints" value={statsLoading?'…':String(activeComplaints)}     change={`${dbComplaints.filter(c=>c.status==='pending').length} pending`} accentColor="var(--red)" />
        <StatCard icon="✈️" label="Pending Leaves"    value={statsLoading?'…':String(pendingLeaves)}        change="await review"     accentColor="var(--amber)" />
        <StatCard icon="🍽️" label="Mess Attendance"   value={statsLoading?'…':messAttendance==='…'?'—':`${messAttendance}%`} change="today"  accentColor="var(--green)" />
        <StatCard icon="💰" label="Fee Defaulters"    value={statsLoading?'…':String(feeDefaulters)}        change="₹ pending"        accentColor="var(--pink)" />
        <StatCard icon="🏠" label="Vacant Beds"       value={statsLoading?'…':String(vacantBeds)}           change="4 blocks"         accentColor="var(--teal)" />
      </div>

      {/* ── Tab strip ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:4, flexWrap:'wrap' }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer',
            background: activeTab===t.id?'var(--bg4)':'transparent',
            color: activeTab===t.id?'var(--text)':'var(--text2)',
            fontSize:13, fontWeight:600, fontFamily:'var(--font)', transition:'all .2s',
            whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW ══════════════════ */}
      {activeTab==='overview' && (
        <div>
          <div className="grid-2" style={{ gap:20, marginBottom:20 }}>
            <Card className="card-p">
              <SectionHeader title="Complaints by Category" subtitle="From database — live" />
              {complaintChartData.length===0 ? (
                <p style={{ color:'var(--text3)', fontSize:13, padding:'20px 0' }}>No complaints in DB yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={complaintChartData} layout="vertical" barSize={10}>
                    <XAxis type="number" tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CT />} />
                    <Bar dataKey="count" name="Complaints" radius={[0,6,6,0]}>
                      {complaintChartData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="card-p">
              <SectionHeader title="Mess Rating Distribution" subtitle="This week · random for demo" />
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={[{name:'5★',value:34},{name:'4★',value:42},{name:'3★',value:16},{name:'≤2★',value:8}]} dataKey="value" innerRadius={45} outerRadius={70}>
                      {['#10b981','#6366f1','#f59e0b','#ef4444'].map((c,i)=><Cell key={i} fill={c}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8,fontSize:12}} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{flex:1}}>
                  {[['5★ Excellent','34%','#10b981'],['4★ Good','42%','#6366f1'],['3★ Average','16%','#f59e0b'],['≤2★ Poor','8%','#ef4444']].map(([l,v,c])=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div style={{width:10,height:10,borderRadius:3,background:c,flexShrink:0}}/>
                      <span style={{fontSize:12,flex:1}}>{l}</span>
                      <span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Insight tiles */}
          <div className="grid-3" style={{ gap:12, marginBottom:20 }}>
            {[
              { icon:'🛠️', title:'Total DB Complaints', value:dbComplaints.length, sub:`${dbComplaints.filter(c=>c.status==='resolved').length} resolved`, color:'var(--red)' },
              { icon:'✈️', title:'Pending Leaves (DB)',  value:pendingLeaveList.length, sub:'Awaiting approval', color:'var(--amber)' },
              { icon:'👥', title:'Registered Students',  value:dbStudents.length, sub:'In database', color:'var(--accent)' },
            ].map(ins=>(
              <div key={ins.title} style={{background:'var(--bg2)',border:`1px solid ${ins.color}22`,borderRadius:'var(--radius-md)',padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:22}}>{ins.icon}</span>
                  <p style={{fontSize:12,color:'var(--text2)',fontWeight:600}}>{ins.title}</p>
                </div>
                <p style={{fontSize:26,fontWeight:700,fontFamily:'var(--font2)',color:ins.color}}>{ins.value}</p>
                <p style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{ins.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent notifications as activity feed */}
          <Card className="card-p">
            <SectionHeader title="Live Activity Feed" subtitle="Real-time updates from all users" action={
              <button className="btn btn-ghost btn-sm" onClick={()=>{ loadComplaints(); loadLeaves(); }}>↻</button>
            } />
            {notifications.slice(0,8).map((n,i)=>(
              <TimelineItem key={i} dot={n.read?'default':'blue'}>
                <p style={{fontSize:13}}>{n.icon} {n.text}</p>
                <p style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{n.time}</p>
              </TimelineItem>
            ))}
            {notifications.length===0 && <p style={{color:'var(--text3)',fontSize:13}}>No activity yet — waiting for user actions.</p>}
          </Card>
        </div>
      )}

      {/* ══════════════════ STUDENTS ══════════════════ */}
      {activeTab==='students' && (
        <Card className="card-p">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <SectionHeader title={`Students (${filteredStudents.length} in DB)`} />
            <div style={{display:'flex',gap:8}}>
              <input className="input" style={{width:180}} placeholder="Search name / room…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              <select className="select" style={{width:120}} value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
                <option value="all">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={loadStudents}>↻</button>
            </div>
          </div>
          {filteredStudents.length===0 ? (
            <p style={{color:'var(--text3)',fontSize:13,padding:'20px 0'}}>
              {dbStudents.length===0 ? 'No students in database yet.' : 'No results for your search.'}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Email</th><th>Room</th><th>Year</th><th>Joined</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s=>{
                    const nm = s.username||s.name||'Unknown';
                    const em = s.email||'—';
                    const rm = s.roomNumber||s.room||'—';
                    const yr = s.year||'—';
                    const ca = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
                    return (
                      <tr key={s.id||s._id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent-glow)',border:'1px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--accent2)',flexShrink:0}}>
                              {nm[0].toUpperCase()}
                            </div>
                            <span style={{fontWeight:600,fontSize:13}}>{nm}</span>
                          </div>
                        </td>
                        <td style={{fontSize:12,color:'var(--text2)'}}>{em}</td>
                        <td><span style={{fontFamily:'monospace',fontSize:12,color:'var(--accent2)'}}>{rm}</span></td>
                        <td>{yr}</td>
                        <td style={{fontSize:12,color:'var(--text3)'}}>{ca}</td>
                        <td><StatusBadge status={s.verified||s.isVerified?'active':'pending'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════ COMPLAINTS ══════════════════ */}
      {activeTab==='complaints' && (
        <div>
          <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
            {[{l:'Total',v:dbComplaints.length,c:'var(--accent)'},{l:'Pending',v:dbComplaints.filter(c=>c.status==='pending').length,c:'var(--amber)'},{l:'In Progress',v:dbComplaints.filter(c=>c.status==='in-progress').length,c:'var(--blue)'},{l:'Resolved',v:dbComplaints.filter(c=>c.status==='resolved').length,c:'var(--green)'}].map(s=>(
              <div key={s.l} style={{flex:1,minWidth:100,padding:16,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',textAlign:'center'}}>
                <p style={{fontSize:22,fontWeight:700,fontFamily:'var(--font2)',color:s.c}}>{s.v}</p>
                <p style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{s.l}</p>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" style={{alignSelf:'center'}} onClick={loadComplaints}>↻ Refresh</button>
          </div>
          <Card className="card-p">
            <SectionHeader title="All Complaints (Database)" subtitle="Live from MongoDB · Socket.IO updates" />
            {dbComplaints.length===0 && <p style={{color:'var(--text3)',fontSize:13}}>No complaints in database yet.</p>}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {dbComplaints.map(c=>(
                <div key={c.id||c._id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',flexWrap:'wrap'}}>
                  <span style={{fontSize:20}}>{c.icon||'🛠️'}</span>
                  <div style={{flex:1,minWidth:160}}>
                    <p style={{fontSize:13,fontWeight:600}}>{c.title}</p>
                    <p style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                      {c.student&&<span>{c.student.username||c.student.name} · {c.student.room||c.student.roomNumber||'—'} · </span>}
                      {c.category} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : c.date||'—'}
                    </p>
                    {c.description && <p style={{fontSize:12,color:'var(--text2)',marginTop:4,lineHeight:1.4}}>{c.description}</p>}
                    {/* AI predicted priority badge */}
                    {c.priority && (
                      <span style={{display:'inline-block',marginTop:4,fontSize:10,padding:'2px 7px',borderRadius:20,fontWeight:700,background:c.priority==='high'?'var(--red-bg)':c.priority==='medium'?'var(--amber-bg)':'var(--green-bg)',color:c.priority==='high'?'var(--red)':c.priority==='medium'?'var(--amber)':'var(--green)'}}>
                        🤖 AI: {c.priority.toUpperCase()} PRIORITY
                      </span>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',flexShrink:0}}>
                    {c.status==='pending' && (
                      <button type="button" className="btn btn-ghost btn-xs" onClick={()=>patchComplaint(c.id||c._id,'in-progress')}>In progress</button>
                    )}
                    {c.status!=='resolved' && (
                      <button type="button" className="btn btn-success btn-xs" onClick={()=>patchComplaint(c.id||c._id,'resolved')}>✓ Resolve</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════ ALERTS ══════════════════ */}
      {activeTab==='alerts' && (
        <div>
          <GlowCard color="var(--purple)" style={{marginBottom:16}}>
            <SectionHeader title="Quick Actions" subtitle="Broadcasts via Socket.IO to all connected clients" />
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button type="button" className="btn btn-primary btn-sm" onClick={async()=>{
                try {
                  await api('/admin/trigger-alert',{method:'POST',body:JSON.stringify({type:'wheelchair',title:'Wheelchair assistance',message:'A student requires wheelchair assistance at the main block.'})});
                  pushNotif('♿','Wheelchair alert broadcast to all users');
                  loadAlerts();
                } catch(e) { alert(e.message); }
              }}>♿ Wheelchair alert</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={async()=>{
                try {
                  await api('/admin/trigger-alert',{method:'POST',body:JSON.stringify({type:'maintenance',title:'Maintenance notice',message:'Block C hot water will be unavailable from 2–4 PM today.'})});
                  pushNotif('🔧','Maintenance notice broadcast');
                  loadAlerts();
                } catch(e) { alert(e.message); }
              }}>🔧 Maintenance notice</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadAlerts}>↻ Refresh list</button>
            </div>
          </GlowCard>
          <Card className="card-p">
            <SectionHeader title="Recent Alerts" subtitle={`${alerts.length} total`} />
            {alerts.length===0 && <p style={{color:'var(--text3)',fontSize:13}}>No alerts yet.</p>}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {alerts.map(a=>(
                <div key={a.id||a._id} style={{padding:'12px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,fontWeight:700}}>{a.title}</span>
                    <Badge variant={a.resolved?'green':'amber'}>{a.type}</Badge>
                  </div>
                  <p style={{fontSize:12,color:'var(--text2)',marginTop:6}}>{a.message}</p>
                  <p style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : '—'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════ GEMINI AI INSIGHTS ══════════════════ */}
      {activeTab==='insights' && (
        <div className="grid-2" style={{gap:20}}>
          <Card className="card-p">
            <SectionHeader title="🤖 Complaint Analysis (Gemini)" subtitle="AI summary + priority prediction for date range" />
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              <input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{width:140}} />
              <input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{width:140}} />
              <button type="button" className="btn btn-primary btn-sm" disabled={aiLoading} onClick={runComplaintAI}>
                {aiLoading?'Running…':'▶ Analyze'}
              </button>
            </div>
            <div style={{padding:'4px 0 8px',fontSize:11,color:'var(--text3)'}}>
              Requires <code>GEMINI_API_KEY</code> on the backend server.
            </div>
            <pre style={{whiteSpace:'pre-wrap',fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:12,borderRadius:8,maxHeight:300,overflow:'auto',lineHeight:1.6}}>
              {aiComplaintText || '— Run analysis to see Gemini output —'}
            </pre>
          </Card>
          <Card className="card-p">
            <SectionHeader title="🍽️ Food Review Analysis (Gemini)" subtitle="Sentiment analysis on last 7 days of mess feedback" />
            <button type="button" className="btn btn-primary btn-sm" style={{marginBottom:12}} disabled={aiLoading} onClick={runFoodAI}>
              {aiLoading?'Running…':'▶ Analyze last 7 days'}
            </button>
            <div style={{padding:'4px 0 8px',fontSize:11,color:'var(--text3)'}}>
              Sends all mess reviews to Gemini for sentiment & trend analysis.
            </div>
            <pre style={{whiteSpace:'pre-wrap',fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:12,borderRadius:8,maxHeight:300,overflow:'auto',lineHeight:1.6}}>
              {aiFoodText || '— Run analysis to see Gemini output —'}
            </pre>
          </Card>
        </div>
      )}

      {/* ══════════════════ LEAVES ══════════════════ */}
      {activeTab==='leaves' && (
        <div>
          {pendingLeaveList.length>0 && (
            <GlowCard color="var(--amber)" style={{marginBottom:16}}>
              <SectionHeader title={`⏳ Pending Approvals (${pendingLeaveList.length})`} />
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {pendingLeaveList.map(req=>{
                  const rid = req.id||req._id;
                  const nm = req.student?.username||req.student?.name||req.username||'—';
                  return (
                    <div key={rid} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:200}}>
                        <div style={{display:'flex',gap:6,marginBottom:3}}>
                          <Badge variant={req.type==='leave'?'purple':'teal'}>{req.type}</Badge>
                          <span style={{fontSize:13,fontWeight:600}}>{nm}</span>
                        </div>
                        <p style={{fontSize:12,color:'var(--text2)'}}>{req.reason}</p>
                        <p style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{req.from} → {req.to}</p>
                      </div>
                      {!leaveActions[rid] ? (
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-success btn-sm" onClick={async()=>{
                            try {
                              await api(`/leave/${rid}/approve`,{method:'POST'});
                              setLeaveActions(a=>({...a,[rid]:'approved'}));
                              pushNotif('✅',`Leave approved for ${nm}`);
                              loadLeaves();
                            } catch { setLeaveActions(a=>({...a,[rid]:'approved'})); }
                          }}>✓ Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={async()=>{
                            try {
                              await api(`/leave/${rid}/reject`,{method:'POST'});
                              setLeaveActions(a=>({...a,[rid]:'rejected'}));
                              pushNotif('❌',`Leave rejected for ${nm}`);
                              loadLeaves();
                            } catch { setLeaveActions(a=>({...a,[rid]:'rejected'})); }
                          }}>✕ Reject</button>
                        </div>
                      ) : (
                        <Badge variant={leaveActions[rid]==='approved'?'green':'red'}>
                          {leaveActions[rid]==='approved'?'✓ Approved':'✕ Rejected'}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlowCard>
          )}
          <Card className="card-p">
            <SectionHeader title="All Leave Requests" subtitle="From database" action={<button className="btn btn-ghost btn-sm" onClick={loadLeaves}>↻</button>} />
            {dbLeaves.length===0 && <p style={{color:'var(--text3)',fontSize:13}}>No leave requests in database yet.</p>}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {dbLeaves.map(l=>{
                    const lid = l.id||l._id;
                    const nm = l.student?.username||l.student?.name||l.username||'—';
                    return (
                      <tr key={lid}>
                        <td style={{fontWeight:600,fontSize:13}}>{nm}</td>
                        <td><Badge variant={l.type==='leave'?'purple':'teal'}>{l.type}</Badge></td>
                        <td style={{fontSize:12}}>{l.from||'—'}</td>
                        <td style={{fontSize:12}}>{l.to||'—'}</td>
                        <td style={{fontSize:12,color:'var(--text2)',maxWidth:200}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{l.reason||'—'}</span></td>
                        <td><StatusBadge status={l.status||'pending'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════ FEES ══════════════════ */}
      {activeTab==='fees' && (
        <div>
          <Card className="card-p" style={{marginBottom:20}}>
            <SectionHeader title="Monthly Fee Collection" subtitle="Simulated data for chart demo" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={feeMonthly}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CT />} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="var(--green)" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending"   name="Pending"   stroke="var(--red)"   fill="rgba(239,68,68,0.08)"  strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <div style={{padding:'12px 16px',background:'var(--amber-bg)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'var(--radius)',fontSize:13,color:'var(--amber)'}}>
            ⚠️ Fee data shown above is sample data for UI demo. Connect <code>/admin/fees</code> endpoint for real figures.
          </div>
        </div>
      )}

      {/* ══════════════════ HEATMAP ══════════════════ */}
      {activeTab==='heatmap' && (
        <div>
          <Card className="card-p" style={{marginBottom:20}}>
            <SectionHeader title="Hostel Occupancy Heatmap" subtitle="Simulated — hour-of-day × day-of-week" />
            <Heatmap />
          </Card>
          <div className="grid-2" style={{gap:16}}>
            <GlowCard color="var(--green)">
              <SectionHeader title="📈 Best Attendance Day" />
              <p style={{fontFamily:'var(--font2)',fontSize:26,fontWeight:800,color:'var(--green)'}}>Thursday</p>
              <p style={{fontSize:13,color:'var(--text2)'}}>Avg 91% occupancy this week</p>
            </GlowCard>
            <GlowCard color="var(--amber)">
              <SectionHeader title="⚠️ Lowest Attendance" />
              <p style={{fontFamily:'var(--font2)',fontSize:26,fontWeight:800,color:'var(--amber)'}}>Sunday AM</p>
              <p style={{fontSize:13,color:'var(--text2)'}}>Below 35% before 8 AM</p>
            </GlowCard>
          </div>
        </div>
      )}

    </div>
  );
}
