/**
 * User administration routes (users.manage — Admin only).
 * Passwords are hashed with Argon2id; password hashes are never returned.
 */
import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import db from '../config/database.js';
import * as UserModel from '../models/User.js';
import { hashPassword, passwordPolicyViolation } from '../services/passwordService.js';
import { revokeAllSessionsForUser, getUserRoles } from '../services/authService.js';
import { recordAuditEvent, AUDIT, auditContext } from '../services/auditService.js';
import { parseId } from '../utils/sqlSafety.js';

const router = Router();

// GET /api/users - list users (no password hashes)
router.get('/', requirePermission('users.manage'), async (req, res, next) => {
  try {
    const users = await UserModel.getAll({
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search
    });
    const withRoles = users.map((u) => ({ ...u, roles: getUserRoles(u.id) }));
    return res.json({ success: true, data: withRoles });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users/:id
router.get('/:id', requirePermission('users.manage'), async (req, res, next) => {
  try {
    const user = await UserModel.getById(parseId(req.params.id));
    if (!user) return res.status(404).json({ success: false, error: true, message: 'User not found' });
    return res.json({ success: true, data: { ...user, roles: getUserRoles(user.id) } });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users - create a user with a real password and role(s)
router.post('/', requirePermission('users.manage'), async (req, res, next) => {
  try {
    const { username, fullName, email = null, phone = null, password, roles = [] } = req.body || {};
    if (!username || !fullName || !password) {
      return res.status(400).json({ success: false, error: true, message: 'username, fullName and password are required' });
    }
    const violation = passwordPolicyViolation(password);
    if (violation) {
      return res.status(400).json({ success: false, error: true, message: violation });
    }
    if (await UserModel.getByUsername(username)) {
      return res.status(409).json({ success: false, error: true, message: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);
    const roleRows = [];
    for (const roleName of roles) {
      const role = db.prepare('SELECT id, name FROM roles WHERE name = ? AND is_active = 1').get(roleName);
      if (!role) {
        return res.status(400).json({ success: false, error: true, message: `Unknown role: ${roleName}` });
      }
      roleRows.push(role);
    }

    const user = await UserModel.create({
      username, fullName, email, phone, passwordHash,
      role: roleRows[0]?.name || 'viewer',
      isActive: true
    });
    const assign = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)');
    for (const role of roleRows) assign.run(user.id, role.id, req.user.id);

    recordAuditEvent({
      action: AUDIT.CREATE,
      tableName: 'users',
      recordId: user.id,
      newValues: { username, roles: roleRows.map((r) => r.name) },
      ...auditContext(req)
    });
    return res.status(201).json({ success: true, data: { ...user, roles: roleRows.map((r) => r.name) } });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/users/:id - update profile / active flag
router.put('/:id', requirePermission('users.manage'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const existing = await UserModel.getById(id);
    if (!existing) return res.status(404).json({ success: false, error: true, message: 'User not found' });

    const { fullName, email, phone, isActive } = req.body || {};
    const updated = await UserModel.update(id, { fullName, email, phone, isActive });
    if (isActive === false) {
      // Disabling a user revokes every session immediately.
      revokeAllSessionsForUser(id);
      recordAuditEvent({ action: AUDIT.SESSION_REVOKED, tableName: 'user_sessions', newValues: { userId: id, reason: 'user disabled' }, ...auditContext(req) });
    }
    recordAuditEvent({
      action: AUDIT.UPDATE,
      tableName: 'users',
      recordId: id,
      oldValues: existing,
      newValues: updated,
      ...auditContext(req)
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users/:id/reset-password - admin password reset
router.post('/:id/reset-password', requirePermission('users.manage'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const existing = await UserModel.getById(id);
    if (!existing) return res.status(404).json({ success: false, error: true, message: 'User not found' });

    const { newPassword } = req.body || {};
    const violation = passwordPolicyViolation(newPassword);
    if (violation) {
      return res.status(400).json({ success: false, error: true, message: violation });
    }
    const passwordHash = await hashPassword(newPassword);
    await UserModel.updatePassword(id, passwordHash);
    revokeAllSessionsForUser(id);
    recordAuditEvent({ action: AUDIT.PASSWORD_CHANGE, tableName: 'users', recordId: id, ...auditContext(req) });
    return res.json({ success: true, message: 'Password reset. All sessions for the user were revoked.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
