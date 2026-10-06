/**
 * Authentication controller: login / logout / me / change-password.
 * Raw session tokens travel ONLY via the HttpOnly session cookie; they are
 * never included in response bodies.
 */
import {
  login as loginService,
  logout as logoutService,
  changePassword as changePasswordService,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  getUserPermissions,
  getUserRoles
} from '../services/authService.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = await loginService(username, password, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (!result.success) {
      return res.status(result.statusCode || 401).json({
        success: false,
        error: true,
        message: result.error
      });
    }

    res.cookie(SESSION_COOKIE_NAME, result.rawToken, sessionCookieOptions());
    return res.json({
      success: true,
      message: 'Login successful',
      data: { user: result.user }
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res, next) {
  try {
    logoutService(req.session.id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/api' });
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return next(error);
  }
}

export function me(req, res) {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        fullName: req.user.fullName,
        email: req.user.email,
        roles: getUserRoles(req.user.id),
        permissions: getUserPermissions(req.user.id)
      }
    }
  });
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await changePasswordService(req.user.id, currentPassword, newPassword, {
      sessionId: req.session.id,
      ipAddress: req.ip
    });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: true,
        message: result.error
      });
    }
    return res.json({ success: true, message: 'Password changed. Other sessions have been signed out.' });
  } catch (error) {
    return next(error);
  }
}

export default { login, logout, me, changePassword };
