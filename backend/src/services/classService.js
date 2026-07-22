import * as ClassModel from '../models/Class.js';
import db from '../config/database.js';

/**
 * Class Service
 * Business logic layer for class management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Audit trail (future)
 */

/**
 * Get paginated list of classes
 * @param {Object} options - Filter and pagination options
 * @param {string} options.search - Search term
 * @param {boolean} options.isActive - Filter by active status
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with classes and metadata
 */
export const getPaginatedClasses = (options = {}) => {
  const {
    search,
    isActive,
    page = 1,
    pageSize = 20,
    orderBy = 'name',
    orderDir = 'ASC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get classes
  const classes = ClassModel.getAllClasses({
    search,
    isActive,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = ClassModel.getClassCount({ search, isActive });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: classes,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all classes (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of classes
 */
export const getAllClasses = (options = {}) => {
  return ClassModel.getAllClasses(options);
};

/**
 * Get a single class by ID with enhanced data
 * @param {number} id - Class ID
 * @returns {Object|null} - Class with additional computed fields
 */
export const getClassById = (id) => {
  const cls = ClassModel.getClassById(id);
  
  if (!cls) {
    return null;
  }

  // Get student count for this class
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ?').get(id).count;

  // Add computed fields
  return {
    ...cls,
    student_count: studentCount,
    is_active: Boolean(cls.is_active)
  };
};

/**
 * Get a class by name
 * @param {string} name - Class name
 * @returns {Object|null} - Class object
 */
export const getClassByName = (name) => {
  return ClassModel.getClassByName(name);
};

/**
 * Create a new class
 * @param {Object} classData - Class data
 * @param {number} createdBy - User ID creating the record
 * @returns {Object} - Created class
 * @throws {Error} - If validation fails
 */
export const createClass = (classData, createdBy = null) => {
  // Normalize data
  const normalizedData = {
    ...classData,
    name: classData.name?.trim(),
    description: classData.description?.trim(),
    is_active: classData.is_active !== undefined ? classData.is_active : true
  };

  // Validate required fields
  if (!normalizedData.name) {
    throw new Error('Class name is required');
  }

  // Validate name length
  if (normalizedData.name.length > 100) {
    throw new Error('Class name must be 100 characters or less');
  }

  // Validate description length
  if (normalizedData.description && normalizedData.description.length > 500) {
    throw new Error('Class description must be 500 characters or less');
  }

  return ClassModel.createClass(normalizedData, createdBy);
};

/**
 * Update a class
 * @param {number} id - Class ID
 * @param {Object} classData - Class data to update
 * @param {number} updatedBy - User ID updating the record
 * @returns {Object} - Updated class
 * @throws {Error} - If validation fails
 */
export const updateClass = (id, classData, updatedBy = null) => {
  // Check if class exists
  const existing = ClassModel.getClassById(id);
  if (!existing) {
    throw new Error(`Class not found with ID: ${id}`);
  }

  // Normalize data
  const normalizedData = {
    ...classData,
    name: classData.name?.trim(),
    description: classData.description?.trim()
  };

  // Validate required fields
  if (normalizedData.name && !normalizedData.name.trim()) {
    throw new Error('Class name cannot be empty');
  }

  // Validate name length
  if (normalizedData.name && normalizedData.name.length > 100) {
    throw new Error('Class name must be 100 characters or less');
  }

  // Validate description length
  if (normalizedData.description && normalizedData.description.length > 500) {
    throw new Error('Class description must be 500 characters or less');
  }

  return ClassModel.updateClass(id, normalizedData, updatedBy);
};

/**
 * Delete a class
 * @param {number} id - Class ID
 * @param {number} deletedBy - User ID deleting the record
 * @returns {boolean} - True if deleted
 * @throws {Error} - If class has associated records
 */
export const deleteClass = (id, deletedBy = null) => {
  return ClassModel.deleteClass(id, deletedBy);
};

/**
 * Get classes by active status
 * @param {boolean} isActive - Active status filter
 * @returns {Array} - Classes matching the filter
 */
export const getClassesByStatus = (isActive) => {
  return ClassModel.getAllClasses({ isActive });
};

/**
 * Search classes
 * @param {string} searchTerm - Search term
 * @returns {Array} - Matching classes
 */
export const searchClasses = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  return ClassModel.searchClasses(searchTerm.trim());
};

/**
 * Get active classes only
 * @returns {Array} - Active classes
 */
export const getActiveClasses = () => {
  return ClassModel.getActiveClasses();
};

/**
 * Get classes with student counts
 * @returns {Array} - Classes with student count
 */
export const getClassesWithStudentCounts = () => {
  return ClassModel.getClassesWithStudentCounts();
};

/**
 * Get class statistics
 * @returns {Object} - Class statistics
 */
export const getClassStatistics = () => {
  const total = ClassModel.getClassCount();
  const active = ClassModel.getClassCount({ isActive: true });
  const inactive = total - active;

  return {
    total,
    active,
    inactive
  };
};

/**
 * Check if class name is available
 * @param {string} name - Class name to check
 * @param {number} [excludeId] - Class ID to exclude from check (for updates)
 * @returns {boolean} - True if available
 */
export const isClassNameAvailable = (name, excludeId = null) => {
  const normalized = name?.trim();
  
  if (!normalized) {
    return false;
  }

  const existing = ClassModel.getClassByName(normalized);
  
  if (!existing) {
    return true;
  }

  return existing.id === excludeId;
};

// Export all service functions
export default {
  getPaginatedClasses,
  getAllClasses,
  getClassById,
  getClassByName,
  createClass,
  updateClass,
  deleteClass,
  getClassesByStatus,
  searchClasses,
  getActiveClasses,
  getClassesWithStudentCounts,
  getClassStatistics,
  isClassNameAvailable
};
