/**
 * RBAC catalog seeding (idempotent, runs on every boot).
 *
 * OWNER DECISION D5: the role model is exactly Admin, Director,
 * Finance Officer, Clerk, Auditor and Viewer. Permissions are enforced
 * server-side via requirePermission middleware.
 *
 * - The permission catalog is always upserted (INSERT OR IGNORE) so new
 *   permissions become available after upgrades.
 * - Default role -> permission grants are only applied when a role has NO
 *   permissions assigned yet, so administrator customizations made through
 *   the role-permission API are never silently reverted.
 * - Legacy users.role values are mapped to normalized user_roles rows once,
 *   for users that have no user_roles assignment yet.
 */

/** Permission catalog: name -> { displayName, module } */
export const PERMISSIONS = {
  'students.read': { displayName: 'View Students', module: 'students' },
  'students.create': { displayName: 'Create Students', module: 'students' },
  'students.update': { displayName: 'Update Students', module: 'students' },
  'students.delete': { displayName: 'Delete Students', module: 'students' },
  'classes.read': { displayName: 'View Classes', module: 'classes' },
  'classes.manage': { displayName: 'Manage Classes', module: 'classes' },
  'fees.read': { displayName: 'View School Fees', module: 'fees' },
  'fees.create': { displayName: 'Record School Fee Payments', module: 'fees' },
  'fees.update': { displayName: 'Update School Fee Payments', module: 'fees' },
  'charges.read': { displayName: 'View Student Charges', module: 'charges' },
  'charges.create': { displayName: 'Create Student Charges', module: 'charges' },
  'charges.update': { displayName: 'Update Student Charges', module: 'charges' },
  'charges.delete': { displayName: 'Delete Student Charges', module: 'charges' },
  'income.read': { displayName: 'View Income', module: 'income' },
  'income.create': { displayName: 'Record Income', module: 'income' },
  'income.update': { displayName: 'Update Income', module: 'income' },
  'income.delete': { displayName: 'Reverse Income Records', module: 'income' },
  'expenses.read': { displayName: 'View Expenses', module: 'expenses' },
  'expenses.create': { displayName: 'Record Expenses', module: 'expenses' },
  'expenses.update': { displayName: 'Update Expenses', module: 'expenses' },
  'expenses.delete': { displayName: 'Reverse Expense Records', module: 'expenses' },
  'withdrawals.read': { displayName: 'View Withdrawals', module: 'withdrawals' },
  'withdrawals.create': { displayName: 'Create Withdrawals', module: 'withdrawals' },
  'withdrawals.approve': { displayName: 'Approve Withdrawals', module: 'withdrawals' },
  'withdrawals.reject': { displayName: 'Reject Withdrawals', module: 'withdrawals' },
  'transactions.read': { displayName: 'View Transactions', module: 'transactions' },
  'transactions.create': { displayName: 'Create Transactions', module: 'transactions' },
  'transactions.update': { displayName: 'Update/Reverse Transactions', module: 'transactions' },
  'reports.read': { displayName: 'View Reports & Dashboards', module: 'reports' },
  'reports.export': { displayName: 'Export Reports', module: 'reports' },
  'audit.read': { displayName: 'View Audit Trail', module: 'audit' },
  'notifications.read': { displayName: 'View Notifications', module: 'notifications' },
  'notifications.manage': { displayName: 'Manage Notifications', module: 'notifications' },
  'users.manage': { displayName: 'Manage Users', module: 'administration' },
  'roles.manage': { displayName: 'Manage Roles & Permissions', module: 'administration' },
  'sessions.manage': { displayName: 'Manage User Sessions', module: 'administration' },
  'import.export': { displayName: 'Import/Export Data', module: 'administration' },
  'database.restore': { displayName: 'Restore Database', module: 'administration' },
  'settings.manage': { displayName: 'Manage System Settings', module: 'administration' }
};

const ALL_PERMISSIONS = Object.keys(PERMISSIONS);
const READ_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith('.read'));

