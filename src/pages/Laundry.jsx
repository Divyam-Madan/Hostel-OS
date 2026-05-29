// src/pages/Laundry.jsx
import { useState, useEffect } from 'react';
import { Card, SectionHeader, GlowCard } from '../components/ui';
import { api } from '../api/client';
import { subscribeRealtimeEvent } from '../realtime/socket';
import { useRef } from 'react';

export default function Laundry() {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(0);
  const [booked, setBooked] = useState(null);
  const [token, setToken] = useState(null);
  const [mode, setMode] = useState('free'); // 'free' | 'paid'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dates = [
    { label: 'Today',     sub: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
    { label: 'Tomorrow',  sub: new Date(Date.now()+86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
    { label: 'Day After', sub: new Date(Date.now()+172800000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
  ];

  // Book a slot via backend API
  const confirm = async () => {
    if (!booked) return;
    try {
      setLoading(true);
      setError(null);
      const date = new Date();
      date.setDate(date.getDate() + selectedDate);
      
      const response = await api('/laundry/book', {
        method: 'POST',
        body: JSON.stringify({
          slotId: booked.id,
          mode,
          bookingDate: date.toISOString().split('T')[0],
        }),
      });

      setToken(response.booking);
      setBooked(null);
      // Refresh slots after successful booking
      const dateStr = date.toISOString().split('T')[0];
      const slotsRes = await api(`/laundry/slots?date=${dateStr}&mode=${mode}`);
      setSlots(slotsRes.slots || []);
    } catch (err) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking via backend API
  const cancel = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      await api(`/laundry/bookings/${token.id}`, { method: 'DELETE' });
      setToken(null);
      // Refresh slots after cancellation
      const date = new Date();
      date.setDate(date.getDate() + selectedDate);
      const dateStr = date.toISOString().split('T')[0];
      const slotsRes = await api(`/laundry/slots?date=${dateStr}&mode=${mode}`);
      setSlots(slotsRes.slots || []);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots from backend
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const date = new Date();
        date.setDate(date.getDate() + selectedDate);
        const dateStr = date.toISOString().split('T')[0];
        
        const response = await api(`/laundry/slots?date=${dateStr}&mode=${mode}`);
        setSlots(response.slots || []);
        setBooked(null); // Reset selection on date change
      } catch (err) {
        setError(err.message || 'Failed to load slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, mode]);

  // Keep refs of latest selectedDate/mode so socket handler can access current values
  const latestSelectedDate = useRef(selectedDate);
  const latestMode = useRef(mode);
  useEffect(() => { latestSelectedDate.current = selectedDate; }, [selectedDate]);
  useEffect(() => { latestMode.current = mode; }, [mode]);

  // Subscribe to realtime laundry updates (avoid duplicates, cleanup on unmount)
  useEffect(() => {
    const off = subscribeRealtimeEvent('laundry:update', async (payload) => {
      try {
        // Always refresh current visible date when any relevant change occurs
        const date = new Date();
        date.setDate(date.getDate() + (latestSelectedDate.current || 0));
        const dateStr = date.toISOString().split('T')[0];
        const m = latestMode.current || mode;
        const slotsRes = await api(`/laundry/slots?date=${dateStr}&mode=${m}`);
        setSlots(slotsRes.slots || []);
      } catch (err) {
        // ignore transient socket-triggered fetch errors
        console.warn('Failed to refresh laundry slots on socket event', err);
      }
    });

    return () => off();
    // Intentionally run only once on mount/unmount to avoid duplicate listeners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Laundry Slots</h1>
        <p className="page-desc">Book washing machine time — token generated on confirmation</p>
      </div>

      {/* Error display */}
      {error && (
        <GlowCard color="var(--red)" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Error</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{error}</p>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Token display */}
      {token && (
        <GlowCard color="var(--green)" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 40 }}>🎫</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Laundry Token</p>
              <p style={{ fontFamily: 'var(--font2)', fontWeight: 800, fontSize: 22, color: 'var(--green)', letterSpacing: '.06em' }}>{token.tokenId}</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                {token.timeStart} – {token.timeEnd} · {dates[selectedDate].sub} · {token.mode === 'paid' ? '💳 Paid' : '🆓 Free'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Show this at laundry room</p>
              <button className="btn btn-ghost btn-sm" onClick={cancel} disabled={loading} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>Cancel Slot</button>
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
          <SectionHeader title="Available Slots" subtitle={loading ? '...' : `${slots.filter(s => !s.isBooked).length} / ${slots.length} free`} />
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)' }}>
            {[['var(--green)','Available'],['var(--accent)','Your Slot'],['var(--border3)','Booked']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{ gap: 8 }}>
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 'var(--radius)',
                background: 'var(--bg3)', border: '1.5px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: 0.5
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, height: 16, background: 'var(--border)', borderRadius: 4, width: 80 }} />
                  <p style={{ fontSize: 11, marginTop: 6, height: 12, background: 'var(--border)', borderRadius: 3, width: 100 }} />
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
              </div>
            ))
          ) : (
            slots.map(slot => {
              const isYours = slot.isUserBooked;
              const isTaken = slot.isBooked && !isYours;
              const isAvail = !slot.isBooked;
              const isPending = booked?.id === slot.id;
              const timeDisplay = `${slot.timeStart} – ${slot.timeEnd}`;
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
                    <p style={{ fontSize: 13, fontWeight: 700, color: isYours ? 'var(--accent2)' : isPending ? 'var(--green)' : 'var(--text)' }}>{timeDisplay}</p>
                    <p style={{ fontSize: 11, marginTop: 1, color: 'var(--text3)' }}>
                      {isYours ? '✓ Your slot' : isTaken ? `Booked` : isPending ? 'Selected — tap Confirm' : 'Tap to select'}
                    </p>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isYours ? 'var(--accent)' : isPending ? 'var(--green)' : isAvail ? 'var(--green)' : 'var(--border3)' }} />
                </div>
              );
            })
          )}
        </div>

        {/* Confirm bar */}
        {booked && (
          <div className="animate-fadeUp" style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>Confirm: {booked.timeStart} – {booked.timeEnd}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>{dates[selectedDate].sub} · {mode === 'paid' ? '₹30 charged' : 'Free slot'}</p>
            </div>
            <button className="btn btn-success btn-sm" onClick={confirm} disabled={loading}>✓ Confirm &amp; Get Token</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setBooked(null)} disabled={loading}>Cancel</button>
          </div>
        )}
      </Card>
    </div>
  );
}
