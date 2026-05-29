import { useMemo } from 'react';

const FOOTER_QUOTES = [
  'Small details are what make software feel human.',
  'Good systems reduce friction, not people.',
  'Technology should feel calm.',
  'Built patiently, improved daily.',
  'Every dashboard hides hundreds of decisions.',
  'A student-built system can still feel premium and humane.',
  'Useful products are quiet about themselves.',
  'Calm interfaces help people make better decisions.',
];

function pickQuote() {
  const index = Math.floor(Math.random() * FOOTER_QUOTES.length);
  return FOOTER_QUOTES[index];
}

export default function GlobalFooter() {
  const quote = useMemo(() => pickQuote(), []);

  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(196,131,83,0.18)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        padding: '16px 24px 18px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 14px',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text2)',
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5, whiteSpace: 'nowrap' }}>“{quote}”</div>
        <span style={separatorStyle}>•</span>
        <div style={{ fontSize: 11.5, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Designed and engineered by Divyam Madan</div>
        <span style={separatorStyle}>•</span>
        <a href="mailto:divyam.madan.6106@gmail.com" style={linkStyle} className="global-footer-link">📧 divyam.madan.6106@gmail.com</a>
        <span style={separatorStyle}>•</span>
        <a href="tel:+918468071875" style={linkStyle} className="global-footer-link">📞 +91 8468071875</a>
        <span style={separatorStyle}>•</span>
        <a href="https://www.linkedin.com/in/divyam-madan/" target="_blank" rel="noreferrer" style={linkStyle} className="global-footer-link">🔗 LinkedIn</a>
        <span style={separatorStyle}>•</span>
        <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>A student-built hostel intelligence system.</div>
      </div>

      <style>{`
        .global-footer-link {
          transition: color 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
        }
        .global-footer-link:hover {
          color: var(--accent2) !important;
          opacity: 0.96;
          transform: translateY(-1px);
        }
        @media (max-width: 900px) {
          footer > div {
            justify-content: flex-start !important;
          }
          footer > div > * {
            white-space: normal !important;
          }
        }
      `}</style>
    </footer>
  );
}

const linkStyle = {
  color: 'var(--text2)',
  textDecoration: 'none',
  fontSize: 11,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginRight: 0,
};

const separatorStyle = {
  color: 'var(--text3)',
  fontSize: 10,
  lineHeight: 1,
  opacity: 0.8,
  userSelect: 'none',
};