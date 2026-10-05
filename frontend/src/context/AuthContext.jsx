import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { api, setCsrfToken, clearCsrfToken, setUnauthorizedHandler } from '../services/api.js';

/**
 * AuthContext - the single source of frontend auth state.
 *
 * SECURITY NOTE: this is a UX convenience layer only. Every permission and
 * route-level decision the backend makes is re-checked and enforced there
 * (see backend/src/middleware/auth.js); nothing here is a security
 * boundary. Hiding a nav link or redirecting to /login merely avoids
 * showing a user a page they can't use - it cannot, by itself, grant or
 * deny access to any API endpoint. That enforcement is tested
 * independently on the backend (authorization matrix / IDOR / privilege
 * escalation test suites), not by relying on this component.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUnauthenticated = useCallback(() => {
    clearCsrfToken();
    setUser(null);
  }, []);

  useEffect(() => {
    // Any API call that gets a 401 after the app has loaded (e.g. the
    // session expired/was revoked mid-use) drops us back to the login
    // screen, instead of every page having to special-case it.
    setUnauthorizedHandler(handleUnauthenticated);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthenticated]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/auth/me');
      if (result && result.success) {
        setUser(result.data);
        setCsrfToken(result.csrfToken);
        setError(null);
      } else {
        handleUnauthenticated();
      }
    } catch {
      // No valid session (401) or a network error - either way, treat as
      // logged out rather than surfacing a scary error on first load.
      handleUnauthenticated();
    } finally {
      setLoading(false);
    }
  }, [handleUnauthenticated]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const result = await api.post('/auth/login', { username, password });
      if (result && result.success) {
        setUser(result.data);
        setCsrfToken(result.csrfToken);
        return { success: true };
      }
      const message = (result && result.error) || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails (e.g. session already expired),
      // still drop the client-side state below.
    }
    handleUnauthenticated();
  }, [handleUnauthenticated]);

  const hasPermission = useCallback(
    (permissionName) => Boolean(user && Array.isArray(user.permissions) && user.permissions.includes(permissionName)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      login,
      logout,
      hasPermission,
      refreshSession
    }),
    [user, loading, error, login, logout, hasPermission, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
