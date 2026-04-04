// src/pages/LostFound.jsx
import { useState, useRef } from 'react';
import { Card, SectionHeader, Badge, ChipFilter, Modal, Field } from '../components/ui';
import { lostFoundItems } from '../data/mockData';

const LOCATIONS = ['Mess Hall', 'Block A', 'Block B', 'Block C', 'Block D', 'Gym', 'Library', 'Sports Complex', 'Laundry Room', 'Study Room', 'Warden Office', 'Main Gate'];

export default function LostFound() {
  const [filter, setFilter] = useState('all');
  const [postOpen, setPostOpen] = useState(false);
  const [postType, setPostType] = useState('lost');
  const [previewImg, setPreviewImg] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef();

  const options = [{ value:'all',label:'All' },{ value:'lost',label:'🔴 Lost' },{ value:'found',label:'🟢 Found' }];
  const filtered = filter === 'all' ? lostFoundItems : lostFoundItems.filter(i => i.type === filter);

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

      <div className="grid-3" style={{ gap: 14 }}>
        {filtered.map(item => (
          <div key={item.id} style={{
            background: 'var(--bg2)', border: `1px solid ${item.type === 'lost' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
            borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: item.type === 'lost' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)' }}>
              {item.emoji}
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
                {item.status === 'open' && <button className="btn btn-ghost btn-xs">{item.type === 'found' ? 'Claim' : 'Contact'}</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

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

            <Field label="Item Name"><input className="input" placeholder="e.g. Black JBL Earphones" /></Field>
            <Field label="Description"><textarea className="input" rows={2} placeholder="Describe the item…" style={{ resize: 'none' }} /></Field>

            {/* Location tag */}
            <div style={{ marginBottom: 14 }}>
              <label className="label">📍 Location Tag</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LOCATIONS.map(loc => (
                  <span key={loc} className={`chip ${selectedLoc === loc ? 'active-accent' : ''}`} onClick={() => setSelectedLoc(l => l === loc ? '' : loc)}>{loc}</span>
                ))}
              </div>
            </div>

            <Field label="Your Contact (email/phone)"><input className="input" placeholder="arjun.sharma@college.edu" /></Field>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={() => setSubmitted(true)}>Submit Report</button>
              <button className="btn btn-ghost" onClick={() => setPostOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
