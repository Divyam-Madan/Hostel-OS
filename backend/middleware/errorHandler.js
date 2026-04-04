import { log } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Central error handler: consistent JSON and safe messages in production.
 */
export function errorHandler(err, req, res, _next) {
  log.error('Request error', err);

  const status = err.statusCode || err.status || 500;
  const message =
    status === 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  res.status(status).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack.split('\n').slice(0, 5) } : {}),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.path}` });
}
