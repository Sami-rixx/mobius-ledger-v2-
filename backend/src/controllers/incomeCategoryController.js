import * as incomeCategoryService from '../services/incomeCategoryService.js';

/**
 * Income Category Controller
 * Route handlers for income category API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of income categories
 * GET /api/income-categories
 * 
 * Query Parameters:
 * - isActive: Filter by active status (true/false)
 * - isSystem: Filter by system status (true/false)
 * - search: Search term for name or description
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: name)
 * - orderDir: Order direction (ASC/DESC, default: ASC)
 * 
 * Response: 200 OK with paginated income category list
 */
export const getIncomeCategories = async (req, res, next) => {
  try {
    const {
      isActive,
      isSystem,
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

    const result = await incomeCategoryService.getPaginatedIncomeCategories({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
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
 * Get all income categories (no pagination)
 * GET /api/income-categories/all
 * 
 * Query Parameters:
 * - isActive: Filter by active status
 * - isSystem: Filter by system status
 * - search: Search term for name or description
 * 
 * Response: 200 OK with all matching income categories
 */
export const getAllIncomeCategories = async (req, res, next) => {
  try {
    const {
      isActive,
      isSystem,
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

    const result = await incomeCategoryService.getAllIncomeCategories({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
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
 * Get all active income categories
 * GET /api/income-categories/active
 * 
 * Response: 200 OK with all active income categories
 */
export const getActiveIncomeCategories = async (req, res, next) => {
  try {
    const result = await incomeCategoryService.getActiveIncomeCategories();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single income category by ID
 * GET /api/income-categories/:id
 * 
 * Response: 200 OK with income category or 404 if not found
 */
export const getIncomeCategoryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income category ID. Must be a number.'
      });
    }

    const result = await incomeCategoryService.getIncomeCategoryById(id);

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
 * Get income category by name
 * GET /api/income-categories/name/:name
 * 
 * Response: 200 OK with income category or 404 if not found
 */
export const getIncomeCategoryByName = async (req, res, next) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required.'
      });
    }

    const result = await incomeCategoryService.getIncomeCategoryByName(decodeURIComponent(name));

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
 * Create a new income category
 * POST /api/income-categories
 * 
 * Request Body:
 * - name (string, required): Category name
 * - description (string, optional): Category description
 * - isActive (boolean, optional): Whether category is active (default: true)
 * - isSystem (boolean, optional): Whether category is a system category (default: false)
 * - createdBy (number, required): User ID who created the category
 * 
 * Response: 201 Created with created income category or 400 with error
 */
export const createIncomeCategory = async (req, res, next) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.name || !data.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: name, createdBy'
      });
    }

    // Validate numeric fields
    const createdBy = parseInt(data.createdBy, 10);

    if (isNaN(createdBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid createdBy. Must be a number.'
      });
    }

    const result = await incomeCategoryService.createIncomeCategory({
      name: data.name,
      description: data.description,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isSystem: data.isSystem !== undefined ? Boolean(data.isSystem) : false,
      createdBy
    });

    if (!result.success) {
      return res.status(400).json(result);
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
 * Update an income category
 * PUT /api/income-categories/:id
 * 
 * Request Body:
 * - name (string, optional): Category name
 * - description (string, optional): Category description
 * - isActive (boolean, optional): Whether category is active
 * - isSystem (boolean, optional): Whether category is a system category
 * - updatedBy (number, required): User ID who updated the category
 * 
 * Response: 200 OK with updated income category or 400/404 with error
 */
export const updateIncomeCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income category ID. Must be a number.'
      });
    }

    const data = req.body;

    // Validate updatedBy is required
    if (!data.updatedBy) {
      return res.status(400).json({
        success: false,
        error: 'updatedBy is required.'
      });
    }

    const updatedBy = parseInt(data.updatedBy, 10);

    if (isNaN(updatedBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updatedBy. Must be a number.'
      });
    }

    const result = await incomeCategoryService.updateIncomeCategory(id, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      isSystem: data.isSystem,
      updatedBy
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
 * Delete an income category
 * DELETE /api/income-categories/:id
 * 
 * Response: 200 OK with success message or 404 if not found
 */
export const deleteIncomeCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income category ID. Must be a number.'
      });
    }

    const result = await incomeCategoryService.deleteIncomeCategory(id);

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
 * Get income categories with usage count
 * GET /api/income-categories/usage
 * 
 * Response: 200 OK with categories and their usage counts
 */
export const getIncomeCategoriesWithUsage = async (req, res, next) => {
  try {
    const result = await incomeCategoryService.getIncomeCategoriesWithUsage();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get count of income categories
 * GET /api/income-categories/count
 * 
 * Query Parameters:
 * - isActive: Filter by active status
 * - isSystem: Filter by system status
 * 
 * Response: 200 OK with category count
 */
export const getIncomeCategoryCount = async (req, res, next) => {
  try {
    const {
      isActive,
      isSystem
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

    const result = await incomeCategoryService.getIncomeCategoryCount({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined
    });

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
  getIncomeCategories,
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
