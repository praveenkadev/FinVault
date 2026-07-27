import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0A0E17', fontFamily: "'Inter', sans-serif", color: '#E6EDF3' },
  nav: {
    background: 'rgba(10,14,23,0.95)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1F2D45', padding: '0 40px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '60px', position: 'sticky' as const, top: 0, zIndex: 50,
  },
  logo: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em', cursor: 'pointer' },
  logoSpan: { color: '#F0A500' },
  navLinks: { display: 'flex', gap: '8px' },
  navBtn: {
    background: 'transparent', border: '1px solid #1F2D45', color: '#7D8FA8',
    padding: '7px 18px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
  },
  navBtnActive: {
    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)',
    color: '#F0A500', padding: '7px 18px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '0.82rem', fontFamily: 'inherit',
  },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '60px 32px' },
  hero: { textAlign: 'center' as const, marginBottom: '80px' },
  eyebrow: {
    display: 'inline-block', background: 'rgba(240,165,0,0.1)',
    border: '1px solid rgba(240,165,0,0.25)', color: '#F0A500',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
    letterSpacing: '0.12em', padding: '6px 16px', borderRadius: '100px',
    marginBottom: '24px', textTransform: 'uppercase' as const,
  },
  heroTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
    marginBottom: '16px',
  },
  heroSub: { color: '#7D8FA8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7 },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem',
    fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px',
  },
  sectionSub: { color: '#7D8FA8', fontSize: '0.9rem', marginBottom: '36px' },
  divider: { borderTop: '1px solid #1F2D45', margin: '72px 0' },

  // Tech Stack Grid
  stackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' },
  stackCard: {
    background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px',
    padding: '24px', transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'default',
  },
  stackCardHover: {
    background: '#111827', border: '1px solid #F0A500', borderRadius: '12px',
    padding: '24px', transform: 'translateY(-3px)',
  },
  stackHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  stackIcon: {
    width: '42px', height: '42px', borderRadius: '10px',
    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
  },
  stackName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem' },
  stackRole: { fontSize: '0.75rem', color: '#7D8FA8', marginTop: '2px' },
  tagList: { display: 'flex', flexWrap: 'wrap' as const, gap: '7px' },
  tag: {
    background: '#0A0E17', border: '1px solid #1F2D45', borderRadius: '5px',
    padding: '4px 10px', fontSize: '0.7rem', color: '#7D8FA8',
    fontFamily: "'JetBrains Mono', monospace",
  },
  tagBlue: {
    background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)',
    borderRadius: '5px', padding: '4px 10px', fontSize: '0.7rem', color: '#58A6FF',
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Architecture Flow
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', marginBottom: '16px' },
  flowStep: {
    background: '#111827', border: '1px solid #1F2D45', padding: '24px 20px',
    textAlign: 'center' as const, position: 'relative' as const,
  },
  flowIcon: { fontSize: '1.8rem', marginBottom: '12px' },
  flowTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' },
  flowDesc: { fontSize: '0.75rem', color: '#7D8FA8', lineHeight: 1.6 },
  flowArrow: {
    position: 'absolute' as const, right: '-14px', top: '50%', transform: 'translateY(-50%)',
    color: '#F0A500', fontSize: '1.2rem', zIndex: 1, fontWeight: 700,
  },

  // Auth Flow
  authFlow: { background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', overflow: 'hidden' },
  authStep: { display: 'flex', gap: '0', borderBottom: '1px solid #1F2D45' },
  authNum: {
    background: 'rgba(240,165,0,0.08)', borderRight: '1px solid #1F2D45',
    padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.4rem',
    color: '#F0A500', minWidth: '70px',
  },
  authContent: { padding: '20px 24px', flex: 1 },
  authTitle: { fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' },
  authDesc: { fontSize: '0.82rem', color: '#7D8FA8', lineHeight: 1.6 },
  authCode: {
    background: '#0A0E17', border: '1px solid #1F2D45', borderRadius: '6px',
    padding: '8px 14px', marginTop: '10px', fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.72rem', color: '#58A6FF',
  },

  // API Endpoints
  endpointGrid: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  endpoint: {
    background: '#111827', border: '1px solid #1F2D45', borderRadius: '8px',
    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px',
  },
  method: (m: string): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 700,
    padding: '4px 10px', borderRadius: '4px', minWidth: '60px', textAlign: 'center' as const,
    background: m === 'GET' ? 'rgba(52,211,153,0.12)' : m === 'POST' ? 'rgba(88,166,255,0.12)' : m === 'DELETE' ? 'rgba(239,68,68,0.12)' : 'rgba(240,165,0,0.12)',
    color: m === 'GET' ? '#34D399' : m === 'POST' ? '#58A6FF' : m === 'DELETE' ? '#F87171' : '#F0A500',
  }),
  endpointPath: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#E6EDF3', flex: 1 },
  endpointDesc: { fontSize: '0.78rem', color: '#7D8FA8' },
  authBadge: {
    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px',
    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', color: '#F0A500',
  },
  adminBadge: {
    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171',
  },

  // Kafka Flow
  kafkaFlow: {
    background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '32px',
  },
  kafkaRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const },
  kafkaBox: (color: string): React.CSSProperties => ({
    background: `rgba(${color},0.08)`, border: `1px solid rgba(${color},0.25)`,
    borderRadius: '8px', padding: '12px 18px', fontSize: '0.82rem', fontWeight: 600,
    color: `rgb(${color})`, textAlign: 'center' as const, minWidth: '140px',
  }),
  kafkaArrow: { color: '#F0A500', fontSize: '1.1rem', fontWeight: 700 },
  kafkaLabel: { fontSize: '0.7rem', color: '#7D8FA8', fontFamily: "'JetBrains Mono', monospace", marginTop: '4px' },

  // DB section
  dbGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  dbCard: { background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '24px' },
  dbHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  dbIcon: { fontSize: '1.4rem' },
  dbName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem' },
  dbType: { fontSize: '0.75rem', color: '#7D8FA8' },
  dbTable: { fontSize: '0.78rem', color: '#7D8FA8', lineHeight: 1.8 },
  dbTableName: { color: '#58A6FF', fontFamily: "'JetBrains Mono', monospace" },

  // Summary badges
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' },
  summaryCard: {
    background: '#111827', border: '1px solid #1F2D45', borderRadius: '10px',
    padding: '20px', textAlign: 'center' as const,
  },
  summaryNum: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#F0A500', lineHeight: 1 },
  summaryLabel: { fontSize: '0.75rem', color: '#7D8FA8', marginTop: '6px', letterSpacing: '0.04em' },
};

