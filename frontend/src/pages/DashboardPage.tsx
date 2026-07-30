import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, gql } from '@apollo/client';
import { RootState, AppDispatch } from '../store';
import { fetchTransactions, createTransaction } from '../store/slices/transactionsSlice';
import { logoutThunk } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { store } from '../store';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PORTFOLIO_QUERY = gql`
  query Portfolio($userId: ID!) {
    portfolio(userId: $userId) {
      totalBalance totalGain totalGainPct
      holdings { symbol name quantity avgCost currentPrice currentValue gain gainPct }
      recentTransactions { id type amount status description createdAt }
    }
    dashboardStats {
      totalInflow totalOutflow netFlow transactionCount pendingCount
    }
  }
`;

const fmt = (n: number, currency = true) =>
  currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    : n.toFixed(2);

const PIE_COLORS = ['#F0A500', '#58A6FF', '#34D399', '#F472B6', '#A78BFA'];

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0A0E17', fontFamily: "'Inter', sans-serif", color: '#E6EDF3' },
  nav: {
    background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1F2D45', padding: '0 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '60px', position: 'sticky' as const, top: 0, zIndex: 50,
  },
  logo: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' },
  logoSpan: { color: '#F0A500' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px',  }, 
  navBtn: { background: 'transparent', border: '1px solid #1F2D45', color: '#7D8FA8',
    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem',
    fontFamily: 'inherit',},
  roleBadge: {
    background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)',
    color: '#F0A500', fontSize: '0.7rem', padding: '3px 10px',
    borderRadius: '100px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  },
  logoutBtn: {
    background: 'transparent', border: '1px solid #1F2D45', color: '#7D8FA8',
    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem',
    fontFamily: 'inherit',
  },
  main: { padding: '32px', maxWidth: '1280px', margin: '0 auto' },
  greeting: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' },
  sub: { color: '#7D8FA8', fontSize: '0.85rem', marginBottom: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  statCard: {
    background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '22px',
  },
  statLabel: { fontSize: '0.75rem', color: '#7D8FA8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' },
  statValue: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.02em' },
  statSub: { fontSize: '0.75rem', color: '#7D8FA8', marginTop: '4px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' },
  card: { background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '24px' },
  cardTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, fontSize: '0.72rem', color: '#7D8FA8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '8px 0', borderBottom: '1px solid #1F2D45' },
  td: { padding: '12px 0', fontSize: '0.87rem', borderBottom: '1px solid rgba(31,45,69,0.5)' },
  badge: (status: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600,
    background: status === 'completed' ? 'rgba(52,211,153,0.12)' :
      status === 'pending' ? 'rgba(240,165,0,0.12)' :
      status === 'flagged' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)',
    color: status === 'completed' ? '#34D399' :
      status === 'pending' ? '#F0A500' :
      status === 'flagged' ? '#F87171' : '#9CA3AF',
  }),
  txType: (type: string): React.CSSProperties => ({
    color: type === 'credit' ? '#34D399' : type === 'debit' ? '#F87171' : '#58A6FF',
    fontWeight: 600,
  }),
  form: { display: 'grid', gap: '14px' },
  input: {
    background: '#0A0E17', border: '1px solid #1F2D45', borderRadius: '8px',
    padding: '11px 14px', color: '#E6EDF3', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
  },
  select: {
    background: '#0A0E17', border: '1px solid #1F2D45', borderRadius: '8px',
    padding: '11px 14px', color: '#E6EDF3', fontSize: '0.88rem',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
  },
  btn: {
    background: '#F0A500', color: '#0A0E17', border: 'none', borderRadius: '8px',
    padding: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem',
  },
  holdingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(31,45,69,0.5)' },
  symbol: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem' },
  gain: (v: number): React.CSSProperties => ({ color: v >= 0 ? '#34D399' : '#F87171', fontWeight: 600, fontSize: '0.82rem' }),
  techStack: {
    background: 'rgba(88,166,255,0.05)', border: '1px solid rgba(88,166,255,0.15)',
    borderRadius: '12px', padding: '20px', marginTop: '24px',
  },
  techTitle: { fontSize: '0.75rem', color: '#58A6FF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' },
  techTags: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  techTag: {
    background: '#0A0E17', border: '1px solid #1F2D45', borderRadius: '6px',
    padding: '4px 10px', fontSize: '0.72rem', color: '#7D8FA8',
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const { items: txns, isLoading: txLoading } = useSelector((s: any) => s.transactions);
console.log('txns from selector:', txns);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [txForm, setTxForm] = useState({ accountId: '', type: 'credit', amount: '', description: '', category: 'income' });
  const [txMsg, setTxMsg] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);

   useEffect(() => {
    const token = store.getState().auth.accessToken;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/accounts`, {
    headers: { Authorization: `Bearer ${token}` }})
    .then(r => r.json())
    .then(d => { if (d.data) setAccounts(d.data); })
    .catch(() => {});
    }, []);

    
    useEffect(() => {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
    return () => { window.onpopstate = null; };
    }, []);

  const { data, loading } = useQuery(PORTFOLIO_QUERY, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  useEffect(() => {  console.log('Transactions in store:', txns); dispatch(fetchTransactions({ limit: 20 })); }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    window.location.href = '/login';
  };

  const handleTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createTransaction({
      accountId: txForm.accountId,
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      description: txForm.description,
      category: txForm.category,
    }));
    if (createTransaction.fulfilled.match(result)) {
      setTxMsg('✅ Transaction submitted — Kafka event published');
      setTxForm(f => ({ ...f, amount: '', description: '' }));
      setTimeout(() => setTxMsg(''), 4000);
    }
  };

  const portfolio = data?.portfolio;
  const stats = data?.dashboardStats;

  // Chart data from transactions
  const chartData = (txns || []).slice(0, 8).reverse().map((t: any, i: number) => ({
  name: `Tx ${i + 1}`,
  amount: parseFloat(t.amount) || 0,
  type: t.type,
}));

  const pieData = portfolio?.holdings?.map((h: { symbol: string; currentValue: number }) => ({
    name: h.symbol, value: Math.round(h.currentValue),
  })) || [];

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>Fin<span style={s.logoSpan}>Vault</span></div>
        <div style={s.navRight}>
          <span style={{ fontSize: '0.88rem', color: '#7D8FA8' }}>{user?.firstName} {user?.lastName}</span>
          <span style={s.roleBadge}>{user?.role}</span>
          <button style={s.navBtn} onClick={() => navigate('/how-it-works')}>
              How It Works
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <main style={s.main}>
        <h1 style={s.greeting}>Good morning, {user?.firstName} 👋</h1>
        <p style={s.sub}>Here's your portfolio overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

        {/* STATS */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Balance', value: fmt(portfolio?.totalBalance || 0), sub: 'All accounts' },
            { label: 'Net Gain', value: fmt(portfolio?.totalGain || 0), sub: `${(portfolio?.totalGainPct || 0).toFixed(2)}% portfolio` },
            { label: 'Cash Flow', value: fmt(stats?.netFlow || 0), sub: `${stats?.transactionCount || 0} transactions` },
            { label: 'Pending', value: String(stats?.pendingCount || 0), sub: 'Awaiting settlement', currency: false },
          ].map(({ label, value, sub }) => (
            <div key={label} style={s.statCard}>
              <div style={s.statLabel}>{label}</div>
              <div style={s.statValue}>{loading ? '—' : value}</div>
              <div style={s.statSub}>{sub}</div>
            </div>
          ))}
        </div>

        {/* CHART + PIE */}
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Transaction Volume</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F0A500" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F0A500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#7D8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7D8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2D45', borderRadius: 8 }} />
                <Area type="monotone" dataKey="amount" stroke="#F0A500" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>Portfolio Allocation</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: '#7D8FA8' }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2D45', borderRadius: 8 }} formatter={(v: number) => [fmt(v), 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ color: '#7D8FA8', fontSize: '0.85rem', paddingTop: 60, textAlign: 'center' }}>No holdings data</div>}
          </div>
        </div>

        {/* HOLDINGS + NEW TRANSACTION */}
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Holdings</div>
            {portfolio?.holdings?.map((h: { symbol: string; name: string; quantity: number; currentValue: number; gain: number; gainPct: number }) => (
              <div key={h.symbol} style={s.holdingRow}>
                <div>
                  <div style={s.symbol}>{h.symbol}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7D8FA8' }}>{h.name} · {h.quantity} shares</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{fmt(h.currentValue)}</div>
                  <div style={s.gain(h.gain)}>{h.gain >= 0 ? '+' : ''}{fmt(h.gain)} ({h.gainPct.toFixed(1)}%)</div>
                </div>
              </div>
            ))}
            {!portfolio?.holdings?.length && <div style={{ color: '#7D8FA8', fontSize: '0.85rem' }}>No holdings — connect GraphQL to populate.</div>}
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>New Transaction</div>
            <form style={s.form} onSubmit={handleTx}>
              <select style={s.select} value={txForm.accountId} 
                onChange={e => setTxForm(f => ({ ...f, accountId: e.target.value }))} required>
                <option value="">Select account...</option>
                   {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                    {acc.account_number} — {acc.account_type} (${parseFloat(acc.balance).toLocaleString()})
                </option> ))}
              </select>
              <select style={s.select} value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}>
                <option value="credit">Credit (Inflow)</option>
                <option value="debit">Debit (Outflow)</option>
                <option value="transfer">Transfer</option>
              </select>
              <input style={s.input} type="number" placeholder="Amount (USD)" min="0.01" step="0.01"
                value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} required />
              <select style={s.select} value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>
                {['income','housing','food','entertainment','investment','transfer','other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={s.input} placeholder="Description (optional)"
                value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
              <button type="submit" style={s.btn}>Submit Transaction ↗</button>
            </form>
            {txMsg && <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#34D399' }}>{txMsg}</div>}

            {/* Tech stack callout */}
            <div style={s.techStack}>
              <div style={s.techTitle}>// Stack in action</div>
              <div style={s.techTags}>
                {['React + Redux', 'JWT Auth', 'REST POST /transactions', 'Kafka Event', 'MongoDB AuditLog', 'PostgreSQL Write', 'RBAC Guard'].map(t => (
                  <span key={t} style={s.techTag}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div style={s.card}>
          <div style={s.cardTitle}>Transaction History
            {user?.role === 'admin' && <span style={{ ...s.roleBadge, marginLeft: 12 }}>Admin: can soft-delete</span>}
          </div>
          {txLoading ? <div style={{ color: '#7D8FA8' }}>Loading…</div> : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Reference', 'Type', 'Amount', 'Category', 'Description', 'Status', 'Date'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>

                <tbody>
{Array.isArray(txns) && txns.length > 0 ? txns.map((tx: any) => (    <tr key={tx.id}>
      <td style={{ ...s.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#7D8FA8' }}>
        {tx.reference_id || tx.id?.slice(0, 8)}
      </td>
      <td style={{ ...s.td, ...s.txType(tx.type) }}>{tx.type}</td>
      <td style={{ ...s.td, fontWeight: 600 }}>${parseFloat(tx.amount).toLocaleString()}</td>
      <td style={{ ...s.td, color: '#7D8FA8' }}>{tx.category || '—'}</td>
      <td style={{ ...s.td, color: '#7D8FA8' }}>{tx.description || '—'}</td>
      <td style={s.td}><span style={s.badge(tx.status)}>{tx.status}</span></td>
      <td style={{ ...s.td, color: '#7D8FA8', fontSize: '0.78rem' }}>
        {new Date(tx.created_at).toLocaleDateString()}
      </td>
    </tr>
  )) : (
    <tr>
      <td colSpan={7} style={{ ...s.td, color: '#7D8FA8', textAlign: 'center', padding: '32px 0' }}>
        {txLoading ? 'Loading...' : 'No transactions yet. Create one above!'}
      </td>
    </tr>
  )}
</tbody>
              
            </table>
          )}
        </div>
      </main>
    </div>
  );
};
