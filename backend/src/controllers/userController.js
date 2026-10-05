/**
 * User Controller (Admin-only account provisioning/management)
 *
 * Role assignment itself is handled by the existing userRoleRoutes
 * (`POST /api/user-roles`) against the normalized RBAC tables - this
 * controller only manages the `users` row (identity, credentials,
 * active/disabled status). Every endpoint here is mounted behind
 * `requirePermission('users.manage')` in app.js.
 */
import * as UserModel from '../models/User.js';
import db from '../config/database.js';
import { hashPassword, validatePasswordPolicy } from '../services/authService.js';
import { revokeAllSessionsForUser } from '../services/sessionService.js';
import { logFinancialAction } from '../services/auditTrailService.js';

function ctx(req, userId) {
  return { userId: req.user?.id ?? userId, ipAddress: req.ip, userAgent: req.get('user-agent') || null };
}

export const listUsers = async (req, res, next) => {
  try {
    const { isActive, role, search } = req.query;
    const users = await UserModel.getAll({
      isActive: isActive === undefined ? undefined : isActive === 'true',
      role,
      search
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    const user = await UserModel.getById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin provisions a new account with a temporary password; the account is
 * flagged `must_change_password` so the temporary value cannot remain the
 * long-term credential.
 */
export const createUser = async (req, res, next) => {
  try {
    const { username, fullName, email, phone, temporaryPassword, role } = req.body || {};

    if (!username || !fullName || !temporaryPassword) {
      return res.status(400).json({ success: false, error: 'username, fullName and temporaryPassword are required' });
    }

    const policy = validatePasswordPolicy(temporaryPassword);
    if (!policy.valid) {
      return res.status(400).json({ success: false, error: 'Temporary password does not meet policy', details: policy.errors });
    }

    const existing = await UserModel.getByUsername(username.trim());
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already in use' });
    }

    const passwordHash = await hashPassword(temporaryPassword);
    const created = await UserModel.create({
      username: username.trim(),
      fullName,
      email: email || null,
      phone: phone || null,
      passwordHash,
      role: role || 'viewer',
      isActive: true
    });

    db.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(created.id);

    logFinancialAction('CREATE', 'users', created.id, null, { username: created.username }, ctx(req));

    res.status(201).json({ success: true, data: await UserModel.getById(created.id) });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid user ID' });

    const before = await UserModel.getById(id);
    if (!before) return res.status(404).json({ success: false, error: 'User not found' });

    const updated = await UserModel.update(id, req.body || {});

    // Disabling a user must immediately invalidate every outstanding
    // session of theirs - a disabled account should not retain access via
    // an already-issued session cookie.
    if (before.is_active && updated && !updated.is_active) {
      revokeAllSessionsForUser(id, 'account-disabled');
    }

    logFinancialAction('UPDATE', 'users', id, before, updated, ctx(req));

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-initiated password reset: sets a new temporary password and
 * revokes all of the user's existing sessions.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { temporaryPassword } = req.body || {};
    if (Number.isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (!temporaryPassword) return res.status(400).json({ success: false, error: 'temporaryPassword is required' });

    const policy = validatePasswordPolicy(temporaryPassword);
    if (!policy.valid) {
      return res.status(400).json({ success: false, error: 'Temporary password does not meet policy', details: policy.errors });
    }

    const user = await UserModel.getById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const passwordHash = await hashPassword(temporaryPassword);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 1, failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(passwordHash, id);

    revokeAllSessionsForUser(id, 'admin-password-reset');

    logFinancialAction('PASSWORD_CHANGE', 'users', id, null, { by: 'admin' }, ctx(req));

    res.json({ success: true, message: 'Password reset; user must change it on next login' });
  } catch (error) {
    next(error);
  }
};

export default { listUsers, getUser, createUser, updateUser, resetPassword };
