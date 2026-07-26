/**
 * UserRole Service
 * Business logic layer for user-role assignment management
 * 
 * Handles:
 * - User-role validation
 * - Business rule enforcement
 * - Pagination
 * - Advanced filtering and search
 * - User-role lifecycle management
 */

import {
  assignRoleToUser as assignRoleToUserModel,
  getUserRoleById as getUserRoleByIdModel,
  getUserRoleByUserAndRole as getUserRoleByUserAndRoleModel,
  getRolesByUserId as getRolesByUserIdModel,
  getRoleIdsByUserId as getRoleIdsByUserIdModel,
  getUsersByRoleId as getUsersByRoleIdModel,
  getAllUserRoles as getAllUserRolesModel,
  removeRoleFromUser as removeRoleFromUserModel,
  removeAllRolesFromUser as removeAllRolesFromUserModel,
  userHasRole as userHasRoleModel,
  userHasAnyRole as userHasAnyRoleModel,
  getUserRoleCount as getUserRoleCountModel,
  getUserCountForRole as getUserCountForRoleModel,
  getRoleCountForUser as getRoleCountForUserModel,
  replaceUserRoles as replaceUserRolesModel,
  USER_ROLES_TABLE,
  USER_ROLE_FIELDS
} from '../models/UserRole.js';

import { getRoleById as getRoleByIdModel } from '../models/Role.js';
// Note: User.js model not yet created, user validation deferred to database constraints

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate user-role assignment data
 * @param {Object} data - Assignment data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateUserRoleAssignment = (data) => {
  const errors = [];

  if (!data.userId) {
    errors.push('User ID is required');
  } else {
    const userId = parseInt(data.userId);
    if (isNaN(userId) || userId < 1) {
      errors.push('User ID must be a valid positive number');
    }
  }

  if (!data.roleId) {
    errors.push('Role ID is required');
  } else {
    const roleId = parseInt(data.roleId);
    if (isNaN(roleId) || roleId < 1) {
      errors.push('Role ID must be a valid positive number');
    }
  }

  if (data.assignedBy !== undefined && data.assignedBy !== null) {
    const assignedBy = parseInt(data.assignedBy);
    if (isNaN(assignedBy) || assignedBy < 1) {
      errors.push('Assigned by must be a valid positive number or null');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Assign role to user with validation
 * @param {Object} data - Assignment data
 * @returns {Object} - Created assignment or validation errors
 */
export const assignRoleToUser = async (data) => {
  const validation = validateUserRoleAssignment(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if role exists
  const role = getRoleByIdModel(data.roleId);
  if (!role) {
    throw new Error(`Role with ID ${data.roleId} not found`);
  }

  // User validation deferred to database foreign key constraints
  return assignRoleToUserModel(data);
};

/**
 * Get user-role assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Object|null} - User-role record or null
 */
export const getUserRoleById = (id) => {
  return getUserRoleByIdModel(id);
};

/**
 * Get user-role assignment by user and role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Object|null} - User-role record or null
 */
export const getUserRoleByUserAndRole = (userId, roleId) => {
  return getUserRoleByUserAndRoleModel(userId, roleId);
};

/**
 * Get all roles for a user (with role details)
 * @param {number} userId - User ID
 * @returns {Array} - Array of role records with assignment info
 */
export const getRolesByUserId = (userId) => {
  return getRolesByUserIdModel(userId);
};

/**
 * Get role IDs for a user
 * @param {number} userId - User ID
 * @returns {Array} - Array of role IDs
 */
export const getRoleIdsByUserId = (userId) => {
  return getRoleIdsByUserIdModel(userId);
};

/**
 * Get all users for a role
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of user IDs
 */
export const getUsersByRoleId = (roleId) => {
  return getUsersByRoleIdModel(roleId);
};

/**
 * Get paginated user-role assignments
 * @param {Object} options - Pagination and filtering options
 * @param {number} options.page - Page number (default: DEFAULT_PAGE)
 * @param {number} options.pageSize - Items per page (default: DEFAULT_PAGE_SIZE)
 * @returns {Object} - Paginated results with assignments and total count
 */
export const getPaginatedUserRoles = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE
  } = options;

  const allAssignments = getAllUserRolesModel();
  const totalCount = allAssignments.length;
  const offset = (page - 1) * pageSize;
  const assignments = allAssignments.slice(offset, offset + pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    userRoles: assignments,
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
 * Get all user-role assignments
 * @returns {Array} - Array of all user-role records
 */
export const getAllUserRoles = () => {
  return getAllUserRolesModel();
};

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {boolean} - Success status
 */
export const removeRoleFromUser = (userId, roleId) => {
  return removeRoleFromUserModel(userId, roleId);
};

/**
 * Remove all roles from user
 * @param {number} userId - User ID
 * @returns {boolean} - Success status
 */
export const removeAllRolesFromUser = (userId) => {
  return removeAllRolesFromUserModel(userId);
};

/**
 * Check if user has role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {boolean} - Has role status
 */
export const userHasRole = (userId, roleId) => {
  return userHasRoleModel(userId, roleId);
};

/**
 * Check if user has any of the given roles
 * @param {number} userId - User ID
 * @param {Array} roleIds - Array of role IDs
 * @returns {boolean} - Has any role status
 */
export const userHasAnyRole = (userId, roleIds) => {
  return userHasAnyRoleModel(userId, roleIds);
};

/**
 * Get user-role count
 * @returns {number} - Count of user-role assignments
 */
export const getUserRoleCount = () => {
  return getUserRoleCountModel();
};

/**
 * Get user count for a role
 * @param {number} roleId - Role ID
 * @returns {number} - Count of users with this role
 */
export const getUserCountForRole = (roleId) => {
  return getUserCountForRoleModel(roleId);
};

/**
 * Get role count for a user
 * @param {number} userId - User ID
 * @returns {number} - Count of roles assigned to user
 */
export const getRoleCountForUser = (userId) => {
  return getRoleCountForUserModel(userId);
};

/**
 * Replace all roles for a user
 * @param {number} userId - User ID
 * @param {Array} roleIds - Array of role IDs to assign
 * @param {number} assignedBy - User ID who assigned these roles
 * @returns {Array} - Array of created assignments
 */
export const replaceUserRoles = async (userId, roleIds, assignedBy = null) => {
  // Validate all roles exist
  for (const roleId of roleIds) {
    const role = getRoleByIdModel(roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }
  }

  // User validation deferred to database foreign key constraints
  return replaceUserRolesModel(userId, roleIds, assignedBy);
};

/**
 * Get statistics for user-role assignments
 * @returns {Object} - User-role statistics
 */
export const getUserRoleStatistics = () => {
  const allAssignments = getAllUserRolesModel();
  const totalCount = getUserRoleCountModel();

  return {
    totalAssignments: totalCount,
    assignmentCount: allAssignments.length
  };
};

export default {
  USER_ROLES_TABLE,
  USER_ROLE_FIELDS,
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
  getUserRoleStatistics
};