const STACK = [
  {
    icon: '⚛️', name: 'Frontend', role: 'User Interface Layer',
    tags: ['React 18', 'TypeScript', 'Redux Toolkit', 'React Router v6', 'Apollo Client', 'Recharts', 'Vite'],
    desc: 'Single-page application with type-safe components, centralized state management, and real-time chart visualizations.',
  },
  {
    icon: '⚙️', name: 'Backend', role: 'API & Business Logic Layer',
    tags: ['Node.js', 'Express.js', 'TypeScript', 'Joi Validation', 'bcryptjs', 'Helmet', 'Morgan'],
    desc: 'RESTful API server with modular architecture, input validation, rate limiting, and security headers.',
  },
  {
    icon: '🔐', name: 'Authentication', role: 'Security Layer',
    tags: ['JWT Access Tokens', 'JWT Refresh Tokens', 'RBAC', 'httpOnly Cookies', 'bcrypt hashing', 'Token Rotation'],
    desc: 'Dual-token auth system with 15-minute access tokens, 7-day rotating refresh tokens, and role-based access control.',
  },
  {
    icon: '📊', name: 'GraphQL', role: 'Complex Query Layer',
    tags: ['Apollo Server 4', 'Type Definitions', 'Resolvers', 'Context Auth', 'Portfolio Query', 'Dashboard Stats'],
    desc: 'GraphQL API for complex data requirements like portfolio aggregation that would need multiple REST calls.',
  },
  {
    icon: '🐘', name: 'PostgreSQL', role: 'Primary Database',
    tags: ['pg Pool', 'UUID Primary Keys', 'JSONB', 'Indexes', 'Foreign Keys', 'Transactions', 'Neon Cloud'],
    desc: 'ACID-compliant relational database for all structured financial data — users, accounts, transactions, holdings.',
  },
  {
    icon: '🍃', name: 'MongoDB', role: 'Audit Log Database',
    tags: ['Mongoose ODM', 'Schema Validation', 'Atlas Cloud', 'Compound Indexes', 'Audit Logs', 'Event Store'],
    desc: 'Document database for flexible audit log storage — schema-free events that Kafka consumers write asynchronously.',
  },
  {
    icon: '📡', name: 'Apache Kafka', role: 'Event Streaming Layer',
    tags: ['KafkaJS', 'Producer', 'Consumer', 'Topics', 'Event-Driven', 'Fraud Detection', 'Async Processing'],
    desc: 'Message streaming for decoupled event processing — every transaction publishes an event consumed for auditing and fraud checks.',
  },
  {
    icon: '☁️', name: 'Cloud & DevOps', role: 'Infrastructure Layer',
    tags: ['Docker', 'docker-compose', 'Terraform', 'AWS ECS', 'AWS RDS', 'S3 + CloudFront', 'GitHub Actions'],
    desc: 'Containerized deployment with Infrastructure-as-Code for AWS and automated CI/CD from push to production.',
  },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/register', desc: 'Create account, returns JWT tokens', badge: null },
  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate, returns access + refresh token', badge: null },
  { method: 'POST', path: '/api/auth/refresh', desc: 'Rotate refresh token silently', badge: null },
  { method: 'POST', path: '/api/auth/logout', desc: 'Invalidate refresh token', badge: 'auth' },
  { method: 'GET', path: '/api/auth/me', desc: 'Get current user profile', badge: 'auth' },
  { method: 'GET', path: '/api/transactions', desc: 'List transactions (paginated + filtered)', badge: 'auth' },
  { method: 'POST', path: '/api/transactions', desc: 'Create transaction → publishes Kafka event', badge: 'auth' },
  { method: 'GET', path: '/api/transactions/:id', desc: 'Get single transaction detail', badge: 'auth' },
  { method: 'DELETE', path: '/api/transactions/:id', desc: 'Soft delete transaction', badge: 'admin' },
  { method: 'GET', path: '/api/transactions/admin/audit-logs', desc: 'MongoDB audit log viewer', badge: 'admin' },
  { method: 'POST', path: '/graphql', desc: 'portfolio, dashboardStats, auditLogs queries + createTransaction mutation', badge: 'auth' },
];

