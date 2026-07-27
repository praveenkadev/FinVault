export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  accountNumber?: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  referenceId?: string;
  createdAt: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPct: number;
}

export interface Portfolio {
  totalBalance: number;
  totalGain: number;
  totalGainPct: number;
  holdings: Holding[];
  recentTransactions: Transaction[];
}

export interface DashboardStats {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  transactionCount: number;
  pendingCount: number;
}

export interface TransactionsState {
  items: Transaction[];
  pagination: { page: number; limit: number; total: number; pages: number } | null;
  isLoading: boolean;
  error: string | null;
}

export interface PortfolioState {
  data: Portfolio | null;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}
