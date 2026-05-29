import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { log } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setSocketIO } from './services/socketService.js';
import { initializeEmailDiagnostics } from './services/emailService.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import laundryRoutes from './routes/laundryRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import wellbeingRoutes from './routes/wellbeingRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = env.NODE_ENV !== 'production';
const frontendUrl = env.CLIENT_ORIGIN;
const basePort = Number(env.PORT) || 5000;
const maxPortAttempts = isDev ? 10 : 1;
let activePort = basePort;
let shuttingDown = false;
let started = false;

const corsOrigin =
  env.NODE_ENV === 'development'
    ? true // reflect request origin (5173, 5174, etc.)
    : env.CLIENT_ORIGIN;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});
setSocketIO(io);

io.on('connection', (socket) => {
  log.info('Socket connected', socket.id);
});

function logStartup(port, dbStatus) {
  log.info('Backend ready', {
    port,
    frontendUrl,
    mongo: dbStatus,
    socket: 'connected',
  });
}

async function closeResources() {
  await new Promise((resolve) => io.close(resolve));
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function shutdown(reason, err) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (err) {
    log.error(`Shutdown requested by ${reason}`, err);
  } else {
    log.warn(`Shutdown requested by ${reason}`);
  }

  try {
    await closeResources();
    log.info('Shutdown complete');
  } catch (closeErr) {
    log.error('Error during shutdown', closeErr);
  } finally {
    process.exit(err ? 1 : 0);
  }
}

function handleProcessError(err, context) {
  const code = err?.code;
  if (code === 'ECONNRESET') {
    log.warn(`Connection reset (${context})`, err);
    return;
  }

  if (code === 'EADDRINUSE') {
    log.warn(`Port ${activePort} is already in use`);
    return;
  }

  log.error(`Unhandled ${context}`, err);
  if (context === 'uncaughtException' || context === 'unhandledRejection') {
    void shutdown(context, err);
  }
}

process.on('uncaughtException', (err) => handleProcessError(err, 'uncaughtException'));
process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handleProcessError(err, 'unhandledRejection');
});
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

server.on('clientError', (err, socket) => {
  handleProcessError(err, 'clientError');
  if (socket?.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } else {
    socket?.destroy?.();
  }
});

server.on('error', (err) => {
  if (!started) return;
  handleProcessError(err, 'server');
});

async function listenOnPort() {
  await new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('error', onError);
      reject(err);
    };

    server.once('error', onError);
    server.listen(activePort, () => {
      server.off('error', onError);
      resolve();
    });
  });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

app.get('/api/health', (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.json({ ok: true, service: 'hostel-os-backend', database: dbOk ? 'connected' : 'disconnected' });
});

/** When Mongo failed but ALLOW_NO_DB=true, block data routes so the process still listens. */
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  if (req.method === 'GET' && req.path === '/api/health') return next();
  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Whitelist your IP in MongoDB Atlas Network Access, or set ALLOW_NO_DB=true for UI-only dev.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reviews', foodRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/laundry', laundryRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/wellbeing', wellbeingRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
// debug routes removed

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
  } catch (err) {
    log.error('MongoDB connection failed', err);
    if (env.ALLOW_NO_DB) {
      log.warn('Starting without database (ALLOW_NO_DB=true). Most /api/* routes return 503 until Mongo is reachable.');
    } else {
      process.exit(1);
    }
  }

  await initializeEmailDiagnostics();

  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    try {
      await listenOnPort();
      started = true;
      const db = mongoose.connection.readyState === 1 ? 'connected' : 'unavailable';
      logStartup(activePort, db);
      return;
    } catch (err) {
      if (err?.code === 'EADDRINUSE') {
        if (isDev && activePort < basePort + maxPortAttempts - 1) {
          activePort += 1;
          continue;
        }

        log.error(
          `Port ${activePort} is already in use. Stop the conflicting process or set PORT to a different value${isDev ? ' (development auto-increment limit reached).' : '.'}`,
          err,
        );
        process.exit(1);
      }

      throw err;
    }
  }

  if (!started) {
    log.error(`Unable to bind to a port starting at ${basePort}`);
    process.exit(1);
  }
}

start().catch((err) => {
  log.error('Failed to start server', err);
  process.exit(1);
});
