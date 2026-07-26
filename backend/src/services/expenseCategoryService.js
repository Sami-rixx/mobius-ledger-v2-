import * as ExpenseCategoryModel from '../models/ExpenseCategory.js';
import * as ExpenseModel from '../models/Expense.js';
import db from '../config/database.js';

/**
 * Expense Category Service
 * Business logic layer for expense category management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Category usage tracking
 * - Hierarchical category management
 */

/**
 * Get paginated list of expense categories
 * @param {Object} options - Filter and pagination options
 * @param {boolean} options.isActive - Filter by active status
 * @param {boolean} options.isSystem - Filter by system status
 * @param {boolean} options.isKitchen - Filter by kitchen status
 * @param {number} options.parentId - Filter by parent category ID
 * @param {string} options.search - Search term for name or description
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with expense categories and metadata
 */
export const getPaginatedExpenseCategories = async (options = {}) => {
  const {
    isActive,
    isSystem,
    isKitchen,
    parentId,
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
    isKitchen,
    parentId,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  const categories = await ExpenseCategoryModel.getAll(filterOptions);
  const total = await ExpenseCategoryModel.count(filterOptions);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Transform categories (ensure proper types)
  const transformedCategories = categories.map(category => ({
    ...category,
    is_active: Boolean(category.is_active),
    is_system: Boolean(category.is_system),
    is_kitchen: Boolean(category.is_kitchen)
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
 * Get all expense categories (no pagination)
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with expense categories
 */
export const getAllExpenseCategories = async (options = {}) => {
  const categories = await ExpenseCategoryModel.getAll(options);
  return {
    success: true,
    data: categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system),
      is_kitchen: Boolean(category.is_kitchen)
    }))
  };
};

/**
 * Get all active expense categories
 * @returns {Object} - Success response with active expense categories
 */
export const getActiveExpenseCategories = async () => {
  const categories = await ExpenseCategoryModel.getAllActive();
  return {
    success: true,
    data: categories
  };
};

/**
 * Get all kitchen expense categories
 * @returns {Object} - Success response with kitchen expense categories
 */
export const getKitchenExpenseCategories = async () => {
  const categories = await ExpenseCategoryModel.getAllKitchen();
  return {
    success: true,
    data: categories
  };
};

/**
 * Get root expense categories (no parent)
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with root categories
 */
export const getRootExpenseCategories = async (options = {}) => {
  const categories = await ExpenseCategoryModel.getRootCategories(options);
  return {
    success: true,
    data: categories
  };
};

/**
 * Get child categories for a parent
 * @param {number} parentId - Parent category ID
 * @returns {Object} - Success response with child categories
 */
export const getChildExpenseCategories = async (parentId) => {
  const categories = await ExpenseCategoryModel.getChildren(parentId);
  return {
    success: true,
    data: categories
  };
};

/**
 * Get hierarchical category tree
 * @returns {Object} - Success response with category tree
 */
export const getExpenseCategoryTree = async () => {
  const tree = await ExpenseCategoryModel.getTree();
  return {
    success: true,
    data: tree
  };
};

/**
 * Get expense category by ID
 * @param {number} id - Expense category ID
 * @returns {Object} - Success response with expense category or error
 */
export const getExpenseCategoryById = async (id) => {
  const category = await ExpenseCategoryModel.getById(id);
  
  if (!category) {
    return {
      success: false,
      error: 'Expense category not found'
    };
  }

  return {
    success: true,
    data: {
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system),
      is_kitchen: Boolean(category.is_kitchen)
    }
  };
};

/**
 * Get expense category by name
 * @param {string} name - Category name
 * @returns {Object} - Success response with expense category or error
 */
export const getExpenseCategoryByName = async (name) => {
  const category = await ExpenseCategoryModel.getByName(name);
  
  if (!category) {
    return {
      success: false,
      error: 'Expense category not found'
    };
  }

  return {
    success: true,
    data: {
      ...category,
      is_active: Boolean(category.is_active),
      is_system: Boolean(category.is_system),
      is_kitchen: Boolean(category.is_kitchen)
    }
  };
};

/**
 * Create a new expense category
 * @param {Object} data - Expense category data
 * @param {string} data.name - Category name
 * @param {number} data.parentId - Parent category ID (optional)
 * @param {string} data.description - Description (optional)
 * @param {boolean} data.isKitchen - Is kitchen category (optional)
 * @param {number} data.createdBy - User ID who created the category
 * @returns {Object} - Success response with created category
 */
