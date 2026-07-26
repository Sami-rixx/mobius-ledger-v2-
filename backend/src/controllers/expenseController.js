import * as expenseService from '../services/expenseService.js';

/**
 * Expense Controller
 * Route handlers for expense API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of expense records
 * GET /api/expenses
 * 
 * Query Parameters:
 * - categoryId: Filter by expense category ID
 * - receiptNumber: Filter by receipt number
 * - vendorName: Filter by vendor name
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - isVerified: Filter by verification status (true/false)
 * - search: Search term (searches receipt, vendor, description, category)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: expense_date)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated expense list
 */
export const getExpenses = async (req, res, next) => {
  try {
    const {
      categoryId,
      receiptNumber,
      vendorName,
      startDate,
      endDate,
      isVerified,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'expense_date',
      orderDir = 'DESC'
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

    // Validate categoryId if provided
    if (categoryId && isNaN(parseInt(categoryId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID. Must be a number.'
      });
    }

    // Validate isVerified if provided
    if (isVerified !== undefined && isVerified !== 'true' && isVerified !== 'false') {
      return res.status(400).json({
        success: false,
        error: 'Invalid isVerified value. Must be true or false.'
      });
    }

    const result = await expenseService.getPaginatedExpenses({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      receiptNumber,
      vendorName,
      startDate,
      endDate,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
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
 * Get all expense records (no pagination)
 * GET /api/expenses/all
 * 
 * Query Parameters:
 * - categoryId: Filter by expense category ID
 * - receiptNumber: Filter by receipt number
 * - vendorName: Filter by vendor name
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - isVerified: Filter by verification status
 * 
 * Response: 200 OK with all matching expense records
 */
export const getAllExpenses = async (req, res, next) => {
  try {
    const {
      categoryId,
      receiptNumber,
      vendorName,
      startDate,
      endDate,
      isVerified
    } = req.query;

    const result = await expenseService.getAllExpenses({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      receiptNumber,
      vendorName,
      startDate,
      endDate,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined
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
 * Get a single expense record by ID
 * GET /api/expenses/:id
 * 
 * Response: 200 OK with expense record or 404 if not found
 */
export const getExpenseById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID. Must be a number.'
      });
    }

    const result = await expenseService.getExpenseById(id);

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
 * Get expense record by receipt number
 * GET /api/expenses/receipt/:receiptNumber
 * 
 * Response: 200 OK with expense record or 404 if not found
 */
export const getExpenseByReceiptNumber = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;

    if (!receiptNumber) {
      return res.status(400).json({
        success: false,
        error: 'Receipt number is required.'
      });
    }

    const result = await expenseService.getExpenseByReceiptNumber(receiptNumber);

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
 * Get expense records by category
 * GET /api/expenses/category/:categoryId
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * 
 * Response: 200 OK with paginated expense records for the category
 */
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID. Must be a number.'
      });
    }

    const { page = 1, pageSize = 20 } = req.query;

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

    const result = await expenseService.getExpensesByCategory(categoryId, {
      page: pageNum,
      pageSize: pageSizeNum
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
 * Get expense records by date range
 * GET /api/expenses/date-range
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD, required)
 * - endDate: End date (YYYY-MM-DD, required)
 * 
 * Response: 200 OK with expense records in the date range
 */
export const getExpensesByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required.'
      });
    }

    const result = await expenseService.getExpensesByDateRange(startDate, endDate);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense statistics
 * GET /api/expenses/statistics
 * 
 * Query Parameters:
 * - startDate: Optional start date (YYYY-MM-DD)
 * - endDate: Optional end date (YYYY-MM-DD)
 * 
 * Response: 200 OK with expense statistics
 */
export const getExpenseStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await expenseService.getExpenseStatistics({
      startDate,
      endDate
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
 * Create a new expense record
 * POST /api/expenses
 * 
 * Request Body:
 * - expenseCategoryId (required): Expense category ID
 * - amount (required): Expense amount (positive number)
 * - description (optional): Expense description
 * - vendorName (required): Vendor/supplier name
 * - vendorContact (optional): Vendor contact information
 * - paymentMethodId (optional): Payment method ID
 * - expenseDate (required): Expense date (YYYY-MM-DD)
 * - notes (optional): Additional notes
 * - createdBy (required): User ID who created the record
 * 
 * Response: 201 Created with the created expense record or 400 if validation fails
 */
export const createExpense = async (req, res, next) => {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.expenseCategoryId || !body.amount || !body.vendorName || !body.expenseDate || !body.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: expenseCategoryId, amount, vendorName, expenseDate, createdBy'
      });
    }

    // Validate amount is positive number
    const amountNum = parseFloat(body.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number.'
      });
    }

    // Validate expenseCategoryId is a number
    if (isNaN(parseInt(body.expenseCategoryId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense category ID. Must be a number.'
      });
    }

    // Validate createdBy is a number
    if (isNaN(parseInt(body.createdBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid createdBy. Must be a number.'
      });
    }

    const result = await expenseService.createExpense({
      expenseCategoryId: parseInt(body.expenseCategoryId, 10),
      amount: amountNum,
      description: body.description,
      vendorName: body.vendorName,
      vendorContact: body.vendorContact,
      paymentMethodId: body.paymentMethodId ? parseInt(body.paymentMethodId, 10) : undefined,
      expenseDate: body.expenseDate,
      notes: body.notes,
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
 * Update an expense record
 * PUT /api/expenses/:id
 * 
 * Request Body:
 * - amount (optional): Expense amount (positive number)
 * - expenseCategoryId (optional): Expense category ID
 * - description (optional): Expense description
 * - vendorName (optional): Vendor/supplier name
 * - vendorContact (optional): Vendor contact information
 * - paymentMethodId (optional): Payment method ID
 * - expenseDate (optional): Expense date (YYYY-MM-DD)
 * - receiptNumber (optional): Receipt number
 * - notes (optional): Additional notes
 * - isVerified (optional): Verification status
 * - updatedBy (required): User ID who updated the record
 * 
 * Response: 200 OK with the updated expense record or 404 if not found
 */
export const updateExpense = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID. Must be a number.'
      });
    }

    const body = req.body;

    // Validate updatedBy is a number
    if (body.updatedBy !== undefined && isNaN(parseInt(body.updatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updatedBy. Must be a number.'
      });
    }

    // If amount is provided, validate it's positive
    if (body.amount !== undefined) {
      const amountNum = parseFloat(body.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number.'
        });
      }
    }

    // If expenseCategoryId is provided, validate it's a number
    if (body.expenseCategoryId !== undefined && isNaN(parseInt(body.expenseCategoryId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense category ID. Must be a number.'
      });
    }

    const result = await expenseService.updateExpense(id, {
      amount: body.amount,
      expenseCategoryId: body.expenseCategoryId ? parseInt(body.expenseCategoryId, 10) : undefined,
      description: body.description,
      vendorName: body.vendorName,
      vendorContact: body.vendorContact,
      paymentMethodId: body.paymentMethodId ? parseInt(body.paymentMethodId, 10) : undefined,
      expenseDate: body.expenseDate,
      receiptNumber: body.receiptNumber,
      notes: body.notes,
      isVerified: body.isVerified !== undefined ? body.isVerified : undefined,
      updatedBy: body.updatedBy ? parseInt(body.updatedBy, 10) : undefined
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
 * Delete an expense record
 * DELETE /api/expenses/:id
 * 
 * Response: 200 OK with success message or 404 if not found
 */
export const deleteExpense = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID. Must be a number.'
      });
    }

    const result = await expenseService.deleteExpense(id);

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
 * Verify an expense record
 * POST /api/expenses/:id/verify
 * 
 * Request Body:
 * - verifiedBy (required): User ID who verified the record
 * 
 * Response: 200 OK with verified expense record or 404 if not found
 */
export const verifyExpense = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID. Must be a number.'
      });
    }

    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      return res.status(400).json({
        success: false,
        error: 'verifiedBy is required.'
      });
    }

    const verifiedByNum = parseInt(verifiedBy, 10);
    if (isNaN(verifiedByNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verifiedBy. Must be a number.'
      });
    }

    const result = await expenseService.verifyExpense(id, verifiedByNum);

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
 * Search expenses by various criteria
 * GET /api/expenses/search
 * 
 * Query Parameters:
 * - q: Search term (required)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * 
 * Response: 200 OK with matching expense records
 */
export const searchExpenses = async (req, res, next) => {
  try {
    const { q, page = 1, pageSize = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required.'
      });
    }

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

    const result = await expenseService.searchExpenses(q, {
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum
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
  getExpenses,
  getAllExpenses,
  getExpenseById,
  getExpenseByReceiptNumber,
  getExpensesByCategory,
  getExpensesByDateRange,
  getExpenseStatistics,
  createExpense,
  updateExpense,
  deleteExpense,
  verifyExpense,
  searchExpenses
};
