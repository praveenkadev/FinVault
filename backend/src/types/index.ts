export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface KafkaTransactionEvent {
  eventId: string;
  type: 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'FRAUD_FLAGGED';
  payload: Transaction;
  timestamp: string;
}
