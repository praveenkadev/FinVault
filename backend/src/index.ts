import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectPostgres, connectMongoDB } from './config/database';
import { initKafkaProducer, initKafkaConsumer, disconnectKafka } from './kafka/kafka.service';
import { setupGraphQL } from './graphql/graphql.setup';
import authRoutes from './auth/auth.routes';
import transactionRoutes from './transactions/transactions.routes';
import { logger } from './config/logger';
import { pgPool } from './config/database';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & Parsing ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// ── Rate limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Auth rate limiter (stricter) ──────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });app.use('/api/auth', authLimiter);

// ── REST Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'finvault-backend' });
});


app.get('/api/accounts', authMiddleware as any, async (req: any, res: any) => {
  const result = await pgPool.query(
    'SELECT id, account_number, account_type, balance FROM accounts WHERE user_id = $1',
    [req.user.userId]
  );
  res.json({ data: result.rows });
});

// ── Error handler ─────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ── Bootstrap ─────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await connectPostgres();
    await connectMongoDB();

    // Kafka is optional (may not be available in local dev without Docker)
   // Kafka is optional — don't await, just fire and forget
  initKafkaProducer()
    .then(() => initKafkaConsumer())
    .catch(() => logger.warn('Kafka unavailable — running without event streaming'));

    // GraphQL
    await setupGraphQL(app);

    const server = app.listen(PORT, () => {
      logger.info(`🚀 FinVault backend running on http://localhost:${PORT}`);
      logger.info(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      await disconnectKafka();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

bootstrap();
