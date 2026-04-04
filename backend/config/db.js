import mongoose from 'mongoose';
import { env } from './env.js';
import { log } from '../utils/logger.js';

/**
 * Connects to MongoDB once; reuses connection in dev with --watch.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  log.info('Connecting to MongoDB…');
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15_000,
  });
  log.info(`MongoDB connected: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
}
