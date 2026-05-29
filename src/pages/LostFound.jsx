// src/pages/LostFound.jsx
import { useState, useRef, useEffect } from 'react';
import { Card, SectionHeader, Badge, ChipFilter, Modal, Field } from '../components/ui';
import { api } from '../api/client';
import { subscribeRealtimeEvent } from '../realtime/socket';
import { useAuth } from '../hooks/useAuth';

const LOCATIONS = ['Mess Hall', 'Block A', 'Block B', 'Block C', 'Block D', 'Gym', 'Library', 'Sports Complex', 'Laundry Room', 'Study Room', 'Warden Office', 'Main Gate'];
const BACKEND_ORIGIN = import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).startsWith('http')
  ? new URL(import.meta.env.VITE_API_URL).origin
  : window.location.origin.replace(/:\d+$/, ':5000');

export default function LostFound() {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState('all');
  const [postOpen, setPostOpen] = useState(false);
  const [postType, setPostType] = useState('lost');
  const [previewImg, setPreviewImg] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const [brokenImages, setBrokenImages] = useState({});
  const fileRef = useRef();

  const options = [{ value:'all',label:'All' },{ value:'lost',label:'🔴 Lost' },{ value:'found',label:'🟢 Found' }];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeItem = (item) => ({
    ...item,
    id: item.id || item._id?.toString?.() || String(item._id || ''),
    imageUrl: item.imageUrl && item.imageUrl.startsWith('/') ? `${BACKEND_ORIGIN}${item.imageUrl}` : item.imageUrl,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api('/lostfound')
      .then(res => {
        if (!mounted) return;
        setItems((res.items || []).map(normalizeItem));
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message || 'Failed to load items');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const off = subscribeRealtimeEvent('lostfound:update', () => {
      setLoading(true);
      api('/lostfound').then(r => setItems((r.items || []).map(normalizeItem))).catch(e => setError(e.message || 'Failed to load')).finally(() => setLoading(false));
    });
    return () => off();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setPreviewImg(ev.target.result);
    reader.readAsDataURL(f);
  };

  return (
    <div style={{ padding: 24 }} className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title-lg">Lost & Found</h1>
          <p className="page-desc">Report lost items or claim found ones — with photo & location</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={() => { setPostType('lost'); setSubmitted(false); setPreviewImg(null); setPostOpen(true); }}>Report Lost</button>
          <button className="btn btn-success btn-sm" onClick={() => { setPostType('found'); setSubmitted(false); setPreviewImg(null); setPostOpen(true); }}>Report Found</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChipFilter options={options} value={filter} onChange={setFilter} />
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtered.length} items</span>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {notice && (
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: notice.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${notice.type === 'success' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}`, color: notice.type === 'success' ? 'var(--green)' : 'var(--amber)', fontSize: 13 }}>
          {notice.msg}
        </div>
      )}

      {error ? (
        <div style={{ padding: 18, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--red)', fontWeight: 700 }}>Failed to load Lost & Found items</div>
            <div>
              <button className="btn btn-sm" onClick={() => { setLoading(true); setError(''); api('/lostfound').then(r=>setItems(r.items||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false)); }}>Retry</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 14 }}>
          {loading ? (
            // show 6 skeleton cards while loading
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', paddingBottom: 6 }}>
                <div style={{ height: 80, background: 'linear-gradient(90deg, var(--bg3), var(--bg2))' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 12, width: '60%', background: 'var(--bg3)', marginBottom: 8 }} />
                  <div style={{ height: 10, width: '90%', background: 'var(--bg3)', marginBottom: 6 }} />
                  <div style={{ height: 10, width: '40%', background: 'var(--bg3)', marginTop: 10 }} />
                </div>
              </div>
            ))
          ) : (
            filtered.map(item => (
          <div key={item.id} style={{
            background: 'var(--bg2)', border: `1px solid ${item.type === 'lost' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
            borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.type === 'lost' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', position: 'relative' }}>
              {item.imageUrl && !brokenImages[item.id] ? (
                <button
                  type="button"
                  onClick={() => setExpandedItem(item)}
                  style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'zoom-in', position: 'relative' }}
                >
                  {!loadedImages[item.id] && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', backdropFilter: 'blur(8px)' }} />
                  )}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [item.id]: true }))}
                    onError={(e) => {
                      setLoadedImages((prev) => ({ ...prev, [item.id]: true }));
                      setBrokenImages((prev) => ({ ...prev, [item.id]: true }));
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(255,255,255,0.03)', padding: 8 }}
                  />
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text3)' }}>
                  <span style={{ fontSize: 44 }}>{item.emoji}</span>
                  <span style={{ fontSize: 12 }}>Image unavailable</span>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <Badge variant={item.type === 'lost' ? 'red' : 'green'}>{item.type}</Badge>
                {item.status === 'claimed' && <Badge variant="teal">Claimed</Badge>}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.4 }}>{item.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>📍 {item.location}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.date}</span>
              </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>By: {item.postedBy}</span>
                {item.status === 'open' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {item.type === 'found' ? (
                      <button className="btn btn-ghost btn-xs" onClick={async () => {
                        // claim the found item
                        try {
                          const res = await api(`/lostfound/${item.id}/claim`, { method: 'PATCH', body: JSON.stringify({ claimedBy: 'Student' }) });
                          setItems(prev => prev.map(p => p.id === item.id ? (res.item || p) : p));
                        } catch (e) {
                          setNotice({ type: 'error', msg: e.message || 'Failed to claim' });
                        }
                      }}>Claim</button>
                    ) : (
                      <button className="btn btn-ghost btn-xs" onClick={() => {
                        // contact poster; if contact looks like email, open mailto
                        const contact = item.postedBy || '';
                        if (/@/.test(contact)) window.open(`mailto:${contact}`);
                        else setNotice({ type: 'success', msg: `Contact: ${contact || 'Not provided'}` });
                      }}>Contact</button>
                    )}
                    {(role === 'admin' || (user?.username && String(item.postedBy || '').toLowerCase().includes(String(user.username).toLowerCase())) || (user?.email && String(item.postedBy || '').toLowerCase().includes(String(user.email).toLowerCase()))) && (
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={async () => {
                        if (!window.confirm('Delete this item?')) return;
                        try {
                          await api(`/lostfound/${item.id}`, { method: 'DELETE' });
                          setItems(prev => prev.filter(p => p.id !== item.id));
                        } catch (e) {
                          setNotice({ type: 'error', msg: e.message || 'Failed to delete' });
                        }
                      }}>Delete</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
            ))
          )}
        </div>
      )}

      {/* Post Modal with image upload + location tag */}
      <Modal open={postOpen} onClose={() => setPostOpen(false)} title={`Report ${postType === 'lost' ? '🔴 Lost' : '🟢 Found'} Item`} width={500}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{postType === 'lost' ? '📢' : '✅'}</div>
            <h3 style={{ fontFamily: 'var(--font2)', fontWeight: 700 }}>Report Submitted!</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '8px 0 16px' }}>Posted to the Lost & Found board. Other students will be notified.</p>
            <button className="btn btn-primary" onClick={() => setPostOpen(false)}>Close</button>
          </div>
        ) : (
          <div>
            {/* Image upload */}
            <div style={{ marginBottom: 14 }}>
              <label className="label">Photo (optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--border2)', borderRadius: 'var(--radius)', padding: 16,
                  textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                  background: previewImg ? 'transparent' : 'var(--bg3)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              >
                {previewImg ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={previewImg} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8 }} />
                    <button onClick={e => { e.stopPropagation(); setPreviewImg(null); }} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>Click to upload image</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>

            <Field label="Item Name"><input className="input" placeholder="e.g. Black JBL Earphones" value={title} onChange={e=>setTitle(e.target.value)} /></Field>
            <Field label="Description"><textarea className="input" rows={2} placeholder="Describe the item…" style={{ resize: 'none' }} value={desc} onChange={e=>setDesc(e.target.value)} /></Field>

            {/* Location tag */}
            <div style={{ marginBottom: 14 }}>
              <label className="label">📍 Location Tag</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LOCATIONS.map(loc => (
                  <span key={loc} className={`chip ${selectedLoc === loc ? 'active-accent' : ''}`} onClick={() => setSelectedLoc(l => l === loc ? '' : loc)}>{loc}</span>
                ))}
              </div>
            </div>

            <Field label="Your Contact (email/phone)"><input className="input" placeholder="arjun.sharma@college.edu" value={contact} onChange={e=>setContact(e.target.value)} /></Field>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" disabled={submitting} onClick={async () => {
                // submit report with optional image
                if (!title) return setNotice({ type: 'error', msg: 'Please enter an item name' });
                setSubmitting(true);
                try {
                  const fd = new FormData();
                  fd.append('type', postType);
                  fd.append('title', title);
                  fd.append('desc', desc);
                  fd.append('location', selectedLoc);
                  fd.append('postedBy', contact || 'Anonymous');
                  if (fileRef.current?.files && fileRef.current.files[0]) fd.append('image', fileRef.current.files[0]);
                  const res = await api('/lostfound', { method: 'POST', body: fd });
                  if (res && res.item) {
                    setItems(s => [res.item, ...s]);
                  }
                  setSubmitted(true);
                  setNotice({ type: 'success', msg: 'Lost & Found report submitted' });
                  setTitle(''); setDesc(''); setContact(''); setPreviewImg(null); if (fileRef.current) fileRef.current.value = '';
                } catch (err) {
                  setNotice({ type: 'error', msg: err.message || 'Failed to submit' });
                } finally {
                  setSubmitting(false);
                }
              }}>{submitting ? 'Submitting…' : 'Submit Report'}</button>
              <button className="btn btn-ghost" onClick={() => setPostOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!expandedItem} onClose={() => setExpandedItem(null)} title={expandedItem?.title || 'Image preview'} width={720}>
        {expandedItem?.imageUrl ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ width: '100%', minHeight: 320, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
              <img
                src={expandedItem.imageUrl}
                alt={expandedItem.title}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: 'var(--text2)', fontSize: 13 }}>
              <span><strong style={{ color: 'var(--text)' }}>Location:</strong> {expandedItem.location || 'Unknown'}</span>
              <span><strong style={{ color: 'var(--text)' }}>By:</strong> {expandedItem.postedBy || 'Anonymous'}</span>
              <span><strong style={{ color: 'var(--text)' }}>Type:</strong> {expandedItem.type}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