const AUTH_STEPS = [
  { title: 'User submits credentials', desc: 'Email and password sent via HTTPS POST to /api/auth/login', code: 'POST /api/auth/login  { email, password }' },
  { title: 'Backend validates & hashes', desc: 'Joi validates input format. bcrypt.compare() checks password against the stored hash in PostgreSQL — raw passwords are never stored.', code: 'bcrypt.compare(password, user.password_hash)' },
  { title: 'Two tokens generated', desc: 'Access token (15 min) sent in response body. Refresh token (7 days) sent as httpOnly cookie — JavaScript cannot read it, preventing XSS attacks.', code: 'accessToken → response body\nrefreshToken → httpOnly cookie' },
  { title: 'Redux stores access token', desc: 'Frontend Redux authSlice stores the access token in memory. Every API request attaches it as a Bearer token in the Authorization header.', code: 'Authorization: Bearer <accessToken>' },
  { title: 'Auto token refresh', desc: 'Axios interceptor watches for 401 responses. When the access token expires, it silently calls /auth/refresh, gets a new token, and retries the original request automatically.', code: 'axios interceptor → /auth/refresh → retry original request' },
  { title: 'RBAC on every protected route', desc: 'Every backend route checks the JWT role claim. Admin-only routes return 403 Forbidden for regular users regardless of what the frontend shows.', code: 'requireRole("admin") middleware → 403 if role mismatch' },
];

