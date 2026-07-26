/**
 * UserRole Controller
 * HTTP request handlers for user-role assignment endpoints
 * 
 * Handles:
 * - RESTful CRUD operations for user-role assignments
 * - Request/response handling
 * - Error handling with appropriate HTTP status codes
 * - User-role validation and management
 */

import {
  validateUserRoleAssignment,
  assignRoleToUser,
  getUserRoleById,
  getUserRoleByUserAndRole,
  getRolesByUserId,
  getRoleIdsByUserId,
  getUsersByRoleId,
  getPaginatedUserRoles,
  getAllUserRoles,
  removeRoleFromUser,
  removeAllRolesFromUser,
  userHasRole,
  userHasAnyRole,
  getUserRoleCount,
  getUserCountForRole,
  getRoleCountForUser,
  replaceUserRoles,
  getUserRoleStatistics,
  USER_ROLES_TABLE,
  USER_ROLE_FIELDS
} from '../services/userRoleService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List user-role assignments with pagination
 * GET /api/user-roles
 */
export const listUserRoles = (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };

    const result = getPaginatedUserRoles(options);
    res.json({
      success: true,
      data: result.userRoles,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Count user-role assignments
 * GET /api/user-roles/count
 */
export const countUserRoles = (req, res) => {
  try {
    const count = getUserRoleCount();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user-role assignment by ID
 * GET /api/user-roles/:id
 */
export const getSingleUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const userRole = getUserRoleById(parseInt(id));
    
    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: `User-role assignment with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: userRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user-role assignment by user and role
 * GET /api/user-roles/user/:userId/role/:roleId
 */
export const getUserRoleByUserAndRoleHandler = (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const userRole = getUserRoleByUserAndRole(parseInt(userId), parseInt(roleId));
    
    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: `User-role assignment for user ${userId} and role ${roleId} not found`
      });
    }

    res.json({
      success: true,
      data: userRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all roles for a user
 * GET /api/user-roles/user/:userId
 */
export const getRolesForUserHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const roles = getRolesByUserId(parseInt(userId));
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get role IDs for a user
 * GET /api/user-roles/user/:userId/ids
 */
export const getRoleIdsForUserHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const roleIds = getRoleIdsByUserId(parseInt(userId));
    
    res.json({
      success: true,
      data: roleIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all users for a role
 * GET /api/user-roles/role/:roleId
 */
export const getUsersForRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const userIds = getUsersByRoleId(parseInt(roleId));
    
    res.json({
      success: true,
      data: userIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user has role
 * GET /api/user-roles/user/:userId/has-role/:roleId
 */
export const checkUserHasRoleHandler = (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const hasRole = userHasRole(parseInt(userId), parseInt(roleId));
    
    res.json({
      success: true,
      hasRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user has any of the given roles
 * POST /api/user-roles/user/:userId/has-any-role
 */
export const checkUserHasAnyRoleHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body;
    
    if (!roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        error: 'roleIds array is required'
      });
    }

    const hasAnyRole = userHasAnyRole(parseInt(userId), roleIds);
    
    res.json({
      success: true,
      hasAnyRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user count for a role
 * GET /api/user-roles/role/:roleId/users/count
 */
export const getUserCountForRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const count = getUserCountForRole(parseInt(roleId));
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get role count for a user
 * GET /api/user-roles/user/:userId/roles/count
 */
export const getRoleCountForUserHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const count = getRoleCountForUser(parseInt(userId));
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user-role statistics
 * GET /api/user-roles/statistics
 */
export const getUserRoleStatsHandler = (req, res) => {
  try {
    const stats = getUserRoleStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Assign role to user
 * POST /api/user-roles
 */
export const createUserRoleHandler = async (req, res) => {
  try {
    const data = req.body;
    
    const userRole = await assignRoleToUser(data);
    res.status(201).json({
      success: true,
      data: userRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove role from user
 * DELETE /api/user-roles/user/:userId/role/:roleId
 */
export const removeRoleFromUserHandler = (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const removed = removeRoleFromUser(parseInt(userId), parseInt(roleId));
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: `User-role assignment for user ${userId} and role ${roleId} not found`
      });
    }

    res.json({
      success: true,
      message: `Role ${roleId} removed from user ${userId} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove all roles from user
 * DELETE /api/user-roles/user/:userId
 */
export const removeAllRolesFromUserHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const removed = removeAllRolesFromUser(parseInt(userId));
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: `User ${userId} has no roles to remove`
      });
    }

    res.json({
      success: true,
      message: `All roles removed from user ${userId} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Replace all roles for a user
 * PUT /api/user-roles/user/:userId
 */
export const replaceUserRolesHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleIds, assignedBy } = req.body;
    
    if (!roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        error: 'roleIds array is required'
      });
    }

    const assignments = await replaceUserRoles(parseInt(userId), roleIds, assignedBy);
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  USER_ROLES_TABLE,
  USER_ROLE_FIELDS,
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
};
