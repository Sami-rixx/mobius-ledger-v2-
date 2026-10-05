import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, setCsrfToken, clearCsrfToken, setUnauthorizedHandler } from '../api.js';

function mockFetchOnce(body, init = {}) {
  return vi.fn().mockResolvedValue({
    ok: init.status ? init.status >= 200 && init.status < 300 : true,
    status: init.status || 200,
    statusText: init.statusText || 'OK',
    headers: {
      get: (name) => (name === 'content-type' ? 'application/json' : null)
    },
    json: async () => body
  });
}

describe('api client security wiring (CSRF + credentials)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearCsrfToken();
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('always sends credentials: "include" so the HttpOnly session cookie is attached', async () => {
    global.fetch = mockFetchOnce({ success: true, data: [] });
    await api.get('/income');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, config] = global.fetch.mock.calls[0];
    expect(config.credentials).toBe('include');
  });

  it('does not attach an x-csrf-token header to safe (GET) requests', async () => {
    setCsrfToken('secret-csrf-token');
    global.fetch = mockFetchOnce({ success: true, data: [] });
    await api.get('/income');

    const [, config] = global.fetch.mock.calls[0];
    expect(config.headers['x-csrf-token']).toBeUndefined();
  });

  it('attaches the current CSRF token to state-changing requests (POST/PUT/PATCH/DELETE)', async () => {
    setCsrfToken('secret-csrf-token');

    global.fetch = mockFetchOnce({ success: true, data: { id: 1 } });
    await api.post('/income', { amount: 100 });
    expect(global.fetch.mock.calls[0][1].headers['x-csrf-token']).toBe('secret-csrf-token');

    global.fetch = mockFetchOnce({ success: true });
    await api.put('/income/1', { amount: 200 });
    expect(global.fetch.mock.calls[0][1].headers['x-csrf-token']).toBe('secret-csrf-token');

    global.fetch = mockFetchOnce({ success: true });
    await api.delete('/income/1');
    expect(global.fetch.mock.calls[0][1].headers['x-csrf-token']).toBe('secret-csrf-token');
  });

  it('never sends a CSRF header when no token has been issued yet (e.g. before login)', async () => {
    clearCsrfToken();
    global.fetch = mockFetchOnce({ success: false }, { status: 401 });
    await api.post('/income', { amount: 100 }).catch(() => {});

    const [, config] = global.fetch.mock.calls[0];
    expect(config.headers['x-csrf-token']).toBeUndefined();
  });

  it('invokes the registered unauthorized handler exactly once when a request comes back 401', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    global.fetch = mockFetchOnce({ success: false, error: 'Authentication required' }, { status: 401, statusText: 'Unauthorized' });
    await api.get('/income').catch(() => {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the unauthorized handler on a successful request', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    global.fetch = mockFetchOnce({ success: true, data: [] });
    await api.get('/income');

    expect(handler).not.toHaveBeenCalled();
  });
});
