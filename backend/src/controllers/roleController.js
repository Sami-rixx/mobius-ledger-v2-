/**
 * Role Controller
 * HTTP request handlers for role endpoints
 * 
 * Handles:
 * - RESTful CRUD operations for roles
 * - Request/response handling
 * - Error handling with appropriate HTTP status codes
 * - Role validation and management
 */

import {
  validateRole,
  createRole,
  getRoleById,
  getRoleByName,
  getPaginatedRoles,
  getAllRoles,
  getDefaultRole,
  updateRole,
  deleteRole,
  roleExists,
  getRoleCount,
  setDefaultRole,
  searchRoles,
  getRolesWithPermissionCount,
  getDefaultRoleNames,
  getRoleStatistics,
  ROLES_TABLE,
  ROLE_FIELDS
} from '../services/roleService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List roles with pagination and filtering
 * GET /api/roles
 */
export const listRoles = (req, res) => {
  try {
    const {
      includeInactive,
      search,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE
    } = req.query;

    const options = {
      includeInactive: includeInactive ? JSON.parse(includeInactive) : false,
      search,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };

    const result = getPaginatedRoles(options);
    res.json({
      success: true,
      data: result.roles,
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
 * Count roles
 * GET /api/roles/count
 */
export const countRoles = (req, res) => {
  try {
    const count = getRoleCount();
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
 * Get role by ID
 * GET /api/roles/:id
 */
export const getSingleRole = (req, res) => {
  try {
    const { id } = req.params;
    const role = getRoleById(parseInt(id));
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: `Role with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get role by name
 * GET /api/roles/name/:name
 */
export const getRoleByNameHandler = (req, res) => {
  try {
    const { name } = req.params;
    const role = getRoleByName(name);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: `Role with name '${name}' not found`
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get default role
 * GET /api/roles/default
 */
export const getDefaultRoleHandler = (req, res) => {
  try {
    const role = getDefaultRole();
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'No default role found'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if role exists
 * GET /api/roles/check/:name
 */
export const checkRoleExists = (req, res) => {
  try {
    const { name } = req.params;
    const exists = roleExists(name);
    
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
 * Search roles
 * GET /api/roles/search
 */
export const searchRolesHandler = (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required'
      });
    }

    const roles = searchRoles(searchTerm);
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
 * Get roles with permission count
 * GET /api/roles/with-permissions
 */
export const getRolesWithPermissionCountHandler = (req, res) => {
  try {
    const roles = getRolesWithPermissionCount();
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
 * Get role statistics
 * GET /api/roles/statistics
 */
export const getRoleStatsHandler = (req, res) => {
  try {
    const stats = getRoleStatistics();
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
 * Get default role names
 * GET /api/roles/default-names
 */
export const getDefaultRoleNamesHandler = (req, res) => {
  try {
    const names = getDefaultRoleNames();
    res.json({
      success: true,
      data: names
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new role
 * POST /api/roles
 */
export const createRoleHandler = async (req, res) => {
  try {
    const data = req.body;
    
    const role = await createRole(data);
    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update role
 * PUT /api/roles/:id
 */
export const updateRoleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const role = await updateRole(parseInt(id), data);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: `Role with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete role
 * DELETE /api/roles/:id
 */
export const deleteRoleHandler = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteRole(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Role with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: `Role with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Set default role
 * POST /api/roles/set-default
 */
export const setDefaultRoleHandler = (req, res) => {
  try {
    const { roleId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: 'roleId is required'
      });
    }

    const updated = setDefaultRole(parseInt(roleId));
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Role with ID ${roleId} not found`
      });
    }

    res.json({
      success: true,
      message: `Role with ID ${roleId} set as default`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  ROLES_TABLE,
  ROLE_FIELDS,
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
};
