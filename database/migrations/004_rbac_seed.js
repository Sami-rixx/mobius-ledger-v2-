/**
 * Seeds the owner-approved RBAC model: six roles (Admin, Director,
 * Finance Officer, Clerk, Auditor, Viewer) and the permission matrix that
 * backend/src/middleware/auth.js's `requirePermission()` enforces on every
 * protected route.
 *
 * The `roles`/`permissions`/`user_roles`/`role_permissions` tables already
 * existed in schema.sql but were never seeded or enforced ("inert RBAC").
 * This migration is the first thing that makes them do anything.
 *
 * It is intentionally idempotent (INSERT OR IGNORE / existence checks) so
 * it is safe to run against a fresh database or an existing one, and it
 * backfills a `user_roles` mapping for any pre-existing user rows (using
 * their legacy `users.role` text column as a best-effort hint) so nobody
 * who previously had the informal "admin" role is silently locked out
 * after this migration - they are mapped onto the new normalized Admin
 * role instead.
 */

export const PERMISSIONS = [
  // Students
  { name: 'students.read', displayName: 'View Students', module: 'students' },
  { name: 'students.create', displayName: 'Create Students', module: 'students' },
  { name: 'students.update', displayName: 'Update Students', module: 'students' },
  { name: 'students.delete', displayName: 'Delete Students', module: 'students' },
  // Classes
  { name: 'classes.read', displayName: 'View Classes', module: 'classes' },
  { name: 'classes.manage', displayName: 'Manage Classes', module: 'classes' },
  // School fees / charges
  { name: 'fees.read', displayName: 'View School Fees', module: 'fees' },
  { name: 'fees.create', displayName: 'Record School Fees', module: 'fees' },
  { name: 'fees.update', displayName: 'Update School Fees', module: 'fees' },
  { name: 'fees.delete', displayName: 'Reverse/Correct School Fees', module: 'fees' },
  { name: 'charges.read', displayName: 'View Student Charges', module: 'charges' },
  { name: 'charges.create', displayName: 'Create Student Charges', module: 'charges' },
  { name: 'charges.update', displayName: 'Update Student Charges', module: 'charges' },
  { name: 'charges.delete', displayName: 'Delete Student Charges', module: 'charges' },
  // Income
  { name: 'income.read', displayName: 'View Income', module: 'income' },
  { name: 'income.create', displayName: 'Record Income', module: 'income' },
  { name: 'income.update', displayName: 'Update Income', module: 'income' },
  { name: 'income.delete', displayName: 'Reverse/Correct Income', module: 'income' },
  { name: 'income_categories.manage', displayName: 'Manage Income Categories', module: 'income' },
  // Expenses
  { name: 'expenses.read', displayName: 'View Expenses', module: 'expenses' },
  { name: 'expenses.create', displayName: 'Record Expenses', module: 'expenses' },
  { name: 'expenses.update', displayName: 'Update Expenses', module: 'expenses' },
  { name: 'expenses.delete', displayName: 'Reverse/Correct Expenses', module: 'expenses' },
  { name: 'expense_categories.manage', displayName: 'Manage Expense Categories', module: 'expenses' },
  // Withdrawals (maker-checker)
  { name: 'withdrawals.read', displayName: 'View Withdrawals', module: 'withdrawals' },
  { name: 'withdrawals.create', displayName: 'Create Withdrawals', module: 'withdrawals' },
  { name: 'withdrawals.update', displayName: 'Update Pending Withdrawals', module: 'withdrawals' },
  { name: 'withdrawals.approve', displayName: 'Approve Withdrawals', module: 'withdrawals' },
  { name: 'withdrawals.reject', displayName: 'Reject Withdrawals', module: 'withdrawals' },
  // Transactions / ledger
  { name: 'transactions.read', displayName: 'View Transactions', module: 'transactions' },
  { name: 'transactions.create', displayName: 'Create Transactions', module: 'transactions' },
  { name: 'transactions.update', displayName: 'Update Transactions', module: 'transactions' },
  { name: 'ledger.read', displayName: 'View Daily Ledger', module: 'ledger' },
  { name: 'ledger.manage', displayName: 'Manage Daily Ledger Entries', module: 'ledger' },
  // Reports / analytics / dashboard
  { name: 'reports.read', displayName: 'View Reports', module: 'reports' },
  { name: 'reports.export', displayName: 'Export Reports', module: 'reports' },
  { name: 'analytics.read', displayName: 'View Analytics', module: 'analytics' },
  { name: 'dashboard.read', displayName: 'View Dashboard', module: 'dashboard' },
  // Audit
  { name: 'audit.read', displayName: 'View Audit Trail', module: 'audit' },
  // Notifications
  { name: 'notifications.read', displayName: 'View Notifications', module: 'notifications' },
  { name: 'notifications.manage', displayName: 'Manage Notifications', module: 'notifications' },
  // Administration (high-risk - Admin only by default)
  { name: 'users.manage', displayName: 'Manage Users', module: 'administration' },
  { name: 'roles.manage', displayName: 'Manage Roles & Permissions', module: 'administration' },
  { name: 'sessions.manage', displayName: 'Manage User Sessions', module: 'administration' },
  { name: 'import.export', displayName: 'Import/Export Data', module: 'administration' },
  { name: 'database.restore', displayName: 'Restore Database Backups', module: 'administration' },
  { name: 'settings.manage', displayName: 'Manage System Settings', module: 'administration' }
];

