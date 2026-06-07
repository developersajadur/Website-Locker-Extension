import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

const API_BASE = 'https://website-locker-server.vercel.app/api/v1';

interface Site {
  id: string;
  url: string;
  label?: string;
  createdAt: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: string; email: string } | null;
}

// ── Storage helpers ────────────────────────────────────────────────────────
async function getAuth(): Promise<AuthState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'user'], (result) => {
      resolve({
        accessToken: result.accessToken ?? null,
        refreshToken: result.refreshToken ?? null,
        user: result.user ?? null,
      });
    });
  });
}

async function setAuth(auth: Partial<AuthState>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(auth, resolve));
}

async function clearAuth(): Promise<void> {
  return new Promise((resolve) =>
    chrome.storage.local.remove(['accessToken', 'refreshToken', 'user'], resolve),
  );
}

// ── API helpers ────────────────────────────────────────────────────────────
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiCall<{
        success: boolean;
        data: { accessToken: string; refreshToken: string; user: { id: string; email: string } };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setAuth({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.lockIcon}>🔒</div>
        <h1 style={styles.title}>Website Locker</h1>
        <p style={styles.subtitle}>Sign in to manage your locked sites</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <div style={styles.error}>{error}</div>}
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p style={styles.hint}>
        Don't have an account?{' '}
        <a href="https://website-locker.vercel.app/register" target="_blank" rel="noreferrer" style={styles.link}>
          Register in the dashboard
        </a>
      </p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function Dashboard({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSites = async () => {
    try {
      const res = await apiCall<{ success: boolean; data: { sites: Site[] } }>(
        '/sites',
        {},
        auth.accessToken,
      );
      setSites(res.data.sites);
    } catch {
      setError('Failed to load sites');
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleAddCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        const urlObj = new URL(tab.url);
        setNewUrl(urlObj.hostname);
        setNewLabel(tab.title || '');
      } catch {
        setError('Cannot lock this page');
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setLoading(true);
    setError('');
    try {
      await apiCall('/sites', {
        method: 'POST',
        body: JSON.stringify({ url: newUrl, label: newLabel || undefined }),
      }, auth.accessToken);
      setNewUrl('');
      setNewLabel('');
      await loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add site');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiCall(`/sites/${id}`, { method: 'DELETE' }, auth.accessToken);
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to remove site');
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    onLogout();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={styles.lockIcon}>🔒</div>
            <h1 style={styles.title}>Website Locker</h1>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://website-locker.vercel.app' })}
              style={styles.profileBtn}
            >
              Profile
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
        <p style={styles.subtitle}>{auth.user?.email}</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleAdd} style={styles.form}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            type="text"
            placeholder="Domain (e.g. reddit.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <button type="button" onClick={handleAddCurrentTab} style={styles.iconBtn} title="Use current tab">
            📌
          </button>
        </div>
        <input
          style={styles.input}
          type="text"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Adding…' : '+ Lock Site'}
        </button>
      </form>

      <div style={styles.siteList}>
        <h2 style={styles.sectionTitle}>Locked Sites ({sites.length})</h2>
        {sites.length === 0 ? (
          <p style={styles.empty}>No locked sites yet. Add one above!</p>
        ) : (
          sites.map((site) => (
            <div key={site.id} style={styles.siteItem}>
              <div style={styles.siteInfo}>
                <span style={styles.siteDomain}>{site.url}</span>
                {site.label && <span style={styles.siteLabel}>{site.label}</span>}
              </div>
              <button
                onClick={() => handleDelete(site.id)}
                style={styles.deleteBtn}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuth().then((a) => {
      setAuth(a);
      setLoading(false);
    });
  }, []);

  const handleLoginSuccess = () => {
    getAuth().then(setAuth);
  };

  const handleLogout = () => {
    setAuth({ accessToken: null, refreshToken: null, user: null });
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.spinner}>⏳</div>
      </div>
    );
  }

  if (!auth?.accessToken) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return <Dashboard auth={auth} onLogout={handleLogout} />;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '360px',
    minHeight: '480px',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  lockIcon: { fontSize: '28px', marginBottom: '4px' },
  title: { fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' },
  subtitle: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
  form: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  iconBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontSize: '14px',
    flexShrink: 0,
  },
  profileBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(167,139,250,0.3)',
    background: 'rgba(167,139,250,0.15)',
    color: '#a78bfa',
    fontSize: '12px',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  error: {
    margin: '0 16px',
    padding: '8px 12px',
    background: 'rgba(255,80,80,0.15)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: '8px',
    color: '#ff8080',
    fontSize: '13px',
  },
  hint: { padding: '0 16px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  link: { color: '#a78bfa', textDecoration: 'underline' },
  siteList: { flex: 1, padding: '0 16px 16px' },
  sectionTitle: { fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  empty: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px 0' },
  siteItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    marginBottom: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  siteInfo: { display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' },
  siteDomain: { fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  siteLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.5)' },
  deleteBtn: {
    background: 'rgba(255,80,80,0.15)',
    border: '1px solid rgba(255,80,80,0.2)',
    color: '#ff8080',
    borderRadius: '6px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    flexShrink: 0,
  },
  spinner: { fontSize: '32px' },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
