import * as IncomeModel from '../models/Income.js';
import * as IncomeCategoryModel from '../models/IncomeCategory.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * Income Service
 * Business logic layer for income management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Receipt generation
 * - Financial calculations
 */

/**
 * Get paginated list of income records
 * @param {Object} options - Filter and pagination options
 * @param {number} options.categoryId - Filter by income category ID
 * @param {string} options.receiptNumber - Filter by receipt number
 * @param {string} options.payerName - Filter by payer name
 * @param {string} options.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} options.endDate - Filter by end date (YYYY-MM-DD)
 * @param {boolean} options.isVerified - Filter by verification status
 * @param {string} options.search - Search term
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with income records and metadata
 */
export const getPaginatedIncome = async (options = {}) => {
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
  } = options;

  const offset = (page - 1) * pageSize;

  // Build filter options for model
  const filterOptions = {
    categoryId,
    receiptNumber,
    payerName,
    startDate,
    endDate,
    isVerified,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  // If search is provided, use search function
  let incomeRecords;
  let total;
  
  if (search) {
    incomeRecords = await IncomeModel.search(search, { limit: pageSize, offset });
    // For search, we need to get total count separately
    total = await IncomeModel.count({ categoryId, receiptNumber, payerName, startDate, endDate, isVerified });
  } else {
    incomeRecords = await IncomeModel.getAll(filterOptions);
    total = await IncomeModel.count(filterOptions);
  }

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Transform records (ensure proper types)
  const transformedRecords = incomeRecords.map(record => ({
    ...record,
    amount: parseFloat(record.amount),
    is_verified: Boolean(record.is_verified)
  }));

  return {
    success: true,
    data: transformedRecords,
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
 * Get all income records (no pagination)
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with income records
 */
export const getAllIncome = async (options = {}) => {
  const records = await IncomeModel.getAll(options);
  return {
    success: true,
    data: records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    }))
  };
};

/**
 * Get a single income record by ID
 * @param {number} id - Income record ID
 * @returns {Object} - Success response with income record or error
 */
export const getIncomeById = async (id) => {
  const record = await IncomeModel.getById(id);
  
  if (!record) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  return {
    success: true,
    data: {
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    }
  };
};

/**
 * Get income record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Object} - Success response with income record or error
 */
export const getIncomeByReceiptNumber = async (receiptNumber) => {
  const record = await IncomeModel.getByReceiptNumber(receiptNumber);
  
  if (!record) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  return {
    success: true,
    data: {
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    }
  };
};

/**
 * Get income records by category
 * @param {number} categoryId - Income category ID
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated result with income records
 */
export const getIncomeByCategory = async (categoryId, options = {}) => {
  const { page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;

  const records = await IncomeModel.getByCategory(categoryId, { limit: pageSize, offset });
  const total = await IncomeModel.count({ categoryId });

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    success: true,
    data: records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    })),
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
 * Get income records by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Success response with income records
 */
export const getIncomeByDateRange = async (startDate, endDate) => {
  const records = await IncomeModel.getByDateRange(startDate, endDate);
  return {
    success: true,
    data: records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    }))
  };
};

/**
 * Create a new income record with transaction
 * @param {Object} data - Income data
 * @param {number} data.incomeCategoryId - Income category ID
 * @param {number} data.amount - Amount
 * @param {string} data.description - Description
 * @param {string} data.payerName - Payer name
 * @param {string} data.payerContact - Payer contact
 * @param {number} data.paymentMethodId - Payment method ID
 * @param {string} data.incomeDate - Income date (YYYY-MM-DD)
 * @param {string} data.notes - Notes
 * @param {number} data.createdBy - User ID who created the record
 * @returns {Object} - Success response with created income record
 */
