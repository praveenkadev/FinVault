-- FinVault PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (bank accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer')),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(500),
  category VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'flagged')),
  reference_id VARCHAR(100) UNIQUE,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(15, 6) NOT NULL,
  avg_cost DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);

-- Seed demo users (passwords: Admin@123 / User@123 — bcrypt hashed)
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@finvault.io',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NJDuMlWWy',
   'Admin', 'User', 'admin'),
  ('00000000-0000-0000-0000-000000000002',
   'user@finvault.io',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Praveen', 'Kumar', 'user')
ON CONFLICT (email) DO NOTHING;

-- Seed accounts
INSERT INTO accounts (id, user_id, account_number, account_type, balance) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'FV-001-2024', 'checking', 24500.00),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'FV-002-2024', 'investment', 87250.00)
ON CONFLICT (account_number) DO NOTHING;

-- Seed transactions
INSERT INTO transactions (user_id, account_id, type, amount, description, category, status, reference_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'credit', 5000.00, 'Salary deposit', 'income', 'completed', 'REF-001'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'debit', 1200.00, 'Rent payment', 'housing', 'completed', 'REF-002'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'credit', 2500.00, 'Stock dividend', 'investment', 'completed', 'REF-003'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'debit', 85.00, 'Netflix subscription', 'entertainment', 'completed', 'REF-004'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'debit', 450.00, 'Grocery - Whole Foods', 'food', 'completed', 'REF-005'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'debit', 3200.00, 'Apple Inc purchase', 'investment', 'pending', 'REF-006')
ON CONFLICT (reference_id) DO NOTHING;

-- Seed holdings
INSERT INTO holdings (user_id, symbol, name, quantity, avg_cost, current_price) VALUES
  ('00000000-0000-0000-0000-000000000002', 'AAPL', 'Apple Inc.', 15.5, 172.50, 189.30),
  ('00000000-0000-0000-0000-000000000002', 'MSFT', 'Microsoft Corp.', 8.0, 310.00, 374.50),
  ('00000000-0000-0000-0000-000000000002', 'GOOGL', 'Alphabet Inc.', 5.0, 125.00, 140.80),
  ('00000000-0000-0000-0000-000000000002', 'AMZN', 'Amazon.com Inc.', 12.0, 128.00, 178.25),
  ('00000000-0000-0000-0000-000000000002', 'NVDA', 'NVIDIA Corp.', 3.0, 430.00, 495.00)
ON CONFLICT (user_id, symbol) DO NOTHING;
