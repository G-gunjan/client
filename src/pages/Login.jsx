
/**
 * Login and Registration Component
 * Provides user authentication for the PlaceReady platform, allowing
 * users to sign in or create an account. Validates form inputs, handles
 * authentication errors and loading states, and redirects users to the
 * dashboard after successful login or registration.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      mode === 'login' ? await login(f.email, f.password) : await register(f.name, f.email, f.password);
      nav('/dashboard');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <div className="brand">
        <div className="logo">Place<span>Ready</span></div>
        <h1>Aptitude. Code. Interview.<br /><em>Then know where you stand.</em></h1>
        <div className="mono muted">AI-Driven Placement Preparation &amp; Mock Interview Platform</div>
      </div>
      <div className="form">
        <form onSubmit={submit}>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          {mode === 'register' && <><label>Name</label><input value={f.name} onChange={set('name')} required /></>}
          <label>Email</label><input type="email" value={f.email} onChange={set('email')} required />
          <label>Password</label><input type="password" value={f.password} onChange={set('password')} required minLength={6} />
          {err && <div className="error">{err}</div>}
          <button className="btn" style={{ width: '100%', marginTop: '1.2rem' }} disabled={busy}>{mode === 'login' ? 'Sign in' : 'Sign up'}</button>
          <p className="muted" style={{ marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Sign up' : 'Have an account? Sign in'}
          </p>
        </form>
      </div>
    </div>
  );
}
