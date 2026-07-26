/**
 * UserRole Routes
 * RESTful API endpoint definitions for user-role assignment operations
 * 
 * Endpoints:
 * - GET /api/user-roles - List user-role assignments with pagination
 * - GET /api/user-roles/count - Get user-role assignment count
 * - GET /api/user-roles/:id - Get a single user-role assignment by ID
 * - GET /api/user-roles/user/:userId/role/:roleId - Get user-role assignment by user and role
 * - GET /api/user-roles/user/:userId - Get all roles for a user
 * - GET /api/user-roles/user/:userId/ids - Get role IDs for a user
 * - GET /api/user-roles/role/:roleId - Get all users for a role
 * - GET /api/user-roles/user/:userId/has-role/:roleId - Check if user has role
 * - POST /api/user-roles/user/:userId/has-any-role - Check if user has any of the given roles
 * - GET /api/user-roles/role/:roleId/users/count - Get user count for a role
 * - GET /api/user-roles/user/:userId/roles/count - Get role count for a user
 * - GET /api/user-roles/statistics - Get user-role statistics
 * - POST /api/user-roles - Assign role to user
 * - DELETE /api/user-roles/user/:userId/role/:roleId - Remove role from user
 * - DELETE /api/user-roles/user/:userId - Remove all roles from user
 * - PUT /api/user-roles/user/:userId - Replace all roles for a user
 */

import { Router } from 'express';
import {
  listUserRoles,
  countUserRoles,
  getSingleUserRole,
  getUserRoleByUserAndRoleHandler,
  getRolesForUserHandler,
  getRoleIdsForUserHandler,
  getUsersForRoleHandler,
  checkUserHasRoleHandler,
  checkUserHasAnyRoleHandler,
  getUserCountForRoleHandler,
  getRoleCountForUserHandler,
  getUserRoleStatsHandler,
  createUserRoleHandler,
  removeRoleFromUserHandler,
  removeAllRolesFromUserHandler,
  replaceUserRolesHandler
} from '../controllers/userRoleController.js';

const router = Router();

// GET /api/user-roles - List user-role assignments with pagination
router.get('/', listUserRoles);

// GET /api/user-roles/count - Get user-role assignment count
router.get('/count', countUserRoles);

// GET /api/user-roles/:id - Get a single user-role assignment by ID
router.get('/:id', getSingleUserRole);

// GET /api/user-roles/user/:userId/role/:roleId - Get user-role assignment by user and role
router.get('/user/:userId/role/:roleId', getUserRoleByUserAndRoleHandler);

// GET /api/user-roles/user/:userId - Get all roles for a user
router.get('/user/:userId', getRolesForUserHandler);

// GET /api/user-roles/user/:userId/ids - Get role IDs for a user
router.get('/user/:userId/ids', getRoleIdsForUserHandler);

// GET /api/user-roles/role/:roleId - Get all users for a role
router.get('/role/:roleId', getUsersForRoleHandler);

// GET /api/user-roles/user/:userId/has-role/:roleId - Check if user has role
router.get('/user/:userId/has-role/:roleId', checkUserHasRoleHandler);

// POST /api/user-roles/user/:userId/has-any-role - Check if user has any of the given roles
router.post('/user/:userId/has-any-role', checkUserHasAnyRoleHandler);

// GET /api/user-roles/role/:roleId/users/count - Get user count for a role
router.get('/role/:roleId/users/count', getUserCountForRoleHandler);

// GET /api/user-roles/user/:userId/roles/count - Get role count for a user
router.get('/user/:userId/roles/count', getRoleCountForUserHandler);

// GET /api/user-roles/statistics - Get user-role statistics
router.get('/statistics', getUserRoleStatsHandler);

// POST /api/user-roles - Assign role to user
router.post('/', createUserRoleHandler);

// DELETE /api/user-roles/user/:userId/role/:roleId - Remove role from user
router.delete('/user/:userId/role/:roleId', removeRoleFromUserHandler);

// DELETE /api/user-roles/user/:userId - Remove all roles from user
router.delete('/user/:userId', removeAllRolesFromUserHandler);

// PUT /api/user-roles/user/:userId - Replace all roles for a user
router.put('/user/:userId', replaceUserRolesHandler);

export default router;
