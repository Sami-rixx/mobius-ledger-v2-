/**
 * Permission Service
 * Business logic layer for permission management
 * 
 * Handles:
 * - Permission validation
 * - Business rule enforcement
 * - Pagination
 * - Advanced filtering and search
 * - Permission lifecycle management
 */

import {
  createPermission as createPermissionModel,
  getPermissionById as getPermissionByIdModel,
  getPermissionByName as getPermissionByNameModel,
  getAllPermissions as getAllPermissionsModel,
  getPermissionsByModule as getPermissionsByModuleModel,
  updatePermission as updatePermissionModel,
  deletePermission as deletePermissionModel,
  permissionExists as permissionExistsModel,
  getPermissionCount as getPermissionCountModel,
  getPermissionCountByModule as getPermissionCountByModuleModel,
  searchPermissions as searchPermissionsModel,
  PERMISSIONS_TABLE,
  PERMISSION_FIELDS,
  PERMISSION_MODULES
} from '../models/Permission.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validation constants
 */
const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 150,
  DESCRIPTION_MAX_LENGTH: 500,
  MODULE_MAX_LENGTH: 50
};

/**
 * Validate permission data
 * @param {Object} data - Permission data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result with isValid and errors
 */
export const validatePermission = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim() === '') {
      errors.push('Permission name is required');
    } else {
      const name = data.name.trim();
      if (name.length < VALIDATION.NAME_MIN_LENGTH) {
        errors.push(`Permission name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`);
      }
      if (name.length > VALIDATION.NAME_MAX_LENGTH) {
        errors.push(`Permission name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters`);
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(name)) {
        errors.push('Permission name must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens');
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

  if (!isUpdate || data.module !== undefined) {
    if (!data.module || data.module.trim() === '') {
      errors.push('Module is required');
    } else if (data.module.length > VALIDATION.MODULE_MAX_LENGTH) {
      errors.push(`Module must be at most ${VALIDATION.MODULE_MAX_LENGTH} characters`);
    }
  }

  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new permission with validation
 * @param {Object} data - Permission data
 * @returns {Object} - Created permission or validation errors
 */
export const createPermission = async (data) => {
  const validation = validatePermission(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if permission with same name already exists
  if (await permissionExistsModel(data.name)) {
    throw new Error(`Permission with name '${data.name}' already exists`);
  }

  return createPermissionModel(data);
};

/**
 * Get permission by ID
 * @param {number} id - Permission ID
 * @returns {Object|null} - Permission record or null
 */
export const getPermissionById = (id) => {
  return getPermissionByIdModel(id);
};

/**
 * Get permission by name
 * @param {string} name - Permission name
 * @returns {Object|null} - Permission record or null
 */
export const getPermissionByName = (name) => {
  return getPermissionByNameModel(name);
};

/**
 * Get paginated permissions
 * @param {Object} options - Pagination and filtering options
 * @param {number} options.page - Page number (default: DEFAULT_PAGE)
 * @param {number} options.pageSize - Items per page (default: DEFAULT_PAGE_SIZE)
 * @param {string} options.module - Optional module filter
 * @param {boolean} options.includeInactive - Include inactive permissions (default: false)
 * @param {string} options.search - Optional search term
 * @returns {Object} - Paginated results with permissions and total count
 */
export const getPaginatedPermissions = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    module,
    includeInactive = false,
    search
  } = options;

  const offset = (page - 1) * pageSize;

  let permissions;
  let totalCount;

  if (search) {
    permissions = searchPermissionsModel(search);
    totalCount = permissions.length;
    permissions = permissions.slice(offset, offset + pageSize);
  } else if (module) {
    permissions = getPermissionsByModuleModel(module, includeInactive);
    totalCount = permissions.length;
    permissions = permissions.slice(offset, offset + pageSize);
  } else {
    permissions = getAllPermissionsModel(includeInactive);
    totalCount = getPermissionCountModel();
    permissions = permissions.slice(offset, offset + pageSize);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    permissions,
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
 * Get all permissions
 * @param {boolean} includeInactive - Include inactive permissions (default: false)
 * @returns {Array} - Array of permission records
 */
export const getAllPermissions = (includeInactive = false) => {
  return getAllPermissionsModel(includeInactive);
};

/**
 * Get permissions by module
 * @param {string} module - Module name
 * @param {boolean} includeInactive - Include inactive permissions (default: false)
 * @returns {Array} - Array of permission records
 */
export const getPermissionsByModule = (module, includeInactive = false) => {
  return getPermissionsByModuleModel(module, includeInactive);
};

/**
 * Update permission with validation
 * @param {number} id - Permission ID
 * @param {Object} data - Updated permission data
 * @returns {Object} - Updated permission or validation errors
 */
export const updatePermission = async (id, data) => {
  const existingPermission = getPermissionByIdModel(id);
  if (!existingPermission) {
    throw new Error(`Permission with ID ${id} not found`);
  }

  const validation = validatePermission(data, true);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if another permission with same name exists
  if (data.name && data.name !== existingPermission.name && data.name.trim() !== '') {
    if (await permissionExistsModel(data.name)) {
      throw new Error(`Permission with name '${data.name}' already exists`);
    }
  }

  return updatePermissionModel(id, data);
};

/**
 * Delete permission
 * @param {number} id - Permission ID
 * @returns {boolean} - Success status
 */
export const deletePermission = (id) => {
  return deletePermissionModel(id);
};

/**
 * Check if permission exists by name
 * @param {string} name - Permission name
 * @returns {boolean} - Existence status
 */
export const permissionExists = (name) => {
  return permissionExistsModel(name);
};

/**
 * Get permission count
 * @param {string|null} module - Optional module filter
 * @returns {number} - Count of permissions
 */
export const getPermissionCount = (module = null) => {
  return getPermissionCountModel(module);
};

/**
 * Get permission count by module
 * @returns {Array} - Array of objects with module and count
 */
export const getPermissionCountByModule = () => {
  return getPermissionCountByModuleModel();
};

/**
 * Search permissions
 * @param {string} searchTerm - Search term
 * @returns {Array} - Array of matching permission records
 */
export const searchPermissions = (searchTerm) => {
  return searchPermissionsModel(searchTerm);
};

/**
 * Get all available permission modules
 * @returns {Object} - Permission modules object
 */
export const getPermissionModules = () => {
  return PERMISSION_MODULES;
};

/**
 * Get statistics for permissions
 * @returns {Object} - Permission statistics
 */
export const getPermissionStatistics = () => {
  const allPermissions = getAllPermissionsModel(true);
  const activePermissions = getAllPermissionsModel(false);
  const countByModule = getPermissionCountByModuleModel();

  return {
    total: allPermissions.length,
    active: activePermissions.length,
    inactive: allPermissions.length - activePermissions.length,
    modules: countByModule,
    moduleCount: countByModule.length
  };
};

export default {
  PERMISSIONS_TABLE,
  PERMISSION_FIELDS,
  PERMISSION_MODULES,
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
  getPermissionStatistics
};
