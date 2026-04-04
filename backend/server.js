import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { log } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setSocketIO } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const server = http.createServer(app);

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

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

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

  server.listen(env.PORT, () => {
    const db = mongoose.connection.readyState === 1 ? 'MongoDB OK' : 'no DB';
    log.info(`API + Socket.IO on http://localhost:${env.PORT} (${db})`);
  });
}

start().catch((err) => {
  log.error('Failed to start server', err);
  process.exit(1);
});
