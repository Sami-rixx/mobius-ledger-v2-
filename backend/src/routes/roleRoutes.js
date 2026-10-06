/**
 * Role Routes
 * RESTful API endpoint definitions for role operations
 * 
 * Endpoints:
 * - GET /api/roles - List roles with pagination and filtering
 * - GET /api/roles/count - Get role count
 * - GET /api/roles/:id - Get a single role by ID
 * - GET /api/roles/name/:name - Get role by name
 * - GET /api/roles/default - Get default role
 * - GET /api/roles/check/:name - Check if role exists
 * - GET /api/roles/search - Search roles
 * - GET /api/roles/with-permissions - Get roles with permission count
 * - GET /api/roles/statistics - Get role statistics
 * - GET /api/roles/default-names - Get all default role names
 * - POST /api/roles - Create a new role
 * - PUT /api/roles/:id - Update a role
 * - DELETE /api/roles/:id - Delete a role
 * - POST /api/roles/set-default - Set a role as default
 */

import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import {
  listRoles,
  countRoles,
  getSingleRole,
  getRoleByNameHandler,
  getDefaultRoleHandler,
  checkRoleExists,
  searchRolesHandler,
  getRolesWithPermissionCountHandler,
  getRoleStatsHandler,
  getDefaultRoleNamesHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
  setDefaultRoleHandler
} from '../controllers/roleController.js';

const router = Router();

// GET /api/roles - List roles with pagination and filtering
router.get('/', requirePermission('roles.manage'), listRoles);

// GET /api/roles/count - Get role count
router.get('/count', requirePermission('roles.manage'), countRoles);

// GET /api/roles/:id - Get a single role by ID
router.get('/:id', requirePermission('roles.manage'), getSingleRole);

// GET /api/roles/name/:name - Get role by name
router.get('/name/:name', requirePermission('roles.manage'), getRoleByNameHandler);

// GET /api/roles/default - Get default role
router.get('/default', requirePermission('roles.manage'), getDefaultRoleHandler);

// GET /api/roles/check/:name - Check if role exists
router.get('/check/:name', requirePermission('roles.manage'), checkRoleExists);

// GET /api/roles/search - Search roles
router.get('/search', requirePermission('roles.manage'), searchRolesHandler);

// GET /api/roles/with-permissions - Get roles with permission count
router.get('/with-permissions', requirePermission('roles.manage'), getRolesWithPermissionCountHandler);

// GET /api/roles/statistics - Get role statistics
router.get('/statistics', requirePermission('roles.manage'), getRoleStatsHandler);

// GET /api/roles/default-names - Get all default role names
router.get('/default-names', requirePermission('roles.manage'), getDefaultRoleNamesHandler);

// POST /api/roles - Create a new role
router.post('/', requirePermission('roles.manage'), createRoleHandler);

// PUT /api/roles/:id - Update a role
router.put('/:id', requirePermission('roles.manage'), updateRoleHandler);

// DELETE /api/roles/:id - Delete a role
router.delete('/:id', requirePermission('roles.manage'), deleteRoleHandler);

// POST /api/roles/set-default - Set a role as default
router.post('/set-default', requirePermission('roles.manage'), setDefaultRoleHandler);

export default router;