/** Role catalog (OWNER DECISION D5) with default permission grants. */
export const ROLES = {
  admin: {
    displayName: 'Admin',
    description: 'Full system administration access',
    permissions: ALL_PERMISSIONS
  },
  director: {
    displayName: 'Director',
    description: 'School director: read access, withdrawal approval authority',
    permissions: [
      ...READ_PERMISSIONS,
      'withdrawals.create', 'withdrawals.approve', 'withdrawals.reject',
      'reports.export'
    ]
  },
  finance_officer: {
    displayName: 'Finance Officer',
    description: 'Day-to-day financial management',
    permissions: [
      'students.read', 'classes.read',
      'fees.read', 'fees.create', 'fees.update',
      'charges.read', 'charges.create', 'charges.update', 'charges.delete',
      'income.read', 'income.create', 'income.update', 'income.delete',
      'expenses.read', 'expenses.create', 'expenses.update', 'expenses.delete',
      'withdrawals.read', 'withdrawals.create',
      'transactions.read', 'transactions.create', 'transactions.update',
      'reports.read', 'reports.export',
      'notifications.read'
    ]
  },
  clerk: {
    displayName: 'Clerk',
    description: 'Front-office data entry',
    permissions: [
      'students.read', 'students.create', 'students.update',
      'classes.read',
      'fees.read', 'fees.create',
      'charges.read',
      'income.read', 'income.create',
      'expenses.read', 'expenses.create',
      'withdrawals.read',
      'transactions.read', 'transactions.create',
      'reports.read',
      'notifications.read'
    ]
  },
  auditor: {
    displayName: 'Auditor',
    description: 'Read-only oversight including the audit trail',
    permissions: [...READ_PERMISSIONS, 'reports.export']
  },
  viewer: {
    displayName: 'Viewer',
    description: 'Read-only access to operational data (no audit trail)',
    permissions: READ_PERMISSIONS.filter((p) => p !== 'audit.read')
  }
};

/**
 * Seed/repair the RBAC catalog. Idempotent and safe on every boot.
 * @param {import('better-sqlite3').Database} db
 */
export function seedRbac(db) {
  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO permissions (name, display_name, description, module, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (name, display_name, description, is_active, is_default)
    VALUES (?, ?, ?, 1, ?)
  `);
  const getRoleId = db.prepare('SELECT id FROM roles WHERE name = ?');
  const getPermissionId = db.prepare('SELECT id FROM permissions WHERE name = ?');
  const countRolePermissions = db.prepare('SELECT COUNT(*) AS c FROM role_permissions WHERE role_id = ?');
  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
  `);

  const seed = db.transaction(() => {
    for (const [name, meta] of Object.entries(PERMISSIONS)) {
      insertPermission.run(name, meta.displayName, meta.displayName, meta.module);
    }

    for (const [name, meta] of Object.entries(ROLES)) {
      insertRole.run(name, meta.displayName, meta.description, name === 'viewer' ? 1 : 0);
      const role = getRoleId.get(name);
      // Only apply default grants on first run for this role so admin
      // customizations via the role-permission API are preserved.
      if (countRolePermissions.get(role.id).c === 0) {
        for (const permissionName of meta.permissions) {
          const permission = getPermissionId.get(permissionName);
          if (permission) insertRolePermission.run(role.id, permission.id);
        }
      }
    }

    // Map legacy users.role values to normalized user_roles rows (once per
    // user, only when the user has no normalized assignment yet).
    const legacyUsers = db.prepare(`
      SELECT u.id, u.role FROM users u
      WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
    `).all();
    const insertUserRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');
    for (const user of legacyUsers) {
      const roleName = ROLES[user.role] ? user.role : (user.role === 'admin' ? 'admin' : 'viewer');
      const role = getRoleId.get(roleName);
      if (role) insertUserRole.run(user.id, role.id);
    }
  });

  seed();
}

export default { PERMISSIONS, ROLES, seedRbac };