export const createIncome = async (data) => {
  const {
    incomeCategoryId,
    amount,
    description,
    payerName,
    payerContact,
    paymentMethodId,
    incomeDate,
    notes,
    createdBy
  } = data;

  // Validate required fields
  if (!incomeCategoryId || !amount || !payerName || !incomeDate) {
    return {
      success: false,
      error: 'Required fields: incomeCategoryId, amount, payerName, incomeDate'
    };
  }

  // Validate amount is positive
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return {
      success: false,
      error: 'Amount must be a positive number'
    };
  }

  // Validate income category exists
  const category = await IncomeCategoryModel.getById(incomeCategoryId);
  if (!category) {
    return {
      success: false,
      error: 'Income category not found'
    };
  }

  // Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // Check if receipt number already exists (shouldn't happen, but be safe)
  const existingReceipt = await IncomeModel.getByReceiptNumber(receiptNumber);
  if (existingReceipt) {
    return {
      success: false,
      error: 'Receipt number already exists. Please try again.'
    };
  }

  try {
    // Create income record
    const incomeData = {
      receiptNumber,
      amount: amountNum,
      incomeCategoryId,
      description,
      payerName,
      payerContact,
      paymentMethodId,
      incomeDate,
      notes,
      isVerified: false,
      createdBy,
      updatedBy: createdBy
    };

    const incomeRecord = await IncomeModel.create(incomeData);

    // Create associated transaction
    const transactionData = {
      receipt_number: receiptNumber,
      transaction_type: 'income',
      amount: amountNum,
      income_category_id: incomeCategoryId,
      payer_name: payerName,
      payer_contact: payerContact,
      payment_method_id: paymentMethodId,
      transaction_date: incomeDate,
      description: description || `Income: ${category.name}`,
      created_by: createdBy
    };

    await TransactionModel.create(transactionData);

    return {
      success: true,
      message: 'Income record created successfully',
      data: {
        ...incomeRecord,
        amount: parseFloat(incomeRecord.amount),
        is_verified: Boolean(incomeRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error creating income:', error);
    return {
      success: false,
      error: 'Failed to create income record'
    };
  }
};

/**
 * Update an income record
 * @param {number} id - Income record ID
 * @param {Object} data - Updated income data
 * @returns {Object} - Success response with updated income record
 */
export const updateIncome = async (id, data) => {
  const {
    receiptNumber,
    amount,
    incomeCategoryId,
    description,
    payerName,
    payerContact,
    paymentMethodId,
    incomeDate,
    notes,
    isVerified,
    updatedBy
  } = data;

  // Check if income record exists
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  // If amount is provided, validate it's positive
  if (amount !== undefined) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return {
        success: false,
        error: 'Amount must be a positive number'
      };
    }
  }

  // If incomeCategoryId is provided, validate it exists
  if (incomeCategoryId !== undefined) {
    const category = await IncomeCategoryModel.getById(incomeCategoryId);
    if (!category) {
      return {
        success: false,
        error: 'Income category not found'
      };
    }
  }

  try {
    const updateData = {
      receiptNumber,
      amount,
      incomeCategoryId,
      description,
      payerName,
      payerContact,
      paymentMethodId,
      incomeDate,
      notes,
      isVerified,
      updatedBy
    };

    const updatedRecord = await IncomeModel.update(id, updateData);

    return {
      success: true,
      message: 'Income record updated successfully',
      data: {
        ...updatedRecord,
        amount: parseFloat(updatedRecord.amount),
        is_verified: Boolean(updatedRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error updating income:', error);
    return {
      success: false,
      error: 'Failed to update income record'
    };
  }
};

/**
 * Delete an income record
 * @param {number} id - Income record ID
 * @returns {Object} - Success response
 */
export const deleteIncome = async (id) => {
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  try {
    await IncomeModel.deleteById(id);
    return {
      success: true,
      message: 'Income record deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting income:', error);
    return {
      success: false,
      error: 'Failed to delete income record'
    };
  }
};

/**
 * Mark an income record as verified
 * @param {number} id - Income record ID
 * @param {number} verifiedBy - User ID who verified
 * @returns {Object} - Success response
 */
export const verifyIncome = async (id, verifiedBy) => {
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  try {
    const updatedRecord = await IncomeModel.update(id, {
      isVerified: true,
      updatedBy: verifiedBy
    });

    return {
      success: true,
      message: 'Income record verified successfully',
      data: {
        ...updatedRecord,
        amount: parseFloat(updatedRecord.amount),
        is_verified: Boolean(updatedRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error verifying income:', error);
    return {
      success: false,
      error: 'Failed to verify income record'
    };
  }
};

/**
 * Get income statistics
 * @param {Object} options - Filter options
 * @returns {Object} - Statistics object
 */
export const getIncomeStatistics = async (options = {}) => {
  const stats = await IncomeModel.getStatistics();
  return {
    success: true,
    data: stats
  };
};

/**
 * Get count of income records
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with count
 */
export const getIncomeCount = async (options = {}) => {
  const count = await IncomeModel.count(options);
  return {
    success: true,
    data: { count }
  };
};

// Export all service functions
export default {
  getPaginatedIncome,
  getAllIncome,
  getIncomeById,
  getIncomeByReceiptNumber,
  getIncomeByCategory,
  getIncomeByDateRange,
  createIncome,
  updateIncome,
  deleteIncome,
  verifyIncome,
  getIncomeStatistics,
  getIncomeCount
};
