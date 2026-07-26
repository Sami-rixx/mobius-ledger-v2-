/**
 * Permission Controller
 * HTTP request handlers for permission endpoints
 * 
 * Handles:
 * - RESTful CRUD operations for permissions
 * - Request/response handling
 * - Error handling with appropriate HTTP status codes
 * - Permission validation and management
 */

import {
  validatePermission,
  createPermission,
  getPermissionById,
  getPermissionByName,
  getPaginatedPermissions,
  getAllPermissions,
  getPermissionsByModule,
  updatePermission,
  deletePermission,
  permissionExists,
  getPermissionCount,
  getPermissionCountByModule,
  searchPermissions,
  getPermissionModules,
  getPermissionStatistics,
  PERMISSIONS_TABLE,
  PERMISSION_FIELDS
} from '../services/permissionService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List permissions with pagination and filtering
 * GET /api/permissions
 */
export const listPermissions = (req, res) => {
  try {
    const {
      module,
      includeInactive,
      search,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE
    } = req.query;

    const options = {
      module,
      includeInactive: includeInactive ? JSON.parse(includeInactive) : false,
      search,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };

    const result = getPaginatedPermissions(options);
    res.json({
      success: true,
      data: result.permissions,
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
 * Count permissions
 * GET /api/permissions/count
 */
export const countPermissions = (req, res) => {
  try {
    const { module } = req.query;
    const count = getPermissionCount(module || null);
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
 * Get permission by ID
 * GET /api/permissions/:id
 */
export const getSinglePermission = (req, res) => {
  try {
    const { id } = req.params;
    const permission = getPermissionById(parseInt(id));
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: `Permission with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get permission by name
 * GET /api/permissions/name/:name
 */
export const getPermissionByNameHandler = (req, res) => {
  try {
    const { name } = req.params;
    const permission = getPermissionByName(name);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: `Permission with name '${name}' not found`
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get permissions by module
 * GET /api/permissions/module/:module
 */
export const getPermissionsByModuleHandler = (req, res) => {
  try {
    const { module } = req.params;
    const { includeInactive } = req.query;
    const permissions = getPermissionsByModule(module, includeInactive ? JSON.parse(includeInactive) : false);
    
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
 * Check if permission exists
 * GET /api/permissions/check/:name
 */
export const checkPermissionExists = (req, res) => {
  try {
    const { name } = req.params;
    const exists = permissionExists(name);
    
    res.json({
      success: true,
      exists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search permissions
 * GET /api/permissions/search
 */
export const searchPermissionsHandler = (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required'
      });
    }

    const permissions = searchPermissions(searchTerm);
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
 * Get permission statistics
 * GET /api/permissions/statistics
 */
export const getPermissionStatsHandler = (req, res) => {
  try {
    const stats = getPermissionStatistics();
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
 * Get permission modules
 * GET /api/permissions/modules
 */
export const getPermissionModulesHandler = (req, res) => {
  try {
    const modules = getPermissionModules();
    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get permission count by module
 * GET /api/permissions/count-by-module
 */
export const getPermissionCountByModuleHandler = (req, res) => {
  try {
    const countByModule = getPermissionCountByModule();
    res.json({
      success: true,
      data: countByModule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new permission
 * POST /api/permissions
 */
export const createPermissionHandler = async (req, res) => {
  try {
    const data = req.body;
    
    const permission = await createPermission(data);
    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update permission
 * PUT /api/permissions/:id
 */
export const updatePermissionHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const permission = await updatePermission(parseInt(id), data);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: `Permission with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete permission
 * DELETE /api/permissions/:id
 */
export const deletePermissionHandler = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deletePermission(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Permission with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: `Permission with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  PERMISSIONS_TABLE,
  PERMISSION_FIELDS,
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
};
