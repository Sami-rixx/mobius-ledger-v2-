import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext.jsx';
import { api } from '../../services/api.js';

vi.mock('../../services/api.js', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  setCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
  setUnauthorizedHandler: vi.fn()
}));

function Probe() {
  const { user, loading, isAuthenticated, login, logout, error } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="username">{user ? user.username : ''}</div>
      <div data-testid="error">{error || ''}</div>
      <button onClick={() => login('alice', 'wrong-password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext (frontend session/UX state - not a security boundary)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts as unauthenticated while checking the session, then reflects an existing valid session', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { id: 1, username: 'alice', permissions: ['income.read'] },
      csrfToken: 'tok-123'
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('alice');
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('treats a 401 from /auth/me as logged out rather than erroring', async () => {
    api.get.mockRejectedValue(Object.assign(new Error('Authentication required'), { status: 401 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('');
  });

  it('surfaces a failed login without setting the user as authenticated', async () => {
    api.get.mockRejectedValue(Object.assign(new Error('Authentication required'), { status: 401 }));
    api.post.mockResolvedValue({ success: false, error: 'Invalid username or password' });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await user.click(screen.getByText('Login'));

    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Invalid username or password'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logout() clears the authenticated user even if the server call fails', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { id: 1, username: 'alice', permissions: [] },
      csrfToken: 'tok-123'
    });
    api.post.mockRejectedValue(new Error('network error'));

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));
    await user.click(screen.getByText('Logout'));

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('false'));
  });
});
