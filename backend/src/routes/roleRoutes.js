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
router.get('/', listRoles);

// GET /api/roles/count - Get role count
router.get('/count', countRoles);

// GET /api/roles/:id - Get a single role by ID
router.get('/:id', getSingleRole);

// GET /api/roles/name/:name - Get role by name
router.get('/name/:name', getRoleByNameHandler);

// GET /api/roles/default - Get default role
router.get('/default', getDefaultRoleHandler);

// GET /api/roles/check/:name - Check if role exists
router.get('/check/:name', checkRoleExists);

// GET /api/roles/search - Search roles
router.get('/search', searchRolesHandler);

// GET /api/roles/with-permissions - Get roles with permission count
router.get('/with-permissions', getRolesWithPermissionCountHandler);

// GET /api/roles/statistics - Get role statistics
router.get('/statistics', getRoleStatsHandler);

// GET /api/roles/default-names - Get all default role names
router.get('/default-names', getDefaultRoleNamesHandler);

// POST /api/roles - Create a new role
router.post('/', createRoleHandler);

// PUT /api/roles/:id - Update a role
router.put('/:id', updateRoleHandler);

// DELETE /api/roles/:id - Delete a role
router.delete('/:id', deleteRoleHandler);

// POST /api/roles/set-default - Set a role as default
router.post('/set-default', setDefaultRoleHandler);

export default router;
