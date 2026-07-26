/**
 * Role Service
 * Business logic layer for role management
 * 
 * Handles:
 * - Role validation
 * - Business rule enforcement
 * - Pagination
 * - Advanced filtering and search
 * - Role lifecycle management
 * - Default role management
 */

import {
  createRole as createRoleModel,
  getRoleById as getRoleByIdModel,
  getRoleByName as getRoleByNameModel,
  getAllRoles as getAllRolesModel,
  getDefaultRole as getDefaultRoleModel,
  updateRole as updateRoleModel,
  deleteRole as deleteRoleModel,
  roleExists as roleExistsModel,
  getRoleCount as getRoleCountModel,
  setDefaultRole as setDefaultRoleModel,
  searchRoles as searchRolesModel,
  getRolesWithPermissionCount as getRolesWithPermissionCountModel,
  ROLES_TABLE,
  ROLE_FIELDS,
  DEFAULT_ROLES
} from '../models/Role.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validation constants
 */
const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500
};

/**
 * Validate role data
 * @param {Object} data - Role data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateRole = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim() === '') {
      errors.push('Role name is required');
    } else {
      const name = data.name.trim();
      if (name.length < VALIDATION.NAME_MIN_LENGTH) {
        errors.push(`Role name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`);
      }
      if (name.length > VALIDATION.NAME_MAX_LENGTH) {
        errors.push(`Role name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters`);
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(name)) {
        errors.push('Role name must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens');
      }
    }
  }

  if (!isUpdate || data.displayName !== undefined) {
    if (!data.displayName || data.displayName.trim() === '') {
      errors.push('Display name is required');
    } else {
      const displayName = data.displayName.trim();
      if (displayName.length < VALIDATION.DISPLAY_NAME_MIN_LENGTH) {
        errors.push(`Display name must be at least ${VALIDATION.DISPLAY_NAME_MIN_LENGTH} characters`);
      }
      if (displayName.length > VALIDATION.DISPLAY_NAME_MAX_LENGTH) {
        errors.push(`Display name must be at most ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} characters`);
      }
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (data.description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description must be at most ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`);
    }
  }

  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (data.isDefault !== undefined && typeof data.isDefault !== 'boolean') {
    errors.push('isDefault must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new role with validation
 * @param {Object} data - Role data
 * @returns {Object} - Created role or validation errors
 */
export const createRole = async (data) => {
  const validation = validateRole(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if role with same name already exists
  if (await roleExistsModel(data.name)) {
    throw new Error(`Role with name '${data.name}' already exists`);
  }

  // If this is the first role, set it as default
  const currentRoleCount = getRoleCountModel();
  if (currentRoleCount === 0 && data.isDefault !== true) {
    data.isDefault = true;
  }

  // If setting as default, clear other defaults
  if (data.isDefault === true) {
    setDefaultRoleModel(null);
  }

  return createRoleModel(data);
};

/**
 * Get role by ID
 * @param {number} id - Role ID
 * @returns {Object|null} - Role record or null
 */
export const getRoleById = (id) => {
  return getRoleByIdModel(id);
};

/**
 * Get role by name
 * @param {string} name - Role name
 * @returns {Object|null} - Role record or null
 */
export const getRoleByName = (name) => {
  return getRoleByNameModel(name);
};

/**
 * Get paginated roles
 * @param {Object} options - Pagination and filtering options
 * @param {number} options.page - Page number (default: DEFAULT_PAGE)
 * @param {number} options.pageSize - Items per page (default: DEFAULT_PAGE_SIZE)
 * @param {boolean} options.includeInactive - Include inactive roles (default: false)
 * @param {string} options.search - Optional search term
 * @returns {Object} - Paginated results with roles and total count
 */
export const getPaginatedRoles = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    includeInactive = false,
    search
  } = options;

  const offset = (page - 1) * pageSize;

  let roles;
  let totalCount;

  if (search) {
    roles = searchRolesModel(search);
    totalCount = roles.length;
    roles = roles.slice(offset, offset + pageSize);
  } else {
    roles = getAllRolesModel(includeInactive);
    totalCount = getRoleCountModel();
    roles = roles.slice(offset, offset + pageSize);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    roles,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Get all roles
 * @param {boolean} includeInactive - Include inactive roles (default: false)
 * @returns {Array} - Array of role records
 */
export const getAllRoles = (includeInactive = false) => {
  return getAllRolesModel(includeInactive);
};

/**
 * Get default role
 * @returns {Object|null} - Default role record or null
 */
export const getDefaultRole = () => {
  return getDefaultRoleModel();
};

/**
 * Update role with validation
 * @param {number} id - Role ID
 * @param {Object} data - Updated role data
 * @returns {Object} - Updated role or validation errors
 */
export const updateRole = async (id, data) => {
  const existingRole = getRoleByIdModel(id);
  if (!existingRole) {
    throw new Error(`Role with ID ${id} not found`);
  }

  const validation = validateRole(data, true);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if another role with same name exists
  if (data.name && data.name !== existingRole.name && data.name.trim() !== '') {
    if (await roleExistsModel(data.name)) {
      throw new Error(`Role with name '${data.name}' already exists`);
    }
  }

  // If setting as default, clear other defaults
  if (data.isDefault === true && !existingRole.is_default) {
    setDefaultRoleModel(id);
  }

  return updateRoleModel(id, data);
};

/**
 * Delete role
 * @param {number} id - Role ID
 * @returns {boolean} - Success status
 */
export const deleteRole = (id) => {
  // Prevent deleting the default role
  const role = getRoleByIdModel(id);
  if (role && role.is_default === 1) {
    throw new Error('Cannot delete the default role. Set another role as default first.');
  }

  return deleteRoleModel(id);
};

/**
 * Check if role exists by name
 * @param {string} name - Role name
 * @returns {boolean} - Existence status
 */
export const roleExists = (name) => {
  return roleExistsModel(name);
};

/**
 * Get role count
 * @returns {number} - Count of roles
 */
export const getRoleCount = () => {
  return getRoleCountModel();
};

/**
 * Set default role
 * @param {number} roleId - Role ID to set as default
 * @returns {boolean} - Success status
 */
export const setDefaultRole = (roleId) => {
  const role = getRoleByIdModel(roleId);
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`);
  }

  return setDefaultRoleModel(roleId);
};

/**
 * Search roles
 * @param {string} searchTerm - Search term
 * @returns {Array} - Array of matching role records
 */
export const searchRoles = (searchTerm) => {
  return searchRolesModel(searchTerm);
};

/**
 * Get roles with permission count
 * @returns {Array} - Array of roles with permission count
 */
export const getRolesWithPermissionCount = () => {
  return getRolesWithPermissionCountModel();
};

/**
 * Get all default role names
 * @returns {Object} - Default role names object
 */
export const getDefaultRoleNames = () => {
  return DEFAULT_ROLES;
};

/**
 * Get statistics for roles
 * @returns {Object} - Role statistics
 */
export const getRoleStatistics = () => {
  const allRoles = getAllRolesModel(true);
  const activeRoles = getAllRolesModel(false);
  const defaultRole = getDefaultRoleModel();

  return {
    total: allRoles.length,
    active: activeRoles.length,
    inactive: allRoles.length - activeRoles.length,
    defaultRole: defaultRole ? {
      id: defaultRole.id,
      name: defaultRole.name,
      displayName: defaultRole.display_name
    } : null
  };
};

export default {
  ROLES_TABLE,
  ROLE_FIELDS,
  DEFAULT_ROLES,
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
  getRoleStatistics
};
