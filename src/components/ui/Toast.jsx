import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const timersRef = useRef(new Map());
  const hoverRef = useRef(new Map());
  const dedupeRef = useRef(new Map());

  const cleanupToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    hoverRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const scheduleRemoval = useCallback((id, duration = 4500) => {
    const timer = setTimeout(() => {
      if (hoverRef.current.get(id)) {
        scheduleRemoval(id, 1000);
        return;
      }
      cleanupToast(id);
    }, duration);
    timersRef.current.set(id, timer);
  }, [cleanupToast]);

  const push = useCallback((t) => {
    const message = String(t.message || '');
    const variant = String(t.variant || 'info');
    const dedupeKey = `${variant}:${message}`;
    const now = Date.now();
    const lastShown = dedupeRef.current.get(dedupeKey) || 0;
    if (now - lastShown < 3000) {
      return null;
    }
    dedupeRef.current.set(dedupeKey, now);

    const id = `${now}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => {
      const next = [...current, { id, ...t }].slice(-3);
      return next;
    });
    if (t.duration !== 0) scheduleRemoval(id, t.duration || 4500);
    return id;
  }, [scheduleRemoval]);

  const remove = useCallback((id) => cleanupToast(id), [cleanupToast]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const confirm = useCallback(({ title, message, confirmText = 'Yes', cancelText = 'Cancel' }) => {
    return new Promise((resolve) => {
      setConfirmState({ title, message, confirmText, cancelText, resolve });
    });
  }, []);

  const value = { push, remove, confirm };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            onMouseEnter={() => {
              hoverRef.current.set(t.id, true);
            }}
            onMouseLeave={() => {
              hoverRef.current.delete(t.id);
            }}
            style={{ minWidth: 280, maxWidth: 360, pointerEvents: 'auto', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 16%), var(--bg2)', color: 'var(--text)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border2)', boxShadow: '0 16px 30px rgba(0,0,0,0.20)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, backdropFilter: 'blur(10px)', animation: 'toastIn 180ms ease-out' }}
          >
            <div style={{ fontSize: 13, lineHeight: 1.45, flex: 1, color: 'var(--text)' }}>{t.message}</div>
            <button onClick={() => remove(t.id)} aria-label="Dismiss notification" style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,18,15,0.44)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 18%), var(--bg2)', padding: 20, borderRadius: 14, width: 420, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border2)' }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>{confirmState.title || 'Confirm'}</h3>
            <p style={{ marginTop: 0, marginBottom: 16, color: 'var(--text2)' }}>{confirmState.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => { confirmState.resolve(false); setConfirmState(null); }}>{confirmState.cancelText}</button>
              <button className="btn btn-primary" onClick={() => { confirmState.resolve(true); setConfirmState(null); }}>{confirmState.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  const show = useCallback((variant, msg, opts) => ctx.push({ variant, message: msg, ...opts }), [ctx]);
  return {
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
    confirm: (opts) => ctx.confirm(opts),
  };
}

export default ToastProvider;
