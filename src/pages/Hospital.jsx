// src/pages/Hospital.jsx
import { useState } from 'react';
import { Card, SectionHeader, GlowCard, Field, Modal } from '../components/ui';
import { hospitalData } from '../data/mockData';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Hospital() {
  const { role } = useAuth();
  const [ambulanceOpen, setAmbulanceOpen] = useState(false);
  const [ambulanceSent, setAmbulanceSent] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralDone, setReferralDone] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentDone, setIncidentDone] = useState(false);
  const [incidentRef, setIncidentRef] = useState('');
  const [incType, setIncType] = useState('Physical altercation / Fight');
  const [incLoc, setIncLoc] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incSubmitting, setIncSubmitting] = useState(false);
  const [eta, setEta] = useState(null);

  const dispatch = () => {
    const mins = Math.floor(Math.random() * 6) + 10;
    setEta(mins);
    setAmbulanceSent(true);
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Hospital & Ambulance</h1>
        <p className="page-desc">Emergency dispatch, referrals and incident reporting</p>
      </div>

      {/* Emergency CTA */}
      <div style={{ background:'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius-lg)', padding:24, marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ fontSize:52 }}>🚑</div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontFamily:'var(--font2)', fontWeight:700, fontSize:20, color:'var(--red)', marginBottom:4 }}>Need an Ambulance?</h2>
          <p style={{ color:'var(--text2)', fontSize:13 }}>Campus ambulance available 24×7. Arrives in <strong style={{ color:'var(--text)' }}>10–15 minutes</strong>. Free for hostel students.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button className="btn btn-danger" style={{ padding:'12px 24px', fontSize:15 }} onClick={() => { setAmbulanceSent(false); setEta(null); setAmbulanceOpen(true); }}>
            🚑 Request Ambulance
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setIncidentDone(false); setIncidentRef(''); setIncDesc(''); setIncidentOpen(true); }}>
            📋 Report Incident
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gap:20, marginBottom:20 }}>
        {/* Campus health centre */}
        <GlowCard color="var(--blue)">
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'var(--blue-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🏥</div>
            <div>
              <p style={{ fontSize:15, fontWeight:700 }}>{hospitalData.healthCenter.name}</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{hospitalData.healthCenter.timing}</p>
              <p style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>📍 {hospitalData.healthCenter.location}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <a href={`tel:${hospitalData.healthCenter.phone}`} style={{ flex:1 }}>
              <button className="btn btn-primary w-full" style={{ justifyContent:'center' }}>📞 {hospitalData.healthCenter.phone}</button>
            </a>
            <button className="btn btn-ghost btn-sm" onClick={() => { setReferralDone(false); setReferralOpen(true); }}>Referred? →</button>
          </div>
        </GlowCard>

        {/* Quick actions */}
        <Card className="card-p">
          <SectionHeader title="Quick Actions" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { icon:'🩺', label:'Book Doctor Appointment',   sub:'Campus health centre',         color:'var(--blue)' },
              { icon:'💊', label:'Request Medicine Delivery', sub:'For bedridden students',        color:'var(--green)' },
              { icon:'🛏️', label:'Apply for Room Service',    sub:'Meals delivered when unwell',   color:'var(--amber)' },
              { icon:'📋', label:'Upload Medical Certificate',sub:'For leave / exam exemption',    color:'var(--purple)' },
            ].map(a => (
              <div key={a.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color+'44'; e.currentTarget.style.background = a.color+'0c'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
              >
                <div style={{ width:36, height:36, borderRadius:10, background:a.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{a.icon}</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600 }}>{a.label}</p>
                  <p style={{ fontSize:11, color:'var(--text3)' }}>{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Nearby hospitals */}
      <Card className="card-p">
        <SectionHeader title="Nearby Hospitals" />
        {hospitalData.nearbyHospitals.map(h => (
          <div key={h.name} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', marginBottom:8, transition:'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏥</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:600 }}>{h.name}</p>
              <div style={{ display:'flex', gap:10, fontSize:12, color:'var(--text2)', marginTop:2 }}>
                <span>📍 {h.distance}</span>
                <span style={{ padding:'1px 7px', background: h.type==='Government'?'var(--green-bg)':'var(--blue-bg)', color:h.type==='Government'?'var(--green)':'var(--blue)', borderRadius:10, fontSize:11, fontWeight:600 }}>{h.type}</span>
              </div>
            </div>
            <a href={`tel:${h.phone}`}><button className="btn btn-ghost btn-sm">📞 Call</button></a>
          </div>
        ))}
      </Card>

      {/* Ambulance Modal */}
      <Modal open={ambulanceOpen} onClose={() => setAmbulanceOpen(false)} title="Request Campus Ambulance" width={460}>
        {ambulanceSent ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🚑</div>
            <h3 style={{ fontFamily:'var(--font2)', fontWeight:700, color:'var(--green)', marginBottom:8 }}>Ambulance Dispatched!</h3>
            <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:16, marginBottom:16 }}>
              <p style={{ fontSize:13, color:'var(--text2)' }}>Estimated Arrival</p>
              <p style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font2)', color:'var(--green)' }}>{eta} min</p>
              <p style={{ fontSize:13, color:'var(--text2)', marginTop:8 }}>Request ID: <strong style={{ color:'var(--accent2)', fontFamily:'monospace' }}>AMB-{Date.now().toString().slice(-6)}</strong></p>
            </div>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>Driver will call you. Wait near the main gate of your block.</p>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={() => setAmbulanceOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--radius)', padding:'10px 12px', marginBottom:16, fontSize:13, color:'var(--red)' }}>
              ⚠️ Only use for genuine medical emergencies. Misuse is a disciplinary offence.
            </div>
            <Field label="Student Name"><input className="input" defaultValue="Arjun Sharma" /></Field>
            <Field label="Room Number"><input className="input" defaultValue="B-204" /></Field>
            <Field label="Nature of Emergency">
              <select className="select">
                <option>Injury / Accident</option>
                <option>Severe illness / high fever</option>
                <option>Unconscious / unresponsive</option>
                <option>Allergic reaction</option>
                <option>Mental health crisis</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Contact Number"><input className="input" defaultValue="+91 98765 43210" /></Field>
            <button className="btn btn-danger w-full" style={{ justifyContent:'center', padding:'12px', fontSize:14 }} onClick={dispatch}>
              🚑 Dispatch Ambulance Now
            </button>
          </div>
        )}
      </Modal>

      {/* Referral Modal */}
      <Modal open={referralOpen} onClose={() => setReferralOpen(false)} title="Hospital Referral Details">
        {referralDone ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <h3 style={{ fontFamily:'var(--font2)', fontWeight:700 }}>Referral Logged</h3>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'8px 0 16px' }}>Warden and proctor notified.</p>
            <button className="btn btn-primary" onClick={() => setReferralOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            <Field label="Referred Hospital"><input className="input" placeholder="Hospital name" /></Field>
            <Field label="Attending Person"><input className="input" placeholder="Guardian / friend name" /></Field>
            <Field label="Attendant Contact"><input className="input" placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="Expected Return"><input type="date" className="input" /></Field>
            <Field label="Diagnosis / Condition"><textarea className="input" rows={2} style={{ resize:'none' }} /></Field>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} onClick={() => setReferralDone(true)}>Submit Details</button>
          </div>
        )}
      </Modal>

      {/* Incident Report Modal */}
      <Modal open={incidentOpen} onClose={() => setIncidentOpen(false)} title="📋 Report an Incident">
        {incidentDone ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <h3 style={{ fontFamily:'var(--font2)', fontWeight:700 }}>Incident Reported</h3>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'8px 0 16px' }}>
              Health centre emailed and admin alert created.
              {incidentRef && (
                <>
                  {' '}Ref: <strong style={{ color:'var(--accent2)', fontFamily:'monospace' }}>{incidentRef.slice(-8)}</strong>
                </>
              )}
            </p>
            <button className="btn btn-primary" onClick={() => setIncidentOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            {role !== 'student' && (
              <p style={{ color:'var(--amber)', fontSize:13, marginBottom:12 }}>Sign in as a student to submit a report to the health centre.</p>
            )}
            <Field label="Incident Type">
              <select className="select" value={incType} onChange={e => setIncType(e.target.value)}>
                <option>Physical altercation / Fight</option>
                <option>Theft / Burglary</option>
                <option>Ragging / Harassment</option>
                <option>Fire / Safety hazard</option>
                <option>Mental health concern</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Location of Incident"><input className="input" placeholder="e.g. Block B corridor, 2nd floor" value={incLoc} onChange={e => setIncLoc(e.target.value)} /></Field>
            <Field label="Date & Time">
              <input type="datetime-local" className="input" defaultValue={new Date().toISOString().slice(0,16)} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={4} placeholder="Describe what happened…" style={{ resize:'none' }} value={incDesc} onChange={e => setIncDesc(e.target.value)} />
            </Field>
            <button className="btn btn-primary w-full" style={{ justifyContent:'center' }} disabled={incSubmitting || role !== 'student'} onClick={async () => {
              const combined = [`Type: ${incType}`, incLoc && `Location: ${incLoc}`, incDesc && `Details: ${incDesc}`].filter(Boolean).join('\n');
              if (combined.length < 5) return;
              setIncSubmitting(true);
              try {
                const data = await api('/health/report', { method: 'POST', body: JSON.stringify({ description: combined }) });
                setIncidentRef(data.alert?.id || '');
                setIncidentDone(true);
              } catch (e) {
                alert(e.message || 'Failed to submit');
              } finally {
                setIncSubmitting(false);
              }
            }}>{incSubmitting ? 'Submitting…' : 'Submit Report'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
