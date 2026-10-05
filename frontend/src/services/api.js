/**
 * API Service Configuration
 * Centralized API client for Mobius Ledger
 */

// Use relative path for development (proxy handles /api)
// In production, this should be the full API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// SECURITY: the backend session identity lives entirely in an HttpOnly
// cookie plus a synchronizer CSRF token (see backend/src/middleware/csrf.js)
// - it is never read from, or trusted from, anything the frontend sends as
// "identity". This module only needs to (a) make sure the session cookie is
// actually sent with every request, and (b) echo back the CSRF token the
// server handed us at login/`/auth/me` on every state-changing request.
// The frontend has no authority here; a missing/invalid token is always
// rejected server-side regardless of what this client does.
let csrfToken = null;

/**
 * setCsrfToken - called by AuthContext whenever the server hands us a
 * fresh CSRF token (login, /auth/me, change-password, and session-cookie
 * rotation all re-issue one). Never derived or guessed client-side.
 */
export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function clearCsrfToken() {
  csrfToken = null;
}

/**
 * Unauthorized callback - AuthContext registers a handler here so a 401
 * from ANY api call (not just the initial /auth/me check) can drop the
 * stale client-side auth state and send the user back to the login screen,
 * without every single page/service needing its own 401 handling.
 */
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : null;
}

/**
 * Base API client with default configuration
 */
class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an HTTP request
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Attach the CSRF token on every state-changing request. Safe
    // (GET/HEAD/OPTIONS) requests don't need it - matches the server's own
    // exemption in middleware/csrf.js.
    if (!SAFE_METHODS.has(method) && csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const config = {
      method,
      // The session cookie is HttpOnly and (in production) SameSite; it is
      // still only ever sent on same-origin requests by default, but this
      // makes the intent explicit regardless of how the app is deployed
      // (e.g. a separate static host in front of the same origin's API).
      credentials: 'include',
      ...options,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const error = new Error(errorData.message || errorData.error || 'Request failed');
        error.status = response.status;
        throw error;
      }

      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Parse error response
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { message: `HTTP ${response.status}: ${response.statusText}` };
    } catch {
      return { message: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}

// Singleton instance
export const api = new ApiClient();

// Export for testing
export { ApiClient };
