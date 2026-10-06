/**
 * API client security contract tests.
 *
 * Locks in the browser-side half of the security model:
 * - session cookie always sent (credentials: 'include'), never handled in JS
 * - X-Requested-With CSRF header on every request
 * - auto-generated Idempotency-Key on POSTs
 * - 401 responses route the user to /login (UX only)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api.js';

describe('ApiClient security contract', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true })
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the session cookie with every request (credentials: include)', async () => {
    const client = new ApiClient('/api');
    await client.get('/income');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, config] = fetchMock.mock.calls[0];
    expect(config.credentials).toBe('include');
  });

  it('attaches the X-Requested-With CSRF header', async () => {
    const client = new ApiClient('/api');
    await client.post('/income', { amount: 1 });
    const [, config] = fetchMock.mock.calls[0];
    expect(config.headers['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('attaches an auto-generated Idempotency-Key to POST requests', async () => {
    const client = new ApiClient('/api');
    await client.post('/income', { amount: 1 });
    const [, config] = fetchMock.mock.calls[0];
    expect(config.headers['Idempotency-Key']).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('does not attach an Idempotency-Key to GET requests', async () => {
    const client = new ApiClient('/api');
    await client.get('/income');
    const [, config] = fetchMock.mock.calls[0];
    expect(config.headers['Idempotency-Key']).toBeUndefined();
  });

  it('preserves a caller-provided Idempotency-Key (stable retries)', async () => {
    const client = new ApiClient('/api');
    await client.post('/income', { amount: 1 }, { headers: { 'Idempotency-Key': 'my-stable-key-123' } });
    const [, config] = fetchMock.mock.calls[0];
    expect(config.headers['Idempotency-Key']).toBe('my-stable-key-123');
  });

  it('redirects to /login on 401 for non-auth endpoints', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, message: 'Authentication required' })
    });
    const assignSpy = vi.fn();
    vi.stubGlobal('window', {
      ...globalThis.window,
      location: { pathname: '/income', assign: assignSpy }
    });

    const client = new ApiClient('/api');
    await expect(client.get('/income')).rejects.toThrow(/session has expired/i);
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('does NOT redirect on 401 from /auth/ endpoints (login failures stay on page)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, message: 'Invalid username or password' })
    });
    const assignSpy = vi.fn();
    vi.stubGlobal('window', {
      ...globalThis.window,
      location: { pathname: '/login', assign: assignSpy }
    });

    const client = new ApiClient('/api');
    await expect(client.post('/auth/login', { username: 'x', password: 'y' }))
      .rejects.toThrow(/invalid username or password/i);
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
