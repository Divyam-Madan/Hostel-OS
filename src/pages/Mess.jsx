// src/pages/Mess.jsx
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Card, SectionHeader, StarRating, GlowCard, Badge, Modal, Field } from '../components/ui';
import { messMenu as mockMessMenu } from '../data/mockData';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const CATERER_OPTIONS = [
  { name: 'Sri Annapoorna Caterers', rating: 4.2, since: '2022', current: true },
  { name: 'Shree Krishna Food Services', rating: 3.8, since: '2021', current: false },
  { name: 'Tirumala Mess & Catering', rating: 4.5, since: '2023', current: false },
];

function QRScanner({ onClose }) {
  const [scanned, setScanned] = useState(false);
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ width:200, height:200, margin:'0 auto 16px', border:'2px solid var(--accent)', borderRadius:16, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg3)' }}>
        {!scanned ? (
          <>
            {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h])=>(
              <div key={v+h} style={{ position:'absolute', [v]:8, [h]:8, width:24, height:24,
                borderTop: v==='top'?'3px solid var(--accent)':'none',
                borderBottom: v==='bottom'?'3px solid var(--accent)':'none',
                borderLeft: h==='left'?'3px solid var(--accent)':'none',
                borderRight: h==='right'?'3px solid var(--accent)':'none',
              }} />
            ))}
            <div style={{ position:'absolute', left:8, right:8, height:2, background:'linear-gradient(90deg, transparent, var(--accent), transparent)', animation:'scanLine 2s ease-in-out infinite' }} />
            <span style={{ fontSize:40 }}>📷</span>
          </>
        ) : (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
            <p style={{ fontSize:13, color:'var(--green)', fontWeight:700 }}>Entry Marked!</p>
          </div>
        )}
      </div>
      <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>
        {scanned ? 'Mess entry recorded successfully' : 'Tap to simulate QR scan'}
      </p>
      {!scanned ? (
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button className="btn btn-primary" onClick={() => setScanned(true)}>📱 Scan QR Code</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <button className="btn btn-success" onClick={onClose}>Done</button>
      )}
      <style>{`@keyframes scanLine{0%{top:10%}50%{top:85%}100%{top:10%}}`}</style>
    </div>
  );
}

function FeedbackModal({ meal, onClose }) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const quickTags = ['Too spicy','Undercooked','Excellent taste','Good quantity','Fresh','Needs variety','Too salty','Perfect portion'];

  const submit = async () => {
    if (!rating) return;
    setSending(true);
    setErr('');
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          foodItem: meal?.label || 'Mess',
          rating,
          comment,
          tags,
        }),
      });
      setSubmitted(true);
    } catch (e) {
      setErr(e.message || 'Failed to submit');
    } finally {
      setSending(false);
    }
  };

  if (submitted) return (
    <div style={{ textAlign:'center', padding:'16px 0' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
      <h3 style={{ fontFamily:'var(--font2)', fontWeight:700 }}>Thank you!</h3>
      <p style={{ color:'var(--text2)', fontSize:13, margin:'8px 0 16px' }}>Your feedback helps improve the mess experience.</p>
      <button className="btn btn-primary" onClick={onClose}>Close</button>
    </div>
  );

  return (
    <div>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>How was <strong style={{ color:'var(--text)' }}>{meal?.label}</strong>?</p>
      {err && <p style={{ color:'var(--red)', fontSize:12, marginBottom:8 }}>{err}</p>}
      <div style={{ marginBottom:16 }}>
        <label className="label">Overall Rating</label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && <p style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{['','Very poor','Poor','Average','Good','Excellent!'][rating]}</p>}
      </div>
      <div style={{ marginBottom:16 }}>
        <label className="label">Quick Tags</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {quickTags.map(t => (
            <span key={t} className={`chip ${tags.includes(t)?'active-accent':''}`} onClick={() => setTags(p => p.includes(t)?p.filter(x=>x!==t):[...p,t])}>{t}</span>
          ))}
        </div>
      </div>
      <Field label="Additional Comments (optional)">
        <textarea className="input" rows={2} placeholder="Anything else…" style={{ resize:'none' }} value={comment} onChange={e => setComment(e.target.value)} />
      </Field>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-primary flex-1" onClick={submit} disabled={!rating || sending}>{sending ? 'Sending…' : 'Submit Feedback'}</button>
        <button className="btn btn-ghost" onClick={onClose}>Skip</button>
      </div>
    </div>
  );
}

