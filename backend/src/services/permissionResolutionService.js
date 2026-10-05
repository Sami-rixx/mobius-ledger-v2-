import db from '../config/database.js';

/**
 * Resolves the effective set of permission names for a user by unioning
 * the permissions of every (active) role assigned to them via
 * user_roles -> role_permissions -> permissions. This is the single
 * source of truth `requirePermission()` middleware consults - there is no
 * other path (no trusting a client-supplied role/permission claim).
 * @param {number} userId
 * @returns {Set<string>}
 */
export function getEffectivePermissions(userId) {
  const rows = db.prepare(`
    SELECT DISTINCT p.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id AND r.is_active = 1
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id AND p.is_active = 1
    WHERE ur.user_id = ?
  `).all(userId);

  return new Set(rows.map((r) => r.name));
}

export function getEffectiveRoleNames(userId) {
  const rows = db.prepare(`
    SELECT r.name FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id AND r.is_active = 1
    WHERE ur.user_id = ?
  `).all(userId);
  return rows.map((r) => r.name);
}

export function userHasPermission(userId, permissionName) {
  return getEffectivePermissions(userId).has(permissionName);
}

export default { getEffectivePermissions, getEffectiveRoleNames, userHasPermission };
