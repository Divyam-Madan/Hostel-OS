// src/components/ui/index.jsx
// ─── All small reusable UI components in one file ────────────────────────────

import { useState } from 'react';
import { X } from 'lucide-react';

// ─── STAT CARD ───────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, change, changeType = 'up', accentColor }) {
  return (
    <div className="stat-card" style={{ '--accent-color': accentColor }}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value font2">{value}</span>
      {change && (
        <span className={`stat-change ${changeType}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </span>
      )}
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gray' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    approved:    { variant: 'green',  label: 'Approved' },
    rejected:    { variant: 'red',    label: 'Rejected' },
    pending:     { variant: 'amber',  label: 'Pending' },
    resolved:    { variant: 'green',  label: 'Resolved' },
    'in-progress':{ variant: 'blue',  label: 'In Progress' },
    paid:        { variant: 'green',  label: 'Paid' },
    due:         { variant: 'red',    label: 'Due' },
    partial:     { variant: 'amber',  label: 'Partial' },
    lost:        { variant: 'red',    label: 'Lost' },
    found:       { variant: 'green',  label: 'Found' },
    claimed:     { variant: 'teal',   label: 'Claimed' },
    open:        { variant: 'blue',   label: 'Open' },
    active:      { variant: 'green',  label: 'Active' },
  };
  const cfg = map[status] || { variant: 'gray', label: status };
  return <Badge variant={cfg.variant}>● {cfg.label}</Badge>;
}

// ─── PRIORITY BADGE ──────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = { high: 'red', medium: 'amber', low: 'teal' };
  return <Badge variant={map[priority] || 'gray'}>{priority?.toUpperCase()}</Badge>;
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress">
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color || 'var(--accent)' }}
      />
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 'md', color }) {
  return (
    <div
      className={`avatar avatar-${size}`}
      style={color ? { background: color } : {}}
    >
      {initials}
    </div>
  );
}

// ─── STAR RATING ─────────────────────────────────────────────────────────────
export function StarRating({ value, onChange, max = 5 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`star${(hover || value) > i ? ' filled' : ''}`}
          onClick={() => onChange && onChange(i + 1)}
          onMouseEnter={() => onChange && setHover(i + 1)}
          onMouseLeave={() => onChange && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ padding: '48px 24px', gap: 12 }}>
      <span style={{ fontSize: 40 }}>{icon}</span>
      <p className="font-semibold" style={{ fontSize: 15 }}>{title}</p>
      {desc && <p className="text-muted text-sm">{desc}</p>}
      {action}
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div>
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style, hover = false, onClick }) {
  return (
    <div
      className={`card card-p ${hover ? 'card-hover' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-fadeUp"
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="font2 font-semibold" style={{ fontSize: 15 }}>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// ─── TIMELINE ITEM ───────────────────────────────────────────────────────────
export function TimelineItem({ dot = 'default', children }) {
  const colorMap = { default: '', green: 'green', amber: 'amber', red: 'red', blue: 'blue', purple: 'purple' };
  return (
    <div className="timeline-item">
      <div className={`timeline-dot ${colorMap[dot]}`} style={{ marginTop: 6 }} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ─── QUICK CHIP FILTERS ──────────────────────────────────────────────────────
export function ChipFilter({ options, value, onChange }) {
  return (
    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
      {options.map(opt => (
        <span
          key={opt.value}
          className={`chip ${value === opt.value ? 'active-accent' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </span>
      ))}
    </div>
  );
}

// ─── GLOW CARD (accent-bordered feature card) ─────────────────────────────────
export function GlowCard({ children, color = 'var(--accent)', style }) {
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${color}44`,
        borderRadius: 'var(--radius-md)',
        padding: 20,
        boxShadow: `0 0 24px ${color}18`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
export function Skeleton({ w = '100%', h = 16, style }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: 6, ...style }}
    />
  );
}

// ─── INFO ROW ────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, badge }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-muted text-sm">{label}</span>
      {badge ? badge : <span className="font-medium" style={{ fontSize: 13 }}>{value}</span>}
    </div>
  );
}

// ─── ICON BOX ────────────────────────────────────────────────────────────────
export function IconBox({ icon, color = 'var(--accent)', size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 10,
        background: `${color}20`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}
