import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk, registerThunk, clearError } from "../store/slices/authSlice";
import { AppDispatch, RootState } from '../store';


const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#0A0E17',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', sans-serif", padding: '24px',
  },
  card: {
    background: '#111827', border: '1px solid #1F2D45',
    borderRadius: '16px', padding: '48px', width: '100%', maxWidth: '420px',
  },
  logo: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem',
    fontWeight: 800, color: '#E6EDF3', marginBottom: '8px', letterSpacing: '-0.03em',
  },
  logoSpan: { color: '#F0A500' },
  subtitle: { color: '#7D8FA8', fontSize: '0.9rem', marginBottom: '36px' },
  label: { display: 'block', fontSize: '0.8rem', color: '#7D8FA8', marginBottom: '6px', fontWeight: 500 },
  input: {
    width: '100%', background: '#0A0E17', border: '1px solid #1F2D45',
    borderRadius: '8px', padding: '12px 14px', color: '#E6EDF3',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '18px',
    fontFamily: 'inherit',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  btn: {
    width: '100%', background: '#F0A500', color: '#0A0E17',
    border: 'none', borderRadius: '8px', padding: '13px',
    fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '8px',
    fontFamily: 'inherit',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '8px', padding: '12px', color: '#F87171',
    fontSize: '0.85rem', marginBottom: '16px',
  },
  link: { color: '#F0A500', textDecoration: 'none', fontWeight: 600 },
  switchText: { textAlign: 'center' as const, marginTop: '24px', color: '#7D8FA8', fontSize: '0.85rem' },
  demo: {
    background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.2)',
    borderRadius: '8px', padding: '12px 14px', marginBottom: '24px',
    fontSize: '0.78rem', color: '#7D8FA8', lineHeight: 1.7,
  },
  demoTitle: { color: '#58A6FF', fontWeight: 600, marginBottom: '4px', fontSize: '0.8rem' },
  tabs: { display: 'flex', marginBottom: '32px', borderBottom: '1px solid #1F2D45' },
  tab: {
    flex: 1, padding: '10px', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600,
  },
  roleTag: {
    display: 'inline-block', background: 'rgba(240,165,0,0.1)',
    border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px',
    padding: '1px 6px', fontSize: '0.7rem', color: '#F0A500', marginLeft: '6px',
  },
};

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((s: RootState) => s.auth);

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [mode, dispatch]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(loginThunk({ email: form.email, password: form.password }));
    } else {
      dispatch(registerThunk(form));
    }
  };

  const fillDemo = (role: 'admin' | 'user') => {
    setForm((f) => ({
      ...f,
      email: role === 'admin' ? 'praveenkadev@gmail.com' : 'praveenamballa329@gmail.com',
      password: role === 'admin' ? 'Praveen@1998' : 'Praveen@1998',
    }));
    setMode('login');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Fin<span style={styles.logoSpan}>Vault</span></div>
        <p style={styles.subtitle}>Secure financial transaction platform</p>

        <div style={styles.tabs}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              style={{
                ...styles.tab,
                color: mode === m ? '#F0A500' : '#7D8FA8',
                borderBottom: mode === m ? '2px solid #F0A500' : '2px solid transparent',
              }}
              onClick={() => setMode(m)}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {mode === 'login' && (
          <div style={styles.demo}>
            <div style={styles.demoTitle}>🔐 Demo Credentials</div>
            <div>
              Admin<span style={styles.roleTag}>RBAC</span> ·{' '}
              <button onClick={() => fillDemo('admin')} style={{ background: 'none', border: 'none', color: '#58A6FF', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>
                praveenkadev@gmail.com / Praveen@1998
              </button>
            </div>
            <div>
              User ·{' '}
              <button onClick={() => fillDemo('user')} style={{ background: 'none', border: 'none', color: '#58A6FF', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>
                praveenamballa329@gmail.com / Praveen@1998
              </button>
            </div>
          </div>
        )}

        {error && <div style={styles.error}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={styles.row}>
              <div>
                <label style={styles.label}>First Name</label>
                <input style={styles.input} value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div>
                <label style={styles.label}>Last Name</label>
                <input style={styles.input} value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
          )}
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={form.password} onChange={set('password')} required autoComplete="current-password" />
          <button type="submit" style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', ...styles.link, cursor: 'pointer', fontSize: '0.85rem' }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
