/**
 * RolePermission Controller
 * HTTP request handlers for role-permission assignment endpoints
 * 
 * Handles:
 * - RESTful CRUD operations for role-permission assignments
 * - Request/response handling
 * - Error handling with appropriate HTTP status codes
 * - Role-permission validation and management
 */

import {
  validateRolePermissionAssignment,
  assignPermissionToRole,
  getRolePermissionById,
  getRolePermissionByRoleAndPermission,
  getPermissionsByRoleId,
  getPermissionIdsByRoleId,
  getRolesByPermissionId,
  getPaginatedRolePermissions,
  getAllRolePermissions,
  removePermissionFromRole,
  removeAllPermissionsFromRole,
  roleHasPermission,
  roleHasAnyPermission,
  getRolePermissionCount,
  getPermissionCountForRole,
  getRoleCountForPermission,
  replaceRolePermissions,
  getRolePermissionStatistics,
  ROLE_PERMISSIONS_TABLE,
  ROLE_PERMISSION_FIELDS
} from '../services/rolePermissionService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List role-permission assignments with pagination
 * GET /api/role-permissions
 */
export const listRolePermissions = (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };

    const result = getPaginatedRolePermissions(options);
    res.json({
      success: true,
      data: result.rolePermissions,
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
 * Count role-permission assignments
 * GET /api/role-permissions/count
 */
export const countRolePermissions = (req, res) => {
  try {
    const count = getRolePermissionCount();
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
 * Get role-permission assignment by ID
 * GET /api/role-permissions/:id
 */
export const getSingleRolePermission = (req, res) => {
  try {
    const { id } = req.params;
    const rolePermission = getRolePermissionById(parseInt(id));
    
    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        error: `Role-permission assignment with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: rolePermission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get role-permission assignment by role and permission
 * GET /api/role-permissions/role/:roleId/permission/:permissionId
 */
export const getRolePermissionByRoleAndPermissionHandler = (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    const rolePermission = getRolePermissionByRoleAndPermission(parseInt(roleId), parseInt(permissionId));
    
    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        error: `Role-permission assignment for role ${roleId} and permission ${permissionId} not found`
      });
    }

    res.json({
      success: true,
      data: rolePermission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all permissions for a role
 * GET /api/role-permissions/role/:roleId
 */
export const getPermissionsForRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const permissions = getPermissionsByRoleId(parseInt(roleId));
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get permission IDs for a role
 * GET /api/role-permissions/role/:roleId/ids
 */
export const getPermissionIdsForRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const permissionIds = getPermissionIdsByRoleId(parseInt(roleId));
    
    res.json({
      success: true,
      data: permissionIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all roles for a permission
 * GET /api/role-permissions/permission/:permissionId
 */
export const getRolesForPermissionHandler = (req, res) => {
  try {
    const { permissionId } = req.params;
    const roleIds = getRolesByPermissionId(parseInt(permissionId));
    
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
 * Check if role has permission
 * GET /api/role-permissions/role/:roleId/has-permission/:permissionId
 */
export const checkRoleHasPermissionHandler = (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    const hasPermission = roleHasPermission(parseInt(roleId), parseInt(permissionId));
    
    res.json({
      success: true,
      hasPermission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if role has any of the given permissions
 * POST /api/role-permissions/role/:roleId/has-any-permission
 */
export const checkRoleHasAnyPermissionHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        error: 'permissionIds array is required'
      });
    }

    const hasAnyPermission = roleHasAnyPermission(parseInt(roleId), permissionIds);
    
    res.json({
      success: true,
      hasAnyPermission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get permission count for a role
 * GET /api/role-permissions/role/:roleId/permissions/count
 */
export const getPermissionCountForRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const count = getPermissionCountForRole(parseInt(roleId));
    
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
 * Get role count for a permission
 * GET /api/role-permissions/permission/:permissionId/roles/count
 */
export const getRoleCountForPermissionHandler = (req, res) => {
  try {
    const { permissionId } = req.params;
    const count = getRoleCountForPermission(parseInt(permissionId));
    
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
 * Get role-permission statistics
 * GET /api/role-permissions/statistics
 */
export const getRolePermissionStatsHandler = (req, res) => {
  try {
    const stats = getRolePermissionStatistics();
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
 * Assign permission to role
 * POST /api/role-permissions
 */
export const createRolePermissionHandler = async (req, res) => {
  try {
    const data = req.body;
    
    const rolePermission = await assignPermissionToRole(data);
    res.status(201).json({
      success: true,
      data: rolePermission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove permission from role
 * DELETE /api/role-permissions/role/:roleId/permission/:permissionId
 */
export const removePermissionFromRoleHandler = (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    const removed = removePermissionFromRole(parseInt(roleId), parseInt(permissionId));
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: `Role-permission assignment for role ${roleId} and permission ${permissionId} not found`
      });
    }

    res.json({
      success: true,
      message: `Permission ${permissionId} removed from role ${roleId} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove all permissions from role
 * DELETE /api/role-permissions/role/:roleId
 */
export const removeAllPermissionsFromRoleHandler = (req, res) => {
  try {
    const { roleId } = req.params;
    const removed = removeAllPermissionsFromRole(parseInt(roleId));
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: `Role ${roleId} has no permissions to remove`
      });
    }

    res.json({
      success: true,
      message: `All permissions removed from role ${roleId} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Replace all permissions for a role
 * PUT /api/role-permissions/role/:roleId
 */
export const replaceRolePermissionsHandler = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds, assignedBy } = req.body;
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        error: 'permissionIds array is required'
      });
    }

    const assignments = await replaceRolePermissions(parseInt(roleId), permissionIds, assignedBy);
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
  ROLE_PERMISSIONS_TABLE,
  ROLE_PERMISSION_FIELDS,
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
};
