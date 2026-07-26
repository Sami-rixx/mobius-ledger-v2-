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
router.get('/', listPermissions);

// GET /api/permissions/count - Get permission count
router.get('/count', countPermissions);

// GET /api/permissions/:id - Get a single permission by ID
router.get('/:id', getSinglePermission);

// GET /api/permissions/name/:name - Get permission by name
router.get('/name/:name', getPermissionByNameHandler);

// GET /api/permissions/module/:module - Get permissions by module
router.get('/module/:module', getPermissionsByModuleHandler);

// GET /api/permissions/check/:name - Check if permission exists
router.get('/check/:name', checkPermissionExists);

// GET /api/permissions/search - Search permissions
router.get('/search', searchPermissionsHandler);

// GET /api/permissions/statistics - Get permission statistics
router.get('/statistics', getPermissionStatsHandler);

// GET /api/permissions/modules - Get all permission modules
router.get('/modules', getPermissionModulesHandler);

// GET /api/permissions/count-by-module - Get permission count by module
router.get('/count-by-module', getPermissionCountByModuleHandler);

// POST /api/permissions - Create a new permission
router.post('/', createPermissionHandler);

// PUT /api/permissions/:id - Update a permission
router.put('/:id', updatePermissionHandler);

// DELETE /api/permissions/:id - Delete a permission
router.delete('/:id', deletePermissionHandler);

export default router;
