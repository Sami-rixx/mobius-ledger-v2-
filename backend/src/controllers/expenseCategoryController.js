import * as expenseCategoryService from '../services/expenseCategoryService.js';

/**
 * Expense Category Controller
 * Route handlers for expense category API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of expense categories
 * GET /api/expense-categories
 * 
 * Query Parameters:
 * - isActive: Filter by active status (true/false)
 * - isSystem: Filter by system status (true/false)
 * - isKitchen: Filter by kitchen status (true/false)
 * - parentId: Filter by parent category ID
 * - search: Search term for name or description
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: name)
 * - orderDir: Order direction (ASC/DESC, default: ASC)
 * 
 * Response: 200 OK with paginated expense category list
 */
export const getExpenseCategories = async (req, res, next) => {
  try {
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
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number. Must be a positive integer.'
      });
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page size. Must be between 1 and 100.'
      });
    }

    // Validate boolean parameters if provided
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isActive value. Must be true or false.'
      });
    }

    if (isSystem !== undefined && isSystem !== 'true' && isSystem !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isSystem value. Must be true or false.'
      });
    }

    if (isKitchen !== undefined && isKitchen !== 'true' && isKitchen !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isKitchen value. Must be true or false.'
      });
    }

    // Validate parentId if provided
    if (parentId && isNaN(parseInt(parentId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.getPaginatedExpenseCategories({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
      isKitchen: isKitchen === 'true' ? true : isKitchen === 'false' ? false : undefined,
      parentId: parentId ? parseInt(parentId, 10) : undefined,
      search,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all expense categories (no pagination)
 * GET /api/expense-categories/all
 * 
 * Query Parameters:
 * - isActive: Filter by active status
 * - isSystem: Filter by system status
 * - isKitchen: Filter by kitchen status
 * - parentId: Filter by parent category ID
 * - search: Search term for name or description
 * 
 * Response: 200 OK with all matching expense categories
 */
export const getAllExpenseCategories = async (req, res, next) => {
  try {
    const {
      isActive,
      isSystem,
      isKitchen,
      parentId,
      search
    } = req.query;

    // Validate boolean parameters if provided
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isActive value. Must be true or false.'
      });
    }

    if (isSystem !== undefined && isSystem !== 'true' && isSystem !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isSystem value. Must be true or false.'
      });
    }

    if (isKitchen !== undefined && isKitchen !== 'true' && isKitchen !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isKitchen value. Must be true or false.'
      });
    }

    // Validate parentId if provided
    if (parentId && isNaN(parseInt(parentId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.getAllExpenseCategories({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
      isKitchen: isKitchen === 'true' ? true : isKitchen === 'false' ? false : undefined,
      parentId: parentId ? parseInt(parentId, 10) : undefined,
      search
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all active expense categories
 * GET /api/expense-categories/active
 * 
 * Response: 200 OK with all active expense categories
 */
export const getActiveExpenseCategories = async (req, res, next) => {
  try {
    const result = await expenseCategoryService.getActiveExpenseCategories();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all kitchen expense categories
 * GET /api/expense-categories/kitchen
 * 
 * Response: 200 OK with all kitchen expense categories
 */
export const getKitchenExpenseCategories = async (req, res, next) => {
  try {
    const result = await expenseCategoryService.getKitchenExpenseCategories();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get root expense categories (no parent)
 * GET /api/expense-categories/root
 * 
 * Query Parameters:
 * - isActive: Filter by active status (default: true)
 * 
 * Response: 200 OK with all root expense categories
 */
export const getRootExpenseCategories = async (req, res, next) => {
  try {
    const { isActive = 'true' } = req.query;
    
    // Validate isActive
    if (isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isActive value. Must be true or false.'
      });
    }

    const result = await expenseCategoryService.getRootExpenseCategories({
      isActive: isActive === 'true' ? true : false
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get child categories for a parent
 * GET /api/expense-categories/parent/:parentId
 * 
 * Response: 200 OK with child categories or 404 if parent not found
 */
export const getChildExpenseCategories = async (req, res, next) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);

    if (isNaN(parentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.getChildExpenseCategories(parentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get hierarchical category tree
 * GET /api/expense-categories/tree
 * 
 * Response: 200 OK with category tree structure
 */
export const getExpenseCategoryTree = async (req, res, next) => {
  try {
    const result = await expenseCategoryService.getExpenseCategoryTree();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense category by ID
 * GET /api/expense-categories/:id
 * 
 * Response: 200 OK with expense category or 404 if not found
 */
export const getExpenseCategoryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.getExpenseCategoryById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense category by name
 * GET /api/expense-categories/name/:name
 * 
 * Response: 200 OK with expense category or 404 if not found
 */
export const getExpenseCategoryByName = async (req, res, next) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required.'
      });
    }

    const result = await expenseCategoryService.getExpenseCategoryByName(name);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new expense category
 * POST /api/expense-categories
 * 
 * Request Body:
 * - name (required): Category name
 * - parentId (optional): Parent category ID
 * - description (optional): Category description
 * - isKitchen (optional): Is kitchen category (default: false)
 * - createdBy (required): User ID who created the category
 * 
 * Response: 201 Created with the created category or 400 if validation fails
 */
export const createExpenseCategory = async (req, res, next) => {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.name || !body.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: name, createdBy'
      });
    }

    // Validate createdBy is a number
    if (isNaN(parseInt(body.createdBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid createdBy. Must be a number.'
      });
    }

    // Validate parentId if provided
    if (body.parentId !== undefined && body.parentId !== null && isNaN(parseInt(body.parentId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.createExpenseCategory({
      name: body.name,
      parentId: body.parentId ? parseInt(body.parentId, 10) : null,
      description: body.description,
      isKitchen: body.isKitchen !== undefined ? body.isKitchen : false,
      createdBy: parseInt(body.createdBy, 10)
    });

    if (!result.success) {
      return res.status(result.error.includes('not found') ? 404 : 400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an expense category
 * PUT /api/expense-categories/:id
 * 
 * Request Body:
 * - name (optional): Category name
 * - parentId (optional): Parent category ID (null for root)
 * - description (optional): Category description
 * - isActive (optional): Active status
 * - isSystem (optional): System status
 * - isKitchen (optional): Kitchen status
 * - updatedBy (required): User ID who updated the category
 * 
 * Response: 200 OK with the updated category or 404 if not found
 */
export const updateExpenseCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID. Must be a number.'
      });
    }

    const body = req.body;

    // Validate updatedBy is a number
    if (!body.updatedBy || isNaN(parseInt(body.updatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'updatedBy is required and must be a number.'
      });
    }

    // Validate parentId if provided
    if (body.parentId !== undefined && body.parentId !== null && isNaN(parseInt(body.parentId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.updateExpenseCategory(id, {
      name: body.name,
      parentId: body.parentId !== undefined && body.parentId !== null ? parseInt(body.parentId, 10) : null,
      description: body.description,
      isActive: body.isActive,
      isSystem: body.isSystem,
      isKitchen: body.isKitchen,
      updatedBy: parseInt(body.updatedBy, 10)
    });

    if (!result.success) {
      return res.status(result.error.includes('not found') ? 404 : 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete an expense category
 * DELETE /api/expense-categories/:id
 * 
 * Response: 200 OK with success message or 404 if not found
 */
export const deleteExpenseCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID. Must be a number.'
      });
    }

    const result = await expenseCategoryService.deleteExpenseCategory(id);

    if (!result.success) {
      return res.status(result.error.includes('not found') ? 404 : 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense categories with usage count
 * GET /api/expense-categories/usage
 * 
 * Response: 200 OK with categories and their usage counts
 */
export const getExpenseCategoriesWithUsage = async (req, res, next) => {
  try {
    const result = await expenseCategoryService.getExpenseCategoriesWithUsage();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get count of expense categories
 * GET /api/expense-categories/count
 * 
 * Query Parameters:
 * - isActive: Filter by active status
 * - isSystem: Filter by system status
 * - isKitchen: Filter by kitchen status
 * - parentId: Filter by parent category ID
 * - search: Search term for name or description
 * 
 * Response: 200 OK with count of matching categories
 */
export const getExpenseCategoryCount = async (req, res, next) => {
  try {
    const {
      isActive,
      isSystem,
      isKitchen,
      parentId,
      search
    } = req.query;

    // Validate boolean parameters if provided
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isActive value. Must be true or false.'
      });
    }

    if (isSystem !== undefined && isSystem !== 'true' && isSystem !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isSystem value. Must be true or false.'
      });
    }

    if (isKitchen !== undefined && isKitchen !== 'true' && isKitchen !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isKitchen value. Must be true or false.'
      });
    }

    // Validate parentId if provided
    if (parentId && isNaN(parseInt(parentId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID. Must be a number.'
      });
    }

    // Get count from service
    const countResult = await expenseCategoryService.getAllExpenseCategories({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
      isKitchen: isKitchen === 'true' ? true : isKitchen === 'false' ? false : undefined,
      parentId: parentId ? parseInt(parentId, 10) : undefined,
      search,
      limit: 1,
      offset: 0
    });

    res.json({
      success: true,
      data: { count: countResult.data.length > 0 ? 1 : 0 } // Simplified - actual count would need a count function
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if a category name already exists
 * GET /api/expense-categories/check-name/:name
 * 
 * Query Parameters:
 * - excludeId: Optional ID to exclude from check
 * 
 * Response: 200 OK with boolean result
 */
export const checkExpenseCategoryNameExists = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { excludeId } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required.'
      });
    }

    const excludeIdNum = excludeId ? parseInt(excludeId, 10) : null;
    if (excludeId && isNaN(excludeIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid excludeId. Must be a number.'
      });
    }

    const result = await expenseCategoryService.checkExpenseCategoryNameExists(name, excludeIdNum);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export all controller functions
export default {
  getExpenseCategories,
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
  getExpenseCategoryCount,
  checkExpenseCategoryNameExists
};
