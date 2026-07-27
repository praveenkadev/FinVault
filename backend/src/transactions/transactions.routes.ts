import { Router, Response, NextFunction } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { pgPool } from '../config/database';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { publishTransactionEvent } from '../kafka/kafka.service';
import { Transaction } from '../types';

const router = Router();

// All transaction routes require auth
router.use(authMiddleware);

const createSchema = Joi.object({
  accountId: Joi.string().uuid().required(),
  type: Joi.string().valid('credit', 'debit', 'transfer').required(),
  amount: Joi.number().positive().max(1000000).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().max(50).optional(),
});

// ── GET /transactions ─────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status, type, startDate, endDate } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT t.*, a.account_number, a.account_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1 AND t.is_deleted = false
    `;
    const params: unknown[] = [req.user.userId];
    let paramIdx = 2;

    if (status) { query += ` AND t.status = $${paramIdx++}`; params.push(status); }
    if (type) { query += ` AND t.type = $${paramIdx++}`; params.push(type); }
    if (startDate) { query += ` AND t.created_at >= $${paramIdx++}`; params.push(startDate); }
    if (endDate) { query += ` AND t.created_at <= $${paramIdx++}`; params.push(endDate); }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    params.push(parseInt(limit as string), offset);

    const [rows, count] = await Promise.all([
      pgPool.query(query, params),
      pgPool.query(
        `SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND is_deleted = false`,
        [req.user.userId]
      ),
    ]);

    return res.json({
      data: rows.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(count.rows[0].count),
        pages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit as string)),
      },
    });
  } catch (err) { next(err); }
});

// ── POST /transactions ────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Verify account belongs to user
    const account = await pgPool.query(
      `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
      [value.accountId, req.user.userId]
    );
    if (account.rows.length === 0) {
      return res.status(403).json({ error: 'Account not found or access denied' });
    }

    const refId = `REF-${uuidv4().slice(0, 8).toUpperCase()}`;

    const result = await pgPool.query(
      `INSERT INTO transactions
         (user_id, account_id, type, amount, description, category, status, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [req.user.userId, value.accountId, value.type, value.amount,
       value.description, value.category, refId]
    );

    const tx = result.rows[0] as Transaction;

    // Publish to Kafka
    await publishTransactionEvent('TRANSACTION_CREATED', tx);

    // Simulate async completion after 2 seconds
    setTimeout(async () => {
      await pgPool.query(
        `UPDATE transactions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [tx.id]
      );
    }, 2000);

    return res.status(201).json({ data: tx });
  } catch (err) { next(err); }
});

// ── GET /transactions/:id ─────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pgPool.query(
      `SELECT t.*, a.account_number FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2 AND t.is_deleted = false`,
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    return res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /transactions/:id (admin only) ─────────────────
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pgPool.query(
      `UPDATE transactions SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
});

// ── GET /transactions/audit-logs (admin only) ─────────────
router.get('/admin/audit-logs', requireRole('admin'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const AuditLog = (await import('../models/audit-log.model')).default;
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    return res.json({ data: logs });
  } catch (err) { next(err); }
});

export default router;
