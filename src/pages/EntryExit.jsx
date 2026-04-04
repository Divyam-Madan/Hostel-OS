// src/pages/EntryExit.jsx
import { useState } from 'react';
import { Card, SectionHeader, Badge } from '../components/ui';
import { entryExitLogs, currentUser } from '../data/mockData';

const STATUS_CONFIG = {
  normal:  { label: 'On Time',         bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.15)', dot: 'var(--green)',  textColor: 'var(--green)' },
  warning: { label: 'Moderately Late', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)', dot: 'var(--amber)',  textColor: 'var(--amber)' },
  danger:  { label: 'Extremely Late',  bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',  dot: 'var(--red)',    textColor: 'var(--red)' },
  leave:   { label: 'On Leave',        bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.15)', dot: 'var(--accent2)',textColor: 'var(--accent2)' },
};

export default function EntryExit() {
  const stats = {
    onTime:   entryExitLogs.filter(l => l.status === 'normal').length,
    warning:  entryExitLogs.filter(l => l.status === 'warning').length,
    late:     entryExitLogs.filter(l => l.status === 'danger').length,
    leave:    entryExitLogs.filter(l => l.status === 'leave').length,
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Entry / Exit Logs</h1>
        <p className="page-desc">
          Hostel check-in history · Curfew: <strong>10:30 PM</strong> · Yellow = moderately late · Red = extremely late
        </p>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
        padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 4 }}>Legend:</span>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: v.dot }} />
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'On Time',   value: stats.onTime,  color: 'var(--green)',  icon: '✅' },
          { label: 'Mod. Late', value: stats.warning, color: 'var(--amber)',  icon: '⚠️' },
          { label: 'Ext. Late', value: stats.late,    color: 'var(--red)',    icon: '🔴' },
          { label: 'On Leave',  value: stats.leave,   color: 'var(--accent2)',icon: '✈️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font2)', color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Log list */}
      <Card className="card-p">
        <SectionHeader title="Check-In History" subtitle="Last 8 entries" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entryExitLogs.map((log, i) => {
            const cfg = STATUS_CONFIG[log.status];
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                transition: 'all .2s',
              }}>
                {/* Date */}
                <div style={{ width: 90, flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>
                    {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(log.date).toLocaleDateString('en-IN', { year: 'numeric' })}
                  </p>
                </div>

                {/* Status dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {log.checkIn ? `Checked in at` : log.status === 'leave' ? 'On approved leave' : 'No check-in recorded'}
                  </p>
                </div>

                {/* Time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {log.checkIn && (
                    <p style={{
                      fontSize: 16, fontWeight: 700, fontFamily: 'var(--font2)',
                      color: cfg.textColor,
                    }}>{log.checkIn}</p>
                  )}
                  <p style={{
                    fontSize: 11, fontWeight: 600,
                    color: cfg.textColor,
                    background: cfg.bg,
                    padding: '2px 8px', borderRadius: 10, marginTop: 2,
                    display: 'inline-block',
                  }}>
                    {log.statusLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Info box */}
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>ℹ️ Policy Reminder:</strong> All students must check in by 10:30 PM.
        Late arrivals between 10:30–11:00 PM are flagged in amber. Beyond 11:00 PM is flagged in red and reported to your proctor.
        Parents will be notified for red entries.
      </div>
    </div>
  );
}
