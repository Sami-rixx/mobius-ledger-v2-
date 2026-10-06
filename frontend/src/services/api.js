/**
 * API Service Configuration
 * Centralized API client for Mobius Ledger
 */

// Use relative path for development (proxy handles /api)
// In production, this should be the full API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
      // CSRF defense: the backend rejects state-changing requests without
      // this custom header (cannot be attached cross-site without CORS).
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    // Money-moving POSTs require an Idempotency-Key; attach one to every
    // POST so retries of the same logical submit can be deduplicated.
    if (method === 'POST' && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] =
        (globalThis.crypto?.randomUUID?.() || `k-${Date.now()}-${Math.floor(Math.random() * 1e12)}`);
    }

    const config = {
      method,
      ...options,
      headers,
      // Send the HttpOnly session cookie with every API request. The token
      // itself is never readable from JavaScript.
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        // Session expired or revoked: route the user to the login screen.
        // This is UX only - the server is the security boundary.
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(errorData.message || errorData.error || 'Request failed');
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
