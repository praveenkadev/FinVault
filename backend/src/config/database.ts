import { Pool } from 'pg';
import mongoose from 'mongoose';
import { logger } from './logger';

// ── PostgreSQL ────────────────────────────────────────────
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL error', err);
});

export const connectPostgres = async (): Promise<void> => {
  const client = await pgPool.connect();
  await client.query('SELECT NOW()');
  client.release();
  logger.info('✅ PostgreSQL connected');
};

// ── MongoDB ───────────────────────────────────────────────
export const connectMongoDB = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
  });
  logger.info('✅ MongoDB connected');
};

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', err);
});