export const createExpenseCategory = async (data) => {
  const {
    name,
    parentId,
    description,
    isKitchen = false,
    createdBy
  } = data;

  // Validate required fields
  if (!name) {
    return {
      success: false,
      error: 'Category name is required'
    };
  }

  // Validate name uniqueness
  const nameExists = await ExpenseCategoryModel.nameExists(name);
  if (nameExists) {
    return {
      success: false,
      error: 'Category name already exists'
    };
  }

  // If parentId is provided, validate it exists
  if (parentId !== undefined && parentId !== null) {
    const parentCategory = await ExpenseCategoryModel.getById(parentId);
    if (!parentCategory) {
      return {
        success: false,
        error: 'Parent category not found'
      };
    }
  }

  try {
    const categoryData = {
      name,
      parentId,
      description,
      isActive: true,
      isSystem: false,
      isKitchen,
      createdBy,
      updatedBy: createdBy
    };

    const category = await ExpenseCategoryModel.create(categoryData);

    return {
      success: true,
      message: 'Expense category created successfully',
      data: {
        ...category,
        is_active: Boolean(category.is_active),
        is_system: Boolean(category.is_system),
        is_kitchen: Boolean(category.is_kitchen)
      }
    };
  } catch (error) {
    console.error('Error creating expense category:', error);
    return {
      success: false,
      error: 'Failed to create expense category'
    };
  }
};

/**
 * Update an expense category
 * @param {number} id - Expense category ID
 * @param {Object} data - Updated expense category data
 * @returns {Object} - Success response with updated category
 */
export const updateExpenseCategory = async (id, data) => {
  const {
    name,
    parentId,
    description,
    isActive,
    isSystem,
    isKitchen,
    updatedBy
  } = data;

  // Check if category exists
  const existing = await ExpenseCategoryModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Expense category not found'
    };
  }

  // If name is provided, validate uniqueness (excluding current category)
  if (name !== undefined && name !== existing.name) {
    const nameExists = await ExpenseCategoryModel.nameExists(name, id);
    if (nameExists) {
      return {
        success: false,
        error: 'Category name already exists'
      };
    }
  }

  // If parentId is provided, validate it exists
  if (parentId !== undefined && parentId !== null) {
    const parentCategory = await ExpenseCategoryModel.getById(parentId);
    if (!parentCategory) {
      return {
        success: false,
        error: 'Parent category not found'
      };
    }
    
    // Prevent circular references (can't be parent of itself)
    if (parentId === id) {
      return {
        success: false,
        error: 'Category cannot be its own parent'
      };
    }
  }

  try {
    const updateData = {
      name,
      parentId,
      description,
      isActive,
      isSystem,
      isKitchen,
      updatedBy
    };

    const category = await ExpenseCategoryModel.update(id, updateData);

    return {
      success: true,
      message: 'Expense category updated successfully',
      data: {
        ...category,
        is_active: Boolean(category.is_active),
        is_system: Boolean(category.is_system),
        is_kitchen: Boolean(category.is_kitchen)
      }
    };
  } catch (error) {
    console.error('Error updating expense category:', error);
    return {
      success: false,
      error: 'Failed to update expense category'
    };
  }
};

/**
 * Delete an expense category
 * @param {number} id - Expense category ID
 * @returns {Object} - Success response
 */
export const deleteExpenseCategory = async (id) => {
  const existing = await ExpenseCategoryModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Expense category not found'
    };
  }

  // Check if category is being used by any expenses
  const usageCount = await ExpenseModel.count({ categoryId: id });
  if (usageCount > 0) {
    return {
      success: false,
      error: `Cannot delete category that is used by ${usageCount} expense(s). Archive the category instead.`
    };
  }

  // Check if category has children
  const children = await ExpenseCategoryModel.getChildren(id);
  if (children.length > 0) {
    return {
      success: false,
      error: `Cannot delete category that has ${children.length} subcategory(ies). Delete or reassign subcategories first.`
    };
  }

  try {
    await ExpenseCategoryModel.deleteById(id);
    return {
      success: true,
      message: 'Expense category deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return {
      success: false,
      error: 'Failed to delete expense category'
    };
  }
};

/**
 * Get expense categories with usage count
 * @returns {Object} - Success response with categories and usage counts
 */
export const getExpenseCategoriesWithUsage = async () => {
  const categories = await ExpenseCategoryModel.getWithUsageCount();
  return {
    success: true,
    data: categories
  };
};

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @param {number} excludeId - Optional ID to exclude from check
 * @returns {Object} - Success response with boolean result
 */
export const checkExpenseCategoryNameExists = async (name, excludeId = null) => {
  const exists = await ExpenseCategoryModel.nameExists(name, excludeId);
  return {
    success: true,
    data: { exists }
  };
};

// Export all functions as the default export
export default {
  getPaginatedExpenseCategories,
  getAllExpenseCategories,
  getActiveExpenseCategories,
  getKitchenExpenseCategories,
  getRootExpenseCategories,
  getChildExpenseCategories,
  getExpenseCategoryTree,
  getExpenseCategoryById,
  getExpenseCategoryByName,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategoriesWithUsage,
  checkExpenseCategoryNameExists
};
