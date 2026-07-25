import * as IncomeCategoryModel from '../models/IncomeCategory.js';
import * as IncomeModel from '../models/Income.js';
import db from '../config/database.js';

/**
 * Income Category Service
 * Business logic layer for income category management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Category usage tracking
 */

/**
 * Get paginated list of income categories
 * @param {Object} options - Filter and pagination options
 * @param {boolean} options.isActive - Filter by active status
 * @param {boolean} options.isSystem - Filter by system status
 * @param {string} options.search - Search term for name or description
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with income categories and metadata
 */
export const getPaginatedIncomeCategories = async (options = {}) => {
  const {
    isActive,
    isSystem,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'name',
    orderDir = 'ASC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Build filter options for model
  const filterOptions = {
    isActive,
    isSystem,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  const categories = await IncomeCategoryModel.getAll(filterOptions);
  const total = await IncomeCategoryModel.count(filterOptions);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Transform categories (ensure proper types)
  const transformedCategories = categories.map(category => ({
    ...category,
    is_active: Boolean(category.is_active),
    is_system: Boolean(category.is_system)
  }));

  return {
    success: true,
    data: transformedCategories,
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
 * Get all income categories (no pagination)
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with income categories
 */
export const getAllIncomeCategories = async (options = {}) => {
  const categories = await IncomeCategoryModel.getAll(options);
  return {
    success: true,
    data: categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system)
    }))
  };
};

/**
 * Get all active income categories
 * @returns {Object} - Success response with active income categories
 */
export const getActiveIncomeCategories = async () => {
  const categories = await IncomeCategoryModel.getAllActive();
  return {
    success: true,
    data: categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system)
    }))
  };
};

/**
 * Get a single income category by ID
 * @param {number} id - Income category ID
 * @returns {Object} - Success response with income category or error
 */
export const getIncomeCategoryById = async (id) => {
  const category = await IncomeCategoryModel.getById(id);
  
  if (!category) {
    return {
      success: false,
      error: 'Income category not found'
    };
  }

  return {
    success: true,
    data: {
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system)
    }
  };
};

/**
 * Get income category by name
 * @param {string} name - Category name
 * @returns {Object} - Success response with income category or error
 */
export const getIncomeCategoryByName = async (name) => {
  const category = await IncomeCategoryModel.getByName(name);
  
  if (!category) {
    return {
      success: false,
      error: 'Income category not found'
    };
  }

  return {
    success: true,
    data: {
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system)
    }
  };
};

/**
 * Create a new income category
 * @param {Object} data - Income category data
 * @param {string} data.name - Category name
 * @param {string} data.description - Category description
 * @param {boolean} data.isActive - Whether category is active (default: true)
 * @param {boolean} data.isSystem - Whether category is a system category (default: false)
 * @param {number} data.createdBy - User ID who created the category
 * @returns {Object} - Success response with created income category
 */
export const createIncomeCategory = async (data) => {
  const {
    name,
    description,
    isActive = true,
    isSystem = false,
    createdBy
  } = data;

  // Validate required fields
  if (!name) {
    return {
      success: false,
      error: 'Category name is required'
    };
  }

  // Check if category name already exists
  const nameExists = await IncomeCategoryModel.nameExists(name);
  if (nameExists) {
    return {
      success: false,
      error: 'Income category with this name already exists'
    };
  }

  try {
    const categoryData = {
      name,
      description,
      isActive,
      isSystem,
      createdBy,
      updatedBy: createdBy
    };

    const category = await IncomeCategoryModel.create(categoryData);

    return {
      success: true,
      message: 'Income category created successfully',
      data: {
        ...category,
        is_active: Boolean(category.is_active),
        is_system: Boolean(category.is_system)
      }
    };
  } catch (error) {
    console.error('Error creating income category:', error);
    return {
      success: false,
      error: 'Failed to create income category'
    };
  }
};

/**
 * Update an income category
 * @param {number} id - Income category ID
 * @param {Object} data - Updated income category data
 * @param {string} data.name - Category name
 * @param {string} data.description - Category description
 * @param {boolean} data.isActive - Whether category is active
 * @param {boolean} data.isSystem - Whether category is a system category
 * @param {number} data.updatedBy - User ID who updated the category
 * @returns {Object} - Success response with updated income category
 */
export const updateIncomeCategory = async (id, data) => {
  const {
    name,
    description,
    isActive,
    isSystem,
    updatedBy
  } = data;

  // Check if category exists
  const existing = await IncomeCategoryModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income category not found'
    };
  }

  // If name is provided, check it doesn't conflict with another category
  if (name && name !== existing.name) {
    const nameExists = await IncomeCategoryModel.nameExists(name, id);
    if (nameExists) {
      return {
        success: false,
        error: 'Income category with this name already exists'
      };
    }
  }

  // Prevent deactivating a system category
  if (isActive === false && existing.is_system) {
    return {
      success: false,
      error: 'Cannot deactivate a system income category'
    };
  }

  try {
    const updateData = {
      name,
      description,
      isActive,
      isSystem,
      updatedBy
    };

    const category = await IncomeCategoryModel.update(id, updateData);

    return {
      success: true,
      message: 'Income category updated successfully',
      data: {
        ...category,
        is_active: Boolean(category.is_active),
        is_system: Boolean(category.is_system)
      }
    };
  } catch (error) {
    console.error('Error updating income category:', error);
    return {
      success: false,
      error: 'Failed to update income category'
    };
  }
};

/**
 * Delete an income category
 * @param {number} id - Income category ID
 * @returns {Object} - Success response or error
 */
export const deleteIncomeCategory = async (id) => {
  const category = await IncomeCategoryModel.getById(id);
  
  if (!category) {
    return {
      success: false,
      error: 'Income category not found'
    };
  }

  // Prevent deleting a system category
  if (category.is_system) {
    return {
      success: false,
      error: 'Cannot delete a system income category'
    };
  }

  // Check if category is being used by any income records
  const usage = await IncomeCategoryModel.getWithUsageCount();
  const categoryUsage = usage.find(c => c.id === id);
  if (categoryUsage && categoryUsage.usageCount > 0) {
    return {
      success: false,
      error: `Cannot delete income category: ${categoryUsage.usageCount} income record(s) use this category`
    };
  }

  try {
    await IncomeCategoryModel.deleteById(id);
    return {
      success: true,
      message: 'Income category deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting income category:', error);
    return {
      success: false,
      error: 'Failed to delete income category'
    };
  }
};

/**
 * Get income categories with usage count
 * @returns {Object} - Success response with categories and usage counts
 */
export const getIncomeCategoriesWithUsage = async () => {
  const categories = await IncomeCategoryModel.getWithUsageCount();
  return {
    success: true,
    data: categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system)
    }))
  };
};

/**
 * Get count of income categories
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with count
 */
export const getIncomeCategoryCount = async (options = {}) => {
  const count = await IncomeCategoryModel.count(options);
  return {
    success: true,
    data: { count }
  };
};

// Export all service functions
export default {
  getPaginatedIncomeCategories,
  getAllIncomeCategories,
  getActiveIncomeCategories,
  getIncomeCategoryById,
  getIncomeCategoryByName,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory,
  getIncomeCategoriesWithUsage,
  getIncomeCategoryCount
};
