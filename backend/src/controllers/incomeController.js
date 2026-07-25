import * as incomeService from '../services/incomeService.js';

/**
 * Income Controller
 * Route handlers for income API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of income records
 * GET /api/income
 * 
 * Query Parameters:
 * - categoryId: Filter by income category ID
 * - receiptNumber: Filter by receipt number
 * - payerName: Filter by payer name
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - isVerified: Filter by verification status (true/false)
 * - search: Search term (searches receipt, payer, description, category)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: income_date)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated income list
 */
export const getIncome = async (req, res, next) => {
  try {
    const {
      categoryId,
      receiptNumber,
      payerName,
      startDate,
      endDate,
      isVerified,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'income_date',
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

    const result = await incomeService.getPaginatedIncome({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      receiptNumber,
      payerName,
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
 * Get all income records (no pagination)
 * GET /api/income/all
 * 
 * Query Parameters:
 * - categoryId: Filter by income category ID
 * - receiptNumber: Filter by receipt number
 * - payerName: Filter by payer name
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - isVerified: Filter by verification status
 * 
 * Response: 200 OK with all matching income records
 */
export const getAllIncome = async (req, res, next) => {
  try {
    const {
      categoryId,
      receiptNumber,
      payerName,
      startDate,
      endDate,
      isVerified
    } = req.query;

    const result = await incomeService.getAllIncome({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      receiptNumber,
      payerName,
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
 * Get a single income record by ID
 * GET /api/income/:id
 * 
 * Response: 200 OK with income record or 404 if not found
 */
export const getIncomeById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income ID. Must be a number.'
      });
    }

    const result = await incomeService.getIncomeById(id);

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
 * Get income record by receipt number
 * GET /api/income/receipt/:receiptNumber
 * 
 * Response: 200 OK with income record or 404 if not found
 */
export const getIncomeByReceiptNumber = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;

    if (!receiptNumber) {
      return res.status(400).json({
        success: false,
        error: 'Receipt number is required.'
      });
    }

    const result = await incomeService.getIncomeByReceiptNumber(receiptNumber);

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
 * Get income records by category
 * GET /api/income/category/:categoryId
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * 
 * Response: 200 OK with paginated income records for the category
 */
export const getIncomeByCategory = async (req, res, next) => {
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

    const result = await incomeService.getIncomeByCategory(categoryId, {
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
 * Get income records by date range
 * GET /api/income/date-range
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD, required)
 * - endDate: End date (YYYY-MM-DD, required)
 * 
 * Response: 200 OK with income records in date range
 */
export const getIncomeByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required.'
      });
    }

    const result = await incomeService.getIncomeByDateRange(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new income record
 * POST /api/income
 * 
 * Request Body:
 * - incomeCategoryId (number, required): Income category ID
 * - amount (number, required): Amount (must be positive)
 * - description (string, optional): Description
 * - payerName (string, required): Name of payer
 * - payerContact (string, optional): Payer contact information
 * - paymentMethodId (number, optional): Payment method ID
 * - incomeDate (string, required): Date of income (YYYY-MM-DD)
 * - notes (string, optional): Additional notes
 * - createdBy (number, required): User ID who created the record
 * 
 * Response: 201 Created with created income record or 400/404 with error
 */
export const createIncome = async (req, res, next) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.incomeCategoryId || !data.amount || !data.payerName || !data.incomeDate || !data.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: incomeCategoryId, amount, payerName, incomeDate, createdBy'
      });
    }

    // Validate numeric fields
    const incomeCategoryId = parseInt(data.incomeCategoryId, 10);
    const amount = parseFloat(data.amount);
    const paymentMethodId = data.paymentMethodId ? parseInt(data.paymentMethodId, 10) : undefined;
    const createdBy = parseInt(data.createdBy, 10);

    if (isNaN(incomeCategoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid incomeCategoryId. Must be a number.'
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be a positive number.'
      });
    }

    if (isNaN(createdBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid createdBy. Must be a number.'
      });
    }

    if (paymentMethodId !== undefined && isNaN(paymentMethodId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid paymentMethodId. Must be a number.'
      });
    }

    const result = await incomeService.createIncome({
      incomeCategoryId,
      amount,
      description: data.description,
      payerName: data.payerName,
      payerContact: data.payerContact,
      paymentMethodId,
      incomeDate: data.incomeDate,
      notes: data.notes,
      createdBy
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
 * Update an income record
 * PUT /api/income/:id
 * 
 * Request Body:
 * - receiptNumber (string, optional): Receipt number
 * - amount (number, optional): Amount (must be positive)
 * - incomeCategoryId (number, optional): Income category ID
 * - description (string, optional): Description
 * - payerName (string, optional): Name of payer
 * - payerContact (string, optional): Payer contact information
 * - paymentMethodId (number, optional): Payment method ID
 * - incomeDate (string, optional): Date of income (YYYY-MM-DD)
 * - notes (string, optional): Additional notes
 * - isVerified (boolean, optional): Verification status
 * - updatedBy (number, required): User ID who updated the record
 * 
 * Response: 200 OK with updated income record or 400/404 with error
 */
export const updateIncome = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income ID. Must be a number.'
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

    // Validate amount if provided
    if (data.amount !== undefined) {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount. Must be a positive number.'
        });
      }
    }

    // Validate incomeCategoryId if provided
    if (data.incomeCategoryId !== undefined) {
      const incomeCategoryId = parseInt(data.incomeCategoryId, 10);
      if (isNaN(incomeCategoryId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid incomeCategoryId. Must be a number.'
        });
      }
    }

    const result = await incomeService.updateIncome(id, {
      receiptNumber: data.receiptNumber,
      amount: data.amount,
      incomeCategoryId: data.incomeCategoryId,
      description: data.description,
      payerName: data.payerName,
      payerContact: data.payerContact,
      paymentMethodId: data.paymentMethodId,
      incomeDate: data.incomeDate,
      notes: data.notes,
      isVerified: data.isVerified,
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
 * Delete an income record
 * DELETE /api/income/:id
 * 
 * Response: 200 OK with success message or 404 if not found
 */
export const deleteIncome = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income ID. Must be a number.'
      });
    }

    const result = await incomeService.deleteIncome(id);

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
 * Mark an income record as verified
 * POST /api/income/:id/verify
 * 
 * Request Body:
 * - verifiedBy (number, required): User ID who verified the record
 * 
 * Response: 200 OK with updated income record or 404 if not found
 */
export const verifyIncome = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid income ID. Must be a number.'
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

    const result = await incomeService.verifyIncome(id, verifiedByNum);

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
 * Get income statistics
 * GET /api/income/statistics
 * 
 * Query Parameters:
 * - startDate: Optional start date (YYYY-MM-DD)
 * - endDate: Optional end date (YYYY-MM-DD)
 * 
 * Response: 200 OK with income statistics
 */
export const getIncomeStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await incomeService.getIncomeStatistics({
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

// Export all controller functions
export default {
  getIncome,
  getAllIncome,
  getIncomeById,
  getIncomeByReceiptNumber,
  getIncomeByCategory,
  getIncomeByDateRange,
  createIncome,
  updateIncome,
  deleteIncome,
  verifyIncome,
  getIncomeStatistics
};
