import React, { useState } from 'react';
import { Card, Button } from '../../components/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * LoginPage - the only route reachable without an authenticated session.
 * Posts credentials to POST /api/auth/login; the server issues an HttpOnly
 * session cookie and a CSRF token on success (see AuthContext.login).
 */
function LoginPage() {
  const { login, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password) {
      setLocalError('Username and password are required');
      return;
    }

    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setLocalError(result.error);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="page login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Mobius Ledger" subtitle="Sign in to continue" className="login-card" style={{ maxWidth: 360, width: '100%' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              disabled={submitting}
            />
          </div>

          {displayedError && (
            <div role="alert" className="form-error" style={{ color: '#c0392b', marginBottom: '1rem' }}>
              {displayedError}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
