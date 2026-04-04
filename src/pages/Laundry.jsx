// src/pages/Laundry.jsx
import { useState } from 'react';
import { Card, SectionHeader, GlowCard } from '../components/ui';
import { laundrySlots } from '../data/mockData';
import { randomId } from '../utils';

export default function Laundry() {
  const [slots, setSlots] = useState(laundrySlots);
  const [selectedDate, setSelectedDate] = useState(0);
  const [booked, setBooked] = useState(null);
  const [token, setToken] = useState(null);
  const [mode, setMode] = useState('free'); // 'free' | 'paid'

  const dates = [
    { label: 'Today',     sub: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
    { label: 'Tomorrow',  sub: new Date(Date.now()+86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
    { label: 'Day After', sub: new Date(Date.now()+172800000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
  ];

  const mySlot = slots.find(s => s.bookedBy === 'You');

  const confirm = () => {
    if (!booked) return;
    const tok = randomId('LDY');
    setSlots(prev => prev.map(s => {
      if (s.id === booked.id) return { ...s, available: false, bookedBy: 'You' };
      if (s.bookedBy === 'You') return { ...s, available: true, bookedBy: undefined };
      return s;
    }));
    setToken({ id: tok, slot: booked, date: dates[selectedDate], mode });
    setBooked(null);
  };

  const cancel = () => {
    setSlots(prev => prev.map(s => s.bookedBy === 'You' ? { ...s, available: true, bookedBy: undefined } : s));
    setToken(null);
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Laundry Slots</h1>
        <p className="page-desc">Book washing machine time — token generated on confirmation</p>
      </div>

      {/* Token display */}
      {token && (
        <GlowCard color="var(--green)" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 40 }}>🎫</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Laundry Token</p>
              <p style={{ fontFamily: 'var(--font2)', fontWeight: 800, fontSize: 22, color: 'var(--green)', letterSpacing: '.06em' }}>{token.id}</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                {token.slot.time} · {token.date.sub} · {token.mode === 'paid' ? '💳 Paid' : '🆓 Free'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Show this at laundry room</p>
              <button className="btn btn-ghost btn-sm" onClick={cancel} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>Cancel Slot</button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Mode toggle */}
      <Card className="card-p" style={{ marginBottom: 20 }}>
        <SectionHeader title="Laundry Type" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[{ v: 'free', label: '🆓 Free (College machines)', sub: 'Limited slots · First come first served' },
            { v: 'paid', label: '💳 Paid Booking (₹30/hr)',  sub: 'Priority access · Guaranteed slot' }].map(m => (
            <div key={m.v} onClick={() => setMode(m.v)} style={{
              flex: 1, padding: '12px 14px', borderRadius: 'var(--radius)', cursor: 'pointer',
              border: `1.5px solid ${mode === m.v ? 'var(--accent)' : 'var(--border2)'}`,
              background: mode === m.v ? 'rgba(99,102,241,0.08)' : 'var(--bg3)', transition: 'all .2s',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: mode === m.v ? 'var(--accent2)' : 'var(--text)' }}>{m.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Date picker */}
      <Card className="card-p" style={{ marginBottom: 20 }}>
        <SectionHeader title="Select Date" />
        <div style={{ display: 'flex', gap: 10 }}>
          {dates.map((d, i) => (
            <button key={i} onClick={() => setSelectedDate(i)} style={{
              flex: 1, padding: '12px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
              border: `1.5px solid ${selectedDate === i ? 'var(--accent)' : 'var(--border2)'}`,
              background: selectedDate === i ? 'rgba(99,102,241,0.1)' : 'var(--bg3)',
              textAlign: 'center', transition: 'all .2s',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: selectedDate === i ? 'var(--accent2)' : 'var(--text)' }}>{d.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{d.sub}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Slot grid */}
      <Card className="card-p">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <SectionHeader title="Available Slots" subtitle={`${slots.filter(s => s.available).length} / ${slots.length} free`} />
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)' }}>
            {[['var(--green)','Available'],['var(--accent)','Your Slot'],['var(--border3)','Booked']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{ gap: 8 }}>
          {slots.map(slot => {
            const isYours = slot.bookedBy === 'You';
            const isTaken = !slot.available && !isYours;
            const isAvail = slot.available;
            const isPending = booked?.id === slot.id;
            return (
              <div key={slot.id} onClick={() => isAvail && !token && setBooked(b => b?.id === slot.id ? null : slot)} style={{
                padding: '14px 16px', borderRadius: 'var(--radius)', transition: 'all .2s', cursor: isAvail && !token ? 'pointer' : 'default',
                border: `1.5px solid ${isYours ? 'var(--accent)' : isPending ? 'var(--green)' : isAvail ? 'var(--border2)' : 'var(--border)'}`,
                background: isYours ? 'rgba(99,102,241,0.1)' : isPending ? 'rgba(16,185,129,0.08)' : isAvail ? 'var(--bg3)' : 'var(--bg)',
                opacity: isTaken ? 0.45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
                onMouseEnter={e => { if (isAvail && !token) { e.currentTarget.style.borderColor = 'var(--green)'; }}}
                onMouseLeave={e => { if (isAvail && !token && !isPending) e.currentTarget.style.borderColor = 'var(--border2)'; }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isYours ? 'var(--accent2)' : isPending ? 'var(--green)' : 'var(--text)' }}>{slot.time}</p>
                  <p style={{ fontSize: 11, marginTop: 1, color: 'var(--text3)' }}>
                    {isYours ? '✓ Your slot' : isTaken ? `Booked by ${slot.bookedBy}` : isPending ? 'Selected — tap Confirm' : 'Tap to select'}
                  </p>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isYours ? 'var(--accent)' : isPending ? 'var(--green)' : isAvail ? 'var(--green)' : 'var(--border3)' }} />
              </div>
            );
          })}
        </div>

        {/* Confirm bar */}
        {booked && (
          <div className="animate-fadeUp" style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>Confirm: {booked.time}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>{dates[selectedDate].sub} · {mode === 'paid' ? '₹30 charged' : 'Free slot'}</p>
            </div>
            <button className="btn btn-success btn-sm" onClick={confirm}>✓ Confirm &amp; Get Token</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setBooked(null)}>Cancel</button>
          </div>
        )}
      </Card>
    </div>
  );
}