export const ROLES = [
  { name: 'admin', displayName: 'Admin', description: 'Full system access, including user/role/session administration and backup restore.', isDefault: false },
  { name: 'director', displayName: 'Director', description: 'Organizational oversight; approves/rejects withdrawals; broad financial read access.', isDefault: false },
  { name: 'finance_officer', displayName: 'Finance Officer', description: 'Day-to-day financial operations: records income/expenses/fees, creates withdrawal requests.', isDefault: false },
  { name: 'clerk', displayName: 'Clerk', description: 'Front-desk data entry: students, fees, basic income/expense recording.', isDefault: true },
  { name: 'auditor', displayName: 'Auditor', description: 'Read-only access across financial records and the audit trail for oversight/compliance.', isDefault: false },
  { name: 'viewer', displayName: 'Viewer', description: 'Minimal read-only access to dashboards and reports.', isDefault: false }
];

const ALL = PERMISSIONS.map((p) => p.name);

const financeCore = [
  'students.read', 'students.create', 'students.update',
  'classes.read',
  'fees.read', 'fees.create', 'fees.update',
  'charges.read', 'charges.create', 'charges.update',
  'income.read', 'income.create', 'income.update',
  'expenses.read', 'expenses.create', 'expenses.update',
  'withdrawals.read', 'withdrawals.create',
  'transactions.read', 'transactions.create',
  'ledger.read', 'reports.read', 'reports.export',
  'analytics.read', 'dashboard.read',
  'notifications.read'
];

const readOnlyFinance = [
  'students.read', 'classes.read', 'fees.read', 'charges.read',
  'income.read', 'expenses.read', 'withdrawals.read', 'transactions.read',
  'ledger.read', 'reports.read', 'dashboard.read', 'analytics.read', 'notifications.read'
];

export const ROLE_PERMISSIONS = {
  admin: ALL,
  director: [
    ...readOnlyFinance,
    'reports.export',
    'withdrawals.approve', 'withdrawals.reject',
    'audit.read'
  ],
  finance_officer: [...financeCore, 'income_categories.manage', 'expense_categories.manage'],
  clerk: [
    'students.read', 'students.create', 'students.update',
    'classes.read',
    'fees.read', 'fees.create',
    'charges.read',
    'income.read', 'income.create',
    'expenses.read', 'expenses.create',
    'withdrawals.read', 'withdrawals.create',
    'transactions.read',
    'ledger.read', 'reports.read', 'dashboard.read', 'notifications.read'
  ],
  auditor: [...readOnlyFinance, 'audit.read', 'reports.export'],
  viewer: [
    'dashboard.read', 'reports.read', 'students.read', 'classes.read',
    'income.read', 'expenses.read', 'transactions.read', 'ledger.read'
  ]
};

// Legacy users.role free-text value -> new normalized role name.
export const LEGACY_ROLE_MAP = {
  admin: 'admin',
  administrator: 'admin',
  super_admin: 'admin',
  director: 'director',
  finance_officer: 'finance_officer',
  accountant: 'finance_officer',
  finance: 'finance_officer',
  clerk: 'clerk',
  teacher: 'clerk',
  auditor: 'auditor',
  viewer: 'viewer',
  parent: 'viewer',
  student: 'viewer'
};

export default {
  id: '004_rbac_seed',
  description: 'Seed Admin/Director/Finance Officer/Clerk/Auditor/Viewer roles and permissions',
  up(db) {
    const now = () => new Date().toISOString();

    const insertPermission = db.prepare(`
      INSERT OR IGNORE INTO permissions (name, display_name, description, module, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);
    for (const p of PERMISSIONS) {
      insertPermission.run(p.name, p.displayName, p.description || p.displayName, p.module);
    }

    const insertRole = db.prepare(`
      INSERT OR IGNORE INTO roles (name, display_name, description, is_active, is_default, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `);
    for (const r of ROLES) {
      insertRole.run(r.name, r.displayName, r.description, r.isDefault ? 1 : 0);
    }

    const getRoleId = db.prepare('SELECT id FROM roles WHERE name = ?');
    const getPermissionId = db.prepare('SELECT id FROM permissions WHERE name = ?');
    const linkRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id, assigned_at)
      VALUES (?, ?, datetime('now'))
    `);

    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const role = getRoleId.get(roleName);
      if (!role) continue;
      for (const permName of permissionNames) {
        const perm = getPermissionId.get(permName);
        if (!perm) continue;
        linkRolePermission.run(role.id, perm.id);
      }
    }

    // Backfill: give every pre-existing user a normalized role mapping
    // based on their legacy free-text `users.role` column, if they don't
    // already have one. This keeps a pre-existing production database
    // usable immediately after the upgrade instead of locking everyone
    // out, while still routing all *authorization* decisions through the
    // new, enforced user_roles/role_permissions tables going forward.
    const usersTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (usersTableExists) {
      const users = db.prepare('SELECT id, role FROM users').all();
      const hasUserRole = db.prepare('SELECT 1 FROM user_roles WHERE user_id = ? LIMIT 1');
      const assign = db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, datetime('now'))`);

      for (const user of users) {
        if (hasUserRole.get(user.id)) continue;
        const legacyRole = (user.role || '').toLowerCase().trim();
        const normalized = LEGACY_ROLE_MAP[legacyRole] || 'viewer';
        const role = getRoleId.get(normalized);
        if (role) assign.run(user.id, role.id);
      }
    }
  }
};
