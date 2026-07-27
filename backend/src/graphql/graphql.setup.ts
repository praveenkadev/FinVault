import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Application } from 'express';
import { pgPool } from '../config/database';
import { verifyAccessToken } from '../auth/auth.service';

// ── Type definitions ──────────────────────────────────────
const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: String!
  }

  type Transaction {
    id: ID!
    type: String!
    amount: Float!
    currency: String!
    description: String
    category: String
    status: String!
    referenceId: String
    createdAt: String!
  }

  type Holding {
    id: ID!
    symbol: String!
    name: String!
    quantity: Float!
    avgCost: Float!
    currentPrice: Float!
    currentValue: Float!
    gain: Float!
    gainPct: Float!
  }

  type Portfolio {
    totalBalance: Float!
    totalGain: Float!
    totalGainPct: Float!
    holdings: [Holding!]!
    recentTransactions: [Transaction!]!
  }

  type DashboardStats {
    totalInflow: Float!
    totalOutflow: Float!
    netFlow: Float!
    transactionCount: Int!
    pendingCount: Int!
  }

  type Query {
    me: User
    portfolio(userId: ID!): Portfolio!
    transactions(limit: Int, offset: Int, status: String): [Transaction!]!
    dashboardStats: DashboardStats!
    auditLogs(limit: Int): [AuditLog!]!
  }

  type AuditLog {
    eventId: String!
    eventType: String!
    userId: String!
    transactionId: String!
    amount: Float!
    status: String!
    timestamp: String!
  }

  type Mutation {
    createTransaction(
      accountId: ID!
      type: String!
      amount: Float!
      description: String
      category: String
    ): Transaction!
  }
`;

// ── Resolvers ─────────────────────────────────────────────
const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { userId }: { userId: string }) => {
      if (!userId) throw new Error('Unauthenticated');
      const result = await pgPool.query(
        `SELECT id, email, first_name, last_name, role FROM users WHERE id = $1`,
        [userId]
      );
      const u = result.rows[0];
      return u ? { ...u, firstName: u.first_name, lastName: u.last_name } : null;
    },

    portfolio: async (_: unknown, { userId }: { userId: string }, { userId: ctxUserId }: { userId: string }) => {
      if (!ctxUserId) throw new Error('Unauthenticated');

      const [holdingsRes, txRes, balRes] = await Promise.all([
        pgPool.query(`SELECT * FROM holdings WHERE user_id = $1 ORDER BY symbol`, [userId]),
        pgPool.query(
          `SELECT * FROM transactions WHERE user_id = $1 AND is_deleted = false
           ORDER BY created_at DESC LIMIT 10`,
          [userId]
        ),
        pgPool.query(
          `SELECT SUM(balance) as total FROM accounts WHERE user_id = $1 AND is_active = true`,
          [userId]
        ),
      ]);

      const holdings = holdingsRes.rows.map((h) => ({
        ...h,
        avgCost: parseFloat(h.avg_cost),
        currentPrice: parseFloat(h.current_price),
        currentValue: parseFloat(h.current_price) * parseFloat(h.quantity),
        gain: (parseFloat(h.current_price) - parseFloat(h.avg_cost)) * parseFloat(h.quantity),
        gainPct: ((parseFloat(h.current_price) - parseFloat(h.avg_cost)) / parseFloat(h.avg_cost)) * 100,
      }));

      const totalGain = holdings.reduce((sum, h) => sum + h.gain, 0);
      const totalCost = holdings.reduce((sum, h) => sum + h.avgCost * h.quantity, 0);

      return {
        totalBalance: parseFloat(balRes.rows[0]?.total || '0'),
        totalGain,
        totalGainPct: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
        holdings,
        recentTransactions: txRes.rows.map((t) => ({
          ...t, referenceId: t.reference_id, createdAt: t.created_at,
        })),
      };
    },

    dashboardStats: async (_: unknown, __: unknown, { userId }: { userId: string }) => {
      if (!userId) throw new Error('Unauthenticated');

      const result = await pgPool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_inflow,
           COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_outflow,
           COUNT(*) as transaction_count,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
         FROM transactions WHERE user_id = $1 AND is_deleted = false`,
        [userId]
      );
      const row = result.rows[0];
      const inflow = parseFloat(row.total_inflow);
      const outflow = parseFloat(row.total_outflow);
      return {
        totalInflow: inflow,
        totalOutflow: outflow,
        netFlow: inflow - outflow,
        transactionCount: parseInt(row.transaction_count),
        pendingCount: parseInt(row.pending_count),
      };
    },

    auditLogs: async (_: unknown, { limit = 20 }: { limit?: number }) => {
      const AuditLog = (await import('../models/audit-log.model')).default;
      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
      return logs.map((l) => ({ ...l.toObject(), timestamp: l.timestamp.toISOString() }));
    },
  },

  Mutation: {
    createTransaction: async (
      _: unknown,
      args: { accountId: string; type: string; amount: number; description?: string; category?: string },
      { userId }: { userId: string }
    ) => {
      if (!userId) throw new Error('Unauthenticated');
      const { v4: uuidv4 } = await import('uuid');
      const refId = `REF-GQL-${uuidv4().slice(0, 8).toUpperCase()}`;

      const result = await pgPool.query(
        `INSERT INTO transactions (user_id, account_id, type, amount, description, category, status, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
        [userId, args.accountId, args.type, args.amount, args.description, args.category, refId]
      );
      return { ...result.rows[0], referenceId: result.rows[0].reference_id, createdAt: result.rows[0].created_at };
    },
  },
};

// ── Apollo setup ──────────────────────────────────────────
export const setupGraphQL = async (app: Application): Promise<void> => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return { userId: null };
        try {
          const payload = verifyAccessToken(authHeader.split(' ')[1]);
          return { userId: payload.userId, role: payload.role };
        } catch {
          return { userId: null };
        }
      },
    }) as ReturnType<typeof expressMiddleware>
  );
};
