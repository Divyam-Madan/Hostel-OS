// src/pages/Leave.jsx
import { useState } from 'react';
import { Card, SectionHeader, StatusBadge, Badge, Modal, Field } from '../components/ui';
import { leaveRequests } from '../data/mockData';

export default function Leave() {
  const [applyOpen, setApplyOpen] = useState(false);
  const [type, setType] = useState('leave');
  const [submitted, setSubmitted] = useState(false);

  const stats = {
    approved: leaveRequests.filter(l => l.status === 'approved').length,
    pending:  leaveRequests.filter(l => l.status === 'pending').length,
    rejected: leaveRequests.filter(l => l.status === 'rejected').length,
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title-lg">Leave & Outing</h1>
          <p className="page-desc">Apply for leave or outing — approved by your proctor</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSubmitted(false); setApplyOpen(true); }}>
          + Apply for Leave / Outing
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Approved', value: stats.approved, color: 'var(--green)',  bg: 'var(--green-bg)',  icon: '✅' },
          { label: 'Pending',  value: stats.pending,  color: 'var(--amber)',  bg: 'var(--amber-bg)',  icon: '⏳' },
          { label: 'Rejected', value: stats.rejected, color: 'var(--red)',    bg: 'var(--red-bg)',    icon: '❌' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 20,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: s.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font2)', color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <Card className="card-p" style={{ marginBottom: 20, borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
        <SectionHeader title="📋 Rules & Guidelines" />
        <div className="grid-2" style={{ gap: 8 }}>
          {[
            '✅ Apply for leave at least 24 hours in advance',
            '✅ Outing must be within town — return by 10:30 PM',
            '⚠️ Emergency leave can be applied same day with proctor\'s verbal approval',
            '⚠️ Late return beyond 11 PM will be flagged in entry logs',
            '❌ Leave cannot exceed 7 consecutive days per semester',
            '❌ Rejected leave cannot be resubmitted for the same dates',
          ].map((rule, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--text2)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{rule}</p>
          ))}
        </div>
      </Card>

      {/* Leave history */}
      <Card className="card-p">
        <SectionHeader title="My Applications" subtitle={`${leaveRequests.length} total`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaveRequests.map(req => (
            <div key={req.id} style={{
              padding: '14px 16px',
              background: req.status === 'approved' ? 'rgba(16,185,129,0.04)' :
                          req.status === 'rejected' ? 'rgba(239,68,68,0.04)' : 'var(--bg3)',
              border: `1px solid ${req.status === 'approved' ? 'rgba(16,185,129,0.2)' :
                                   req.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg4)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
              }}>
                {req.type === 'leave' ? '✈️' : '🚪'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {req.type === 'leave' ? 'Leave Application' : 'Outing Request'}
                  </span>
                  <Badge variant={req.type === 'leave' ? 'purple' : 'teal'}>{req.type}</Badge>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{req.reason}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {formatDate(req.from)} {req.from !== req.to ? `→ ${formatDate(req.to)}` : ''} &nbsp;·&nbsp; Applied: {formatDate(req.appliedOn)}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Apply Modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Leave / Outing" width={520}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Application Submitted!</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '8px 0 16px' }}>
              Your proctor will review and approve within 24 hours.
            </p>
            <button className="btn btn-primary" onClick={() => setApplyOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['leave', 'outing'].map(t => (
                <button
                  key={t}
                  className={`btn flex-1 ${type === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setType(t)}
                >
                  {t === 'leave' ? '✈️ Leave' : '🚪 Outing'}
                </button>
              ))}
            </div>
            <Field label="From Date">
              <input type="date" className="input" />
            </Field>
            {type === 'leave' && (
              <Field label="To Date">
                <input type="date" className="input" />
              </Field>
            )}
            {type === 'outing' && (
              <Field label="Expected Return Time">
                <select className="select">
                  <option>Before 8 PM</option>
                  <option>Before 9 PM</option>
                  <option>Before 10 PM</option>
                  <option>Before 10:30 PM</option>
                </select>
              </Field>
            )}
            <Field label="Reason / Purpose">
              <textarea className="input" rows={3} placeholder="Describe the reason for your leave / outing…" style={{ resize: 'none' }} />
            </Field>
            <Field label="Parent / Guardian Consent">
              <select className="select">
                <option>Parent informed via phone</option>
                <option>Parent will call warden</option>
                <option>Medical emergency — self-certified</option>
              </select>
            </Field>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 14, fontSize: 12, color: 'var(--amber)',
            }}>
              ⚠️ Approval is subject to proctor discretion. Apply at least 24 hours in advance.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={() => setSubmitted(true)}>Submit Application</button>
              <button className="btn btn-ghost" onClick={() => setApplyOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
