import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pgPool } from '../config/database';
import { TokenPayload, AuthTokens, User } from '../types';
import { logger } from '../config/logger';

// ── Token generation ──────────────────────────────────────
export const generateTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
};

// ── Auth service ──────────────────────────────────────────
export const authService = {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Check existing user
    const exists = await pgPool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pgPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    const user = mapUser(result.rows[0]);
    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
    await storeRefreshToken(user.id, tokens.refreshToken);

    // Create default checking account
    await pgPool.query(
      `INSERT INTO accounts (user_id, account_number, account_type, balance)
       VALUES ($1, $2, 'checking', 0.00)`,
      [user.id, `FV-${Date.now()}`]
    );

    logger.info(`User registered: ${email}`);
    return { user, tokens };
  },

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const result = await pgPool.query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const row = result.rows[0];
    if (!row.is_active) throw new Error('Account disabled');

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const user = mapUser(row);
    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
    await storeRefreshToken(user.id, tokens.refreshToken);

    logger.info(`User logged in: ${email}`);
    return { user, tokens };
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const stored = await pgPool.query(
      `SELECT id FROM refresh_tokens
       WHERE user_id = $1 AND token = $2 AND expires_at > NOW()`,
      [payload.userId, refreshToken]
    );

    if (stored.rows.length === 0) throw new Error('Invalid refresh token');

    // Rotate: delete old, issue new
    await pgPool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const newTokens = generateTokens({ userId: payload.userId, email: payload.email, role: payload.role });
    await storeRefreshToken(payload.userId, newTokens.refreshToken);

    return newTokens;
  },

  async logout(refreshToken: string): Promise<void> {
    await pgPool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  },
};

// ── Helpers ───────────────────────────────────────────────
async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pgPool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: row.role as 'user' | 'admin',
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
  };
}
