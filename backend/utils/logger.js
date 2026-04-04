const ts = () => new Date().toISOString();

export const log = {
  info: (msg, meta) => console.log(`[${ts()}] INFO `, msg, meta ?? ''),
  warn: (msg, meta) => console.warn(`[${ts()}] WARN `, msg, meta ?? ''),
  error: (msg, err) => console.error(`[${ts()}] ERROR`, msg, err?.message || err),
};