// Nutrition radar chart data
const nutritionData = [
  { subject:'Protein',  value:65 }, { subject:'Carbs',   value:80 },
  { subject:'Fats',     value:45 }, { subject:'Vitamins', value:70 },
  { subject:'Fibre',    value:60 }, { subject:'Calcium',  value:55 },
];

export default function Mess() {
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);
  const [qrOpen, setQrOpen]         = useState(false);
  const [feedbackMeal, setFeedbackMeal] = useState(null);
  const [nightOpen, setNightOpen]   = useState(false);
  const [catererOpen, setCatererOpen] = useState(false);
  const [roomServiceOpen, setRoomServiceOpen] = useState(false);
  const [rsMeal, setRsMeal] = useState('dinner');
  const [rsReason, setRsReason] = useState('');
  const [rsRoom, setRsRoom] = useState('');
  const [orderToken, setOrderToken] = useState(null);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/menu/today');
        if (data.menu?.meals?.length) {
          setMenu({
            ...data.menu,
            meals: data.menu.meals.map((m) => ({
              ...m,
              rating: m.rating ?? '—',
              votes: m.votes ?? '—',
              items: m.items || [],
            })),
            aiInsights: mockMessMenu.aiInsights,
            feedbackTrend: mockMessMenu.feedbackTrend,
          });
        }
      } catch {
        /* use mock */
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.room) setRsRoom(user.room);
  }, [user?.room]);

  const messMenu = menu || {
    ...mockMessMenu,
    meals: mockMessMenu.meals.map((m) => ({ ...m, items: [...m.items] })),
  };

  const mealStatus = {
    breakfast: { done: true  },
    lunch:     { done: true  },
    snacks:    { done: false },
    dinner:    { done: false },
  };

  return (
    <div style={{ padding:24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Mess Management</h1>
        <p className="page-desc">Menu · QR entry · Feedback · AI insights · Caterer management</p>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => setQrOpen(true)}>📷 QR Mess Entry</button>
        <button className="btn btn-secondary" onClick={() => setNightOpen(true)}>🌙 Night Mess</button>
        <button className="btn btn-secondary" onClick={() => setRoomServiceOpen(true)}>🛏️ Room Service</button>
        <button className="btn btn-secondary" onClick={() => setCatererOpen(true)}>🔄 Caterer Change</button>
      </div>

      <div className="grid-2" style={{ gap:20, marginBottom:20 }}>
        {/* Meal status */}
        <Card className="card-p">
          <SectionHeader title="Today's Meal Status" subtitle={messMenu.date} />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {messMenu.meals.map(meal => {
              const st = mealStatus[meal.id];
              return (
                <div key={meal.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:20, width:28, textAlign:'center' }}>{meal.icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600 }}>{meal.label}</p>
                    <p style={{ fontSize:11, color:'var(--text3)' }}>{meal.time}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, color:st.done?'var(--green)':'var(--text3)', fontWeight:600 }}>
                      {st.done ? '✓ Attended' : '— Not yet'}
                    </span>
                    {st.done && <button className="btn btn-ghost btn-xs" onClick={() => setFeedbackMeal(meal)}>Rate ★</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI Insights */}
        <GlowCard color="var(--green)">
          <SectionHeader title="🤖 AI Insights" subtitle="Based on student feedback" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {messMenu.aiInsights.map((ins,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ins.icon}</span>
                <span style={{ fontSize:13, lineHeight:1.4 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Weekly menu cards */}
      <Card className="card-p" style={{ marginBottom:20 }}>
        <SectionHeader title="Today's Full Menu" />
        <div className="grid-4" style={{ gap:12 }}>
          {messMenu.meals.map(meal => (
            <div key={meal.id} style={{ background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>{meal.icon}</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>{meal.label}</p>
                  <p style={{ fontSize:11, color:'var(--text3)' }}>{meal.time}</p>
                </div>
              </div>
              <div style={{ padding:'10px 14px' }}>
                {meal.items.map(item => (
                  <p key={item} style={{ fontSize:12, color:'var(--text2)', padding:'3px 0', borderBottom:'1px solid var(--border)' }}>· {item}</p>
                ))}
              </div>
              <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:4, borderTop:'1px solid var(--border)' }}>
                <span style={{ color:'var(--amber)', fontSize:13 }}>★</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{meal.rating}</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>({meal.votes})</span>
                <button className="btn btn-ghost btn-xs" style={{ marginLeft:'auto' }} onClick={() => setFeedbackMeal(meal)}>Rate</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid-2" style={{ gap:20 }}>
        {/* Feedback trend */}
        <Card className="card-p">
          <SectionHeader title="Weekly Rating Trend" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={messMenu.feedbackTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[3,5]} tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
              <Line type="monotone" dataKey="breakfast" name="Breakfast" stroke="var(--amber)"  strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lunch"     name="Lunch"     stroke="var(--green)"  strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="dinner"    name="Dinner"    stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
            {[['Breakfast','var(--amber)'],['Lunch','var(--green)'],['Dinner','var(--accent)']].map(([n,c])=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:24, height:3, background:c, borderRadius:2 }} />
                <span style={{ fontSize:12, color:'var(--text2)' }}>{n}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Nutrition radar */}
        <Card className="card-p">
          <SectionHeader title="Nutritional Balance" subtitle="Today's estimated meal coverage" />
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={nutritionData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--text2)', fontSize:11 }} />
              <Radar name="Nutrition" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} formatter={v => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Modals */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Mess Entry">
        <QRScanner onClose={() => setQrOpen(false)} />
      </Modal>

      <Modal open={!!feedbackMeal} onClose={() => setFeedbackMeal(null)} title={`Rate ${feedbackMeal?.label}`}>
        <FeedbackModal meal={feedbackMeal} onClose={() => setFeedbackMeal(null)} />
      </Modal>

      <Modal open={nightOpen} onClose={() => setNightOpen(false)} title="Night Mess Registration">
        <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>Night mess: 10:30 PM – 11:30 PM. Register before 9 PM.</p>
        <Field label="Date"><input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} /></Field>
        <Field label="Item Request (optional)"><input className="input" placeholder="e.g. extra roti, less sugar" /></Field>
        <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={() => setNightOpen(false)}>Confirm Night Mess</button>
      </Modal>

      <Modal open={roomServiceOpen} onClose={() => { setRoomServiceOpen(false); setOrderToken(null); }} title="Apply for Room Service">
        {orderToken != null ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <p style={{ fontSize:13, color:'var(--text2)' }}>Your order token</p>
            <p style={{ fontSize:36, fontWeight:800, fontFamily:'var(--font2)', color:'var(--accent2)' }}>{orderToken}</p>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Show this at the mess counter. Live updates broadcast to admins.</p>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={() => { setRoomServiceOpen(false); setOrderToken(null); }}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>Places a mess order with a pickup token (logged in DB).</p>
            <Field label="Meal">
              <select className="select" value={rsMeal} onChange={e => setRsMeal(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </Field>
            <Field label="Reason / Notes"><textarea className="input" rows={2} style={{ resize:'none' }} placeholder="e.g. room service — unwell" value={rsReason} onChange={e => setRsReason(e.target.value)} /></Field>
            <Field label="Room Number"><input className="input" value={rsRoom} onChange={e => setRsRoom(e.target.value)} /></Field>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} disabled={ordering} onClick={async () => {
              setOrdering(true);
              try {
                const items = [`Room service (${rsMeal})`, rsRoom && `Room ${rsRoom}`, rsReason].filter(Boolean);
                const data = await api('/order', { method: 'POST', body: JSON.stringify({ items, mealType: rsMeal }) });
                setOrderToken(data.tokenNumber);
              } catch (e) {
                alert(e.message || 'Order failed');
              } finally {
                setOrdering(false);
              }
            }}>{ordering ? 'Placing…' : 'Place order & get token'}</button>
          </>
        )}
      </Modal>

      <Modal open={catererOpen} onClose={() => setCatererOpen(false)} title="🔄 Caterer Change Request" width={500}>
        <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>Current contract expires Mar 2025. Vote for your preferred caterer:</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {CATERER_OPTIONS.map(c => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background: c.current?'rgba(99,102,241,0.08)':'var(--bg3)', border:`1px solid ${c.current?'rgba(99,102,241,0.25)':'var(--border)'}`, borderRadius:'var(--radius)', cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => !c.current && (e.currentTarget.style.background = 'var(--bg4)')}
              onMouseLeave={e => !c.current && (e.currentTarget.style.background = 'var(--bg3)')}
            >
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700 }}>{c.name}</p>
                <p style={{ fontSize:11, color:'var(--text2)' }}>Serving since {c.since} · ★ {c.rating}</p>
              </div>
              {c.current ? <Badge variant="purple">Current</Badge> : <button className="btn btn-ghost btn-xs">Vote</button>}
            </div>
          ))}
        </div>
        <Field label="Reason for Change (optional)">
          <textarea className="input" rows={2} style={{ resize:'none' }} placeholder="Feedback on current caterer…" />
        </Field>
        <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={() => setCatererOpen(false)}>Submit Preference</button>
      </Modal>
    </div>
  );
}
