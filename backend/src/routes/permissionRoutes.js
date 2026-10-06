/**
 * Permission Routes
 * RESTful API endpoint definitions for permission operations
 * 
 * Endpoints:
 * - GET /api/permissions - List permissions with pagination and filtering
 * - GET /api/permissions/count - Get permission count
 * - GET /api/permissions/:id - Get a single permission by ID
 * - GET /api/permissions/name/:name - Get permission by name
 * - GET /api/permissions/module/:module - Get permissions by module
 * - GET /api/permissions/check/:name - Check if permission exists
 * - GET /api/permissions/search - Search permissions
 * - GET /api/permissions/statistics - Get permission statistics
 * - GET /api/permissions/modules - Get all permission modules
 * - GET /api/permissions/count-by-module - Get permission count by module
 * - POST /api/permissions - Create a new permission
 * - PUT /api/permissions/:id - Update a permission
 * - DELETE /api/permissions/:id - Delete a permission
 */

import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import {
  listPermissions,
  countPermissions,
  getSinglePermission,
  getPermissionByNameHandler,
  getPermissionsByModuleHandler,
  checkPermissionExists,
  searchPermissionsHandler,
  getPermissionStatsHandler,
  getPermissionModulesHandler,
  getPermissionCountByModuleHandler,
  createPermissionHandler,
  updatePermissionHandler,
  deletePermissionHandler
} from '../controllers/permissionController.js';

const router = Router();

// GET /api/permissions - List permissions with pagination and filtering
router.get('/', requirePermission('roles.manage'), listPermissions);

// GET /api/permissions/count - Get permission count
router.get('/count', requirePermission('roles.manage'), countPermissions);

// GET /api/permissions/:id - Get a single permission by ID
router.get('/:id', requirePermission('roles.manage'), getSinglePermission);

// GET /api/permissions/name/:name - Get permission by name
router.get('/name/:name', requirePermission('roles.manage'), getPermissionByNameHandler);

// GET /api/permissions/module/:module - Get permissions by module
router.get('/module/:module', requirePermission('roles.manage'), getPermissionsByModuleHandler);

// GET /api/permissions/check/:name - Check if permission exists
router.get('/check/:name', requirePermission('roles.manage'), checkPermissionExists);

// GET /api/permissions/search - Search permissions
router.get('/search', requirePermission('roles.manage'), searchPermissionsHandler);

// GET /api/permissions/statistics - Get permission statistics
router.get('/statistics', requirePermission('roles.manage'), getPermissionStatsHandler);

// GET /api/permissions/modules - Get all permission modules
router.get('/modules', requirePermission('roles.manage'), getPermissionModulesHandler);

// GET /api/permissions/count-by-module - Get permission count by module
router.get('/count-by-module', requirePermission('roles.manage'), getPermissionCountByModuleHandler);

// POST /api/permissions - Create a new permission
router.post('/', requirePermission('roles.manage'), createPermissionHandler);

// PUT /api/permissions/:id - Update a permission
router.put('/:id', requirePermission('roles.manage'), updatePermissionHandler);

// DELETE /api/permissions/:id - Delete a permission
router.delete('/:id', requirePermission('roles.manage'), deletePermissionHandler);

export default router;
