// src/pages/Fees.jsx
import { useEffect, useMemo, useState } from 'react';
import { Card, SectionHeader, StatusBadge, GlowCard, ProgressBar } from '../components/ui';
import { api } from '../api/client';
import { useToast } from '../components/ui';

export default function Fees() {
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const feeSummary = feeData || { total: 0, paid: 0, due: 0, payments: [] };
  const paidPct = feeData ? Math.round((feeData.paid / Math.max(feeData.total, 1)) * 100) : 0;
  const latestPayment = useMemo(() => receipt || feeSummary.payments?.find((p) => p.status === 'paid') || null, [feeSummary.payments, receipt]);

  const downloadReceipt = () => {
    if (!latestPayment) return;
    const body = [
      'HostelOS Fee Receipt',
      `Transaction ID: ${latestPayment.transactionId || 'N/A'}`,
      `Semester: ${latestPayment.semester}`,
      `Amount: ${fmt(latestPayment.amount)}`,
      `Method: ${latestPayment.method || 'N/A'}`,
      `Date: ${latestPayment.date ? new Date(latestPayment.date).toLocaleString('en-IN') : 'N/A'}`,
      `Status: ${latestPayment.status}`,
      '',
      'This is a system-generated receipt for demo/testing purposes.',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostelos-receipt-${latestPayment.transactionId || 'payment'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let active = true;

    const loadFees = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api('/fees/my');
        if (!active) return;
        setFeeData(data?.fees || data || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load fee data');
        toast.error(err.message || 'Failed to load fee data');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFees();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div className="page-header">
        <h1 className="page-title-lg">Hostel Fees</h1>
        <p className="page-desc">Fee status, payment history and due dates</p>
      </div>

      {/* Summary card */}
      <GlowCard color={feeData?.due > 0 ? 'var(--amber)' : 'var(--green)'} style={{ marginBottom: 20 }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--text2)' }}>Loading fee data…</div>
        ) : error ? (
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ gap: 20, marginBottom: 20 }}>
              {[
                { label: 'Total Fee', value: fmt(feeData.total), color: 'var(--text)' },
                { label: 'Amount Paid', value: fmt(feeData.paid), color: 'var(--green)' },
                { label: 'Amount Due', value: fmt(feeData.due), color: feeData.due > 0 ? 'var(--red)' : 'var(--green)' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font2)', color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Payment Progress</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: paidPct >= 80 ? 'var(--green)' : 'var(--amber)' }}>{paidPct}%</span>
              </div>
              <ProgressBar value={paidPct} color={paidPct >= 80 ? 'var(--green)' : 'var(--amber)'} />
            </div>
            {feeData.due > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--red)' }}>
                  ⚠️ {fmt(feeData.due)} due by {new Date(feeData.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <button className="btn btn-primary" onClick={() => { setPaying(true); }}>
                  💳 Pay Now
                </button>
              </div>
            )}
          </>
        )}
      </GlowCard>

      {/* Payment methods */}
      {paying && !paid && (
        <Card className="card-p" style={{ marginBottom: 20, borderColor: 'rgba(99,102,241,0.3)' }}>
          <SectionHeader title="Choose Payment Method" />
          <div className="grid-3" style={{ gap: 10, marginBottom: 16 }}>
            {[
              { label: 'UPI',         icon: '📱', sub: 'GPay, PhonePe, Paytm' },
              { label: 'Net Banking', icon: '🏦', sub: 'All major banks' },
              { label: 'Debit Card',  icon: '💳', sub: 'Visa / Mastercard / RuPay' },
            ].map(m => (
              <div
                key={m.label}
                style={{
                  padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)'; }}
                onClick={async () => {
                  setError('');
                  setPaying(true);
                  const amountToPay = feeData?.due || 0;
                  try {
                    const res = await api('/fees/pay', {
                      method: 'POST',
                      body: JSON.stringify({ amount: amountToPay, method: m.label }),
                    });
                    if (res?.success) {
                      setFeeData(res.fees || res);
                      setPaidAmount(amountToPay);
                      setReceipt(res.payment || null);
                      setPaid(true);
                      toast.success('Payment recorded successfully');
                    } else {
                      setError(res?.message || 'Payment failed');
                      toast.error(res?.message || 'Payment failed');
                    }
                  } catch (err) {
                    setError(err.message || 'Payment failed');
                    toast.error(err.message || 'Payment failed');
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.sub}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            🔒 Secured by 256-bit SSL · Payments are processed via college payment gateway
          </p>
        </Card>
      )}

      {paid && (
        <Card className="card-p" style={{ marginBottom: 20, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Payment Successful!</h3>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '8px 0 4px' }}>{fmt(paidAmount)} paid successfully</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Transaction ID: {latestPayment?.transactionId || `TXN${Date.now().toString().slice(-8)}`}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={downloadReceipt} disabled={!latestPayment}>Download Receipt</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPaid(false); setReceipt(null); }}>Close</button>
          </div>
        </Card>
      )}

      {/* Payment history */}
      <Card className="card-p">
        <SectionHeader title="Payment History" subtitle="All transactions" />
        {(feeSummary.payments || []).length === 0 ? (
          <div style={{ padding: '24px 0 8px', color: 'var(--text3)', fontSize: 13 }}>
            No fee transactions yet. Your payment history will appear here once records are added.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Semester</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feeSummary.payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text3)', fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                    <td>{p.semester}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font2)' }}>{fmt(p.amount)}</td>
                    <td style={{ color: 'var(--text2)' }}>
                      {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{p.method || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
