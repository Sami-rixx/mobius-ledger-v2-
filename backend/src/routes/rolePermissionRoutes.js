/**
 * RolePermission Routes
 * RESTful API endpoint definitions for role-permission assignment operations
 * 
 * Endpoints:
 * - GET /api/role-permissions - List role-permission assignments with pagination
 * - GET /api/role-permissions/count - Get role-permission assignment count
 * - GET /api/role-permissions/:id - Get a single role-permission assignment by ID
 * - GET /api/role-permissions/role/:roleId/permission/:permissionId - Get by role and permission
 * - GET /api/role-permissions/role/:roleId - Get all permissions for a role
 * - GET /api/role-permissions/role/:roleId/ids - Get permission IDs for a role
 * - GET /api/role-permissions/permission/:permissionId - Get all roles for a permission
 * - GET /api/role-permissions/role/:roleId/has-permission/:permissionId - Check if role has permission
 * - POST /api/role-permissions/role/:roleId/has-any-permission - Check if role has any of the given permissions
 * - GET /api/role-permissions/role/:roleId/permissions/count - Get permission count for a role
 * - GET /api/role-permissions/permission/:permissionId/roles/count - Get role count for a permission
 * - GET /api/role-permissions/statistics - Get role-permission statistics
 * - POST /api/role-permissions - Assign permission to role
 * - DELETE /api/role-permissions/role/:roleId/permission/:permissionId - Remove permission from role
 * - DELETE /api/role-permissions/role/:roleId - Remove all permissions from role
 * - PUT /api/role-permissions/role/:roleId - Replace all permissions for a role
 */

import { Router } from 'express';
import {
  listRolePermissions,
  countRolePermissions,
  getSingleRolePermission,
  getRolePermissionByRoleAndPermissionHandler,
  getPermissionsForRoleHandler,
  getPermissionIdsForRoleHandler,
  getRolesForPermissionHandler,
  checkRoleHasPermissionHandler,
  checkRoleHasAnyPermissionHandler,
  getPermissionCountForRoleHandler,
  getRoleCountForPermissionHandler,
  getRolePermissionStatsHandler,
  createRolePermissionHandler,
  removePermissionFromRoleHandler,
  removeAllPermissionsFromRoleHandler,
  replaceRolePermissionsHandler
} from '../controllers/rolePermissionController.js';

const router = Router();

// GET /api/role-permissions - List role-permission assignments with pagination
router.get('/', listRolePermissions);

// GET /api/role-permissions/count - Get role-permission assignment count
router.get('/count', countRolePermissions);

// GET /api/role-permissions/:id - Get a single role-permission assignment by ID
router.get('/:id', getSingleRolePermission);

// GET /api/role-permissions/role/:roleId/permission/:permissionId - Get by role and permission
router.get('/role/:roleId/permission/:permissionId', getRolePermissionByRoleAndPermissionHandler);

// GET /api/role-permissions/role/:roleId - Get all permissions for a role
router.get('/role/:roleId', getPermissionsForRoleHandler);

// GET /api/role-permissions/role/:roleId/ids - Get permission IDs for a role
router.get('/role/:roleId/ids', getPermissionIdsForRoleHandler);

// GET /api/role-permissions/permission/:permissionId - Get all roles for a permission
router.get('/permission/:permissionId', getRolesForPermissionHandler);

// GET /api/role-permissions/role/:roleId/has-permission/:permissionId - Check if role has permission
router.get('/role/:roleId/has-permission/:permissionId', checkRoleHasPermissionHandler);

// POST /api/role-permissions/role/:roleId/has-any-permission - Check if role has any of the given permissions
router.post('/role/:roleId/has-any-permission', checkRoleHasAnyPermissionHandler);

// GET /api/role-permissions/role/:roleId/permissions/count - Get permission count for a role
router.get('/role/:roleId/permissions/count', getPermissionCountForRoleHandler);

// GET /api/role-permissions/permission/:permissionId/roles/count - Get role count for a permission
router.get('/permission/:permissionId/roles/count', getRoleCountForPermissionHandler);

// GET /api/role-permissions/statistics - Get role-permission statistics
router.get('/statistics', getRolePermissionStatsHandler);

// POST /api/role-permissions - Assign permission to role
router.post('/', createRolePermissionHandler);

// DELETE /api/role-permissions/role/:roleId/permission/:permissionId - Remove permission from role
router.delete('/role/:roleId/permission/:permissionId', removePermissionFromRoleHandler);

// DELETE /api/role-permissions/role/:roleId - Remove all permissions from role
router.delete('/role/:roleId', removeAllPermissionsFromRoleHandler);

// PUT /api/role-permissions/role/:roleId - Replace all permissions for a role
router.put('/role/:roleId', replaceRolePermissionsHandler);

export default router;