export const TechPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stack' | 'auth' | 'api' | 'kafka' | 'db'>('stack');
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => navigate('/')}>
          Fin<span style={s.logoSpan}>Vault</span>
          <span style={{ fontSize: '0.7rem', color: '#7D8FA8', fontWeight: 400, marginLeft: '10px', fontFamily: 'Inter' }}>Architecture</span>
        </div>
        <div style={s.navLinks}>
          {isAuthenticated && (
            <button style={s.navBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          )}
          {!isAuthenticated && (
            <button style={s.navBtn} onClick={() => navigate('/login')}>Sign In</button>
          )}
        </div>
      </nav>

      <main style={s.main}>
        {/* HERO */}
        <div style={s.hero}>
          <div style={s.eyebrow}>// Technical Deep Dive</div>
          <h1 style={s.heroTitle}>
            How <span style={{ color: '#F0A500' }}>FinVault</span> Works
          </h1>
          <p style={s.heroSub}>
            A production-grade fintech platform built with 8 technologies across 4 layers —
            from JWT authentication to Kafka event streaming to AWS infrastructure.
          </p>

          {/* Summary stats */}
          <div style={s.summaryGrid}>
            {[
              { num: '8', label: 'Technologies' },
              { num: '4', label: 'System Layers' },
              { num: '11', label: 'API Endpoints' },
              { num: '2', label: 'Databases' },
              { num: '2', label: 'API Styles' },
              { num: 'AWS', label: 'Cloud Ready' },
            ].map(({ num, label }) => (
              <div key={label} style={s.summaryCard}>
                <div style={s.summaryNum}>{num}</div>
                <div style={s.summaryLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' as const }}>
          {([
            { key: 'stack', label: '🧱 Tech Stack' },
            { key: 'auth', label: '🔐 Auth Flow' },
            { key: 'api', label: '🔗 API Endpoints' },
            { key: 'kafka', label: '📡 Kafka Events' },
            { key: 'db', label: '🗄 Databases' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={activeTab === key ? s.navBtnActive : s.navBtn}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TECH STACK TAB */}
        {activeTab === 'stack' && (
          <>
            <div style={s.sectionTitle}>Full Tech Stack</div>
            <p style={s.sectionSub}>Every tool used in this project and exactly why it was chosen</p>

            {/* Architecture layers diagram */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '0.75rem', color: '#7D8FA8', fontFamily: "'JetBrains Mono', monospace", marginBottom: '16px', letterSpacing: '0.08em' }}>// SYSTEM LAYERS</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '3px' }}>
                {[
                  { label: 'PRESENTATION', tech: 'React 18 · TypeScript · Redux · Apollo Client · Recharts', color: '240,165,0' },
                  { label: 'API GATEWAY', tech: 'Express.js · REST Routes · Apollo Server (GraphQL) · Rate Limiter', color: '88,166,255' },
                  { label: 'BUSINESS LOGIC', tech: 'Auth Service · JWT · RBAC · Kafka Producer · Fraud Detection', color: '52,211,153' },
                  { label: 'DATA LAYER', tech: 'PostgreSQL (structured) · MongoDB (audit logs) · Kafka (events)', color: '167,139,250' },
                  { label: 'INFRASTRUCTURE', tech: 'Docker · AWS ECS · RDS · MSK · CloudFront · Terraform · GitHub Actions', color: '244,114,182' },
                ].map(({ label, tech, color }) => (
                  <div key={label} style={{
                    background: `rgba(${color},0.06)`, border: `1px solid rgba(${color},0.2)`,
                    borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '20px',
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: `rgb(${color})`, letterSpacing: '0.1em', minWidth: '140px', fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: '0.82rem', color: '#7D8FA8' }}>{tech}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.stackGrid}>
              {STACK.map((item, i) => (
                <div
                  key={item.name}
                  style={hoveredCard === i ? s.stackCardHover : s.stackCard}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={s.stackHeader}>
                    <div style={s.stackIcon}>{item.icon}</div>
                    <div>
                      <div style={s.stackName}>{item.name}</div>
                      <div style={s.stackRole}>{item.role}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#7D8FA8', lineHeight: 1.65, marginBottom: '16px' }}>{item.desc}</p>
                  <div style={s.tagList}>
                    {item.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* AUTH FLOW TAB */}
        {activeTab === 'auth' && (
          <>
            <div style={s.sectionTitle}>Authentication & Security Flow</div>
            <p style={s.sectionSub}>JWT dual-token system with RBAC — step by step</p>

            <div style={s.authFlow}>
              {AUTH_STEPS.map((step, i) => (
                <div key={i} style={{ ...s.authStep, borderBottom: i < AUTH_STEPS.length - 1 ? '1px solid #1F2D45' : 'none' }}>
                  <div style={s.authNum}>{i + 1}</div>
                  <div style={s.authContent}>
                    <div style={s.authTitle}>{step.title}</div>
                    <div style={s.authDesc}>{step.desc}</div>
                    <div style={s.authCode}>{step.code}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '28px' }}>
              <div style={{ fontSize: '0.75rem', color: '#F0A500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '16px' }}>// RBAC ROLE MATRIX</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {['Action', 'User Role', 'Admin Role'].map(h => (
                      <th key={h} style={{ textAlign: 'left' as const, padding: '10px 16px', borderBottom: '1px solid #1F2D45', color: '#7D8FA8', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['View dashboard & portfolio', '✅', '✅'],
                    ['Create transactions', '✅', '✅'],
                    ['View own transactions', '✅', '✅'],
                    ['Delete any transaction', '❌', '✅'],
                    ['View MongoDB audit logs', '❌', '✅'],
                    ['Access /admin/* endpoints', '❌ → 403', '✅'],
                  ].map(([action, user, admin]) => (
                    <tr key={action as string}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(31,45,69,0.5)', color: '#E6EDF3' }}>{action}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(31,45,69,0.5)' }}>{user}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(31,45,69,0.5)' }}>{admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* API ENDPOINTS TAB */}
        {activeTab === 'api' && (
          <>
            <div style={s.sectionTitle}>API Reference</div>
            <p style={s.sectionSub}>REST + GraphQL endpoints — both styles demonstrated</p>
            <div style={s.endpointGrid}>
              {ENDPOINTS.map((ep, i) => (
                <div key={i} style={s.endpoint}>
                  <span style={s.method(ep.method)}>{ep.method}</span>
                  <span style={s.endpointPath}>{ep.path}</span>
                  <span style={s.endpointDesc}>{ep.desc}</span>
                  {ep.badge === 'auth' && <span style={s.authBadge}>JWT</span>}
                  {ep.badge === 'admin' && <span style={s.adminBadge}>ADMIN</span>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '28px' }}>
              <div style={{ fontSize: '0.75rem', color: '#58A6FF', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '16px' }}>// GRAPHQL QUERY EXAMPLE</div>
              <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#7D8FA8', lineHeight: 1.8, overflowX: 'auto' as const }}>
{`query Portfolio($userId: ID!) {
  portfolio(userId: $userId) {
    totalBalance
    totalGain
    totalGainPct
    holdings {
      symbol
      name
      quantity
      currentValue
      gain
      gainPct
    }
    recentTransactions {
      id
      amount
      type
      status
      createdAt
    }
  }
  dashboardStats {
    totalInflow
    totalOutflow
    netFlow
    transactionCount
  }
}`}
              </pre>
            </div>
          </>
        )}

        {/* KAFKA TAB */}
        {activeTab === 'kafka' && (
          <>
            <div style={s.sectionTitle}>Kafka Event Streaming</div>
            <p style={s.sectionSub}>Async event-driven architecture for audit logging and fraud detection</p>

            <div style={s.kafkaFlow}>
              <div style={{ fontSize: '0.75rem', color: '#F0A500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '28px' }}>// TRANSACTION EVENT FLOW</div>

              {[
                {
                  step: '1. Transaction Created',
                  items: [
                    { box: 'User Action', color: '240,165,0', label: 'POST /api/transactions' },
                    { arrow: true },
                    { box: 'Express Backend', color: '88,166,255', label: 'Validates + writes to PostgreSQL' },
                    { arrow: true },
                    { box: 'Kafka Producer', color: '52,211,153', label: 'publishTransactionEvent()' },
                  ],
                },
                {
                  step: '2. Event Published to Kafka',
                  items: [
                    { box: 'topic: transaction-events', color: '167,139,250', label: 'key: userId, value: JSON event' },
                    { arrow: true },
                    { box: 'Kafka Broker', color: '167,139,250', label: 'Stores + distributes message' },
                  ],
                },
                {
                  step: '3. Consumer Processes Event',
                  items: [
                    { box: 'Kafka Consumer', color: '52,211,153', label: 'groupId: finvault-consumers' },
                    { arrow: true },
                    { box: 'MongoDB Write', color: '88,166,255', label: 'AuditLog.create(event)' },
                    { arrow: true },
                    { box: 'Fraud Check', color: '239,68,68', label: 'amount > $10,000 → flagged' },
                  ],
                },
              ].map(({ step, items }) => (
                <div key={step} style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#7D8FA8', fontFamily: "'JetBrains Mono', monospace", marginBottom: '12px' }}>{step}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                    {items.map((item, i) =>
                      'arrow' in item ? (
                        <div key={i} style={s.kafkaArrow}>→</div>
                      ) : (
                        <div key={i} style={{ textAlign: 'center' as const }}>
                          <div style={s.kafkaBox(item.color)}>{item.box}</div>
                          <div style={s.kafkaLabel}>{item.label}</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #1F2D45', paddingTop: '24px', marginTop: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#F0A500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '12px' }}>// KAFKA EVENT PAYLOAD</div>
                <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#7D8FA8', lineHeight: 1.8 }}>
{`{
  "eventId": "uuid-v4",
  "type": "TRANSACTION_CREATED",
  "payload": {
    "id": "tx-uuid",
    "userId": "user-uuid",
    "amount": 5000.00,
    "type": "credit",
    "status": "pending"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* DATABASES TAB */}
        {activeTab === 'db' && (
          <>
            <div style={s.sectionTitle}>Database Design</div>
            <p style={s.sectionSub}>Two databases chosen intentionally for different workloads</p>

            <div style={s.dbGrid}>
              <div style={s.dbCard}>
                <div style={s.dbHeader}>
                  <div style={s.dbIcon}>🐘</div>
                  <div>
                    <div style={s.dbName}>PostgreSQL</div>
                    <div style={s.dbType}>Relational · ACID · Neon Cloud</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#7D8FA8', lineHeight: 1.65, marginBottom: '20px' }}>
                  Handles all structured financial data that needs relational integrity, foreign keys, and guaranteed consistency. Financial transactions must never be partially written.
                </p>
                <div style={{ fontSize: '0.72rem', color: '#F0A500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: '12px' }}>// TABLES</div>
                <div style={s.dbTable}>
                  {[
                    ['users', 'id, email, password_hash, role, is_active'],
                    ['accounts', 'id, user_id, account_number, balance, type'],
                    ['transactions', 'id, user_id, amount, type, status, category'],
                    ['holdings', 'id, user_id, symbol, quantity, avg_cost'],
                    ['refresh_tokens', 'id, user_id, token, expires_at'],
                  ].map(([table, cols]) => (
                    <div key={table} style={{ marginBottom: '10px' }}>
                      <span style={s.dbTableName}>{table}</span>
                      <div style={{ fontSize: '0.72rem', color: '#4A5568', marginTop: '2px' }}>{cols}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.dbCard}>
                <div style={s.dbHeader}>
                  <div style={s.dbIcon}>🍃</div>
                  <div>
                    <div style={s.dbName}>MongoDB</div>
                    <div style={s.dbType}>Document · Flexible · Atlas Cloud</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#7D8FA8', lineHeight: 1.65, marginBottom: '20px' }}>
                  Stores audit logs written by Kafka consumers. Audit events are schema-flexible, append-only, and never need joins — a perfect fit for document storage.
                </p>
                <div style={{ fontSize: '0.72rem', color: '#58A6FF', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: '12px' }}>// COLLECTIONS</div>
                <div style={s.dbTable}>
                  {[
                    ['audit_logs', 'eventId, eventType, userId, transactionId, amount, status, metadata, timestamp'],
                  ].map(([col, fields]) => (
                    <div key={col} style={{ marginBottom: '10px' }}>
                      <span style={{ ...s.dbTableName, color: '#58A6FF' }}>{col}</span>
                      <div style={{ fontSize: '0.72rem', color: '#4A5568', marginTop: '2px' }}>{fields}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', background: '#0A0E17', borderRadius: '8px', padding: '16px' }}>
                  <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#7D8FA8', lineHeight: 1.8 }}>
{`{
  eventId: "uuid",
  eventType: "TRANSACTION_CREATED",
  userId: "user-uuid",
  amount: 5000,
  status: "completed",
  timestamp: ISODate("2024-01-15")
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', background: '#111827', border: '1px solid #1F2D45', borderRadius: '12px', padding: '28px' }}>
              <div style={{ fontSize: '0.75rem', color: '#F0A500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '16px' }}>// WHY TWO DATABASES?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#34D399', fontWeight: 600, marginBottom: '8px' }}>PostgreSQL is right for...</div>
                  {['Financial data needing ACID guarantees', 'Relational data with foreign keys', 'Complex JOIN queries across tables', 'Consistent balance calculations', 'Structured, well-defined schemas'].map(p => (
                    <div key={p} style={{ color: '#7D8FA8', marginBottom: '6px', fontSize: '0.8rem' }}>▸ {p}</div>
                  ))}
                </div>
                <div>
                  <div style={{ color: '#58A6FF', fontWeight: 600, marginBottom: '8px' }}>MongoDB is right for...</div>
                  {['Append-only audit event logs', 'Schema-flexible event payloads', 'High write throughput from Kafka', 'No need for relational joins', 'Time-series event data'].map(p => (
                    <div key={p} style={{ color: '#7D8FA8', marginBottom: '6px', fontSize: '0.8rem' }}>▸ {p}</div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* FOOTER CTA */}
        <div style={s.divider} />
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>
            Built by <span style={{ color: '#F0A500' }}>Praveen Kumar A</span>
          </div>
          <div style={{ color: '#7D8FA8', fontSize: '0.88rem', marginBottom: '28px' }}>
            Full Stack Developer · React · Node.js · AWS · 5+ years experience
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="mailto:praveenkadev@gmail.com" style={{
              background: '#F0A500', color: '#0A0E17', padding: '12px 28px',
              borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
            }}>✉ praveenkadev@gmail.com</a>
            <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')} style={{
              background: 'transparent', border: '1px solid #1F2D45', color: '#E6EDF3',
              padding: '12px 28px', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit',
            }}>
              {isAuthenticated ? 'Go to Dashboard →' : 'Try the App →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};