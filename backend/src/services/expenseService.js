import * as ExpenseModel from '../models/Expense.js';
import * as ExpenseCategoryModel from '../models/ExpenseCategory.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * Expense Service
 * Business logic layer for expense management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Financial calculations
 */

/**
 * Get paginated list of expense records
 * @param {Object} options - Filter and pagination options
 * @param {number} options.categoryId - Filter by expense category ID
 * @param {string} options.receiptNumber - Filter by receipt number
 * @param {string} options.vendorName - Filter by vendor name
 * @param {string} options.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} options.endDate - Filter by end date (YYYY-MM-DD)
 * @param {boolean} options.isVerified - Filter by verification status
 * @param {string} options.search - Search term
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with expense records and metadata
 */
export const getPaginatedExpenses = async (options = {}) => {
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
  } = options;

  const offset = (page - 1) * pageSize;

  // Build filter options for model
  const filterOptions = {
    categoryId,
    receiptNumber,
    vendorName,
    startDate,
    endDate,
    isVerified,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  // If search is provided, use search function
  let expenseRecords;
  let total;
  
  if (search) {
    expenseRecords = await ExpenseModel.search(search, { limit: pageSize, offset });
    // For search, we need to get total count separately
    total = await ExpenseModel.count({ categoryId, receiptNumber, vendorName, startDate, endDate, isVerified });
  } else {
    expenseRecords = await ExpenseModel.getAll(filterOptions);
    total = await ExpenseModel.count(filterOptions);
  }

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Transform records (ensure proper types)
  const transformedRecords = expenseRecords.map(record => ({
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
 * Get all expense records (no pagination)
 * @param {Object} options - Filter options
 * @returns {Object} - Success response with expense records
 */
export const getAllExpenses = async (options = {}) => {
  const records = await ExpenseModel.getAll(options);
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
 * Get a single expense record by ID
 * @param {number} id - Expense record ID
 * @returns {Object} - Success response with expense record or error
 */
export const getExpenseById = async (id) => {
  const record = await ExpenseModel.getById(id);
  
  if (!record) {
    return {
      success: false,
      error: 'Expense record not found'
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
 * Get expense record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Object} - Success response with expense record or error
 */
export const getExpenseByReceiptNumber = async (receiptNumber) => {
  const record = await ExpenseModel.getByReceiptNumber(receiptNumber);
  
  if (!record) {
    return {
      success: false,
      error: 'Expense record not found'
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
 * Get expense records by category
 * @param {number} categoryId - Expense category ID
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated result with expense records
 */
export const getExpensesByCategory = async (categoryId, options = {}) => {
  const { page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;

  const records = await ExpenseModel.getByCategory(categoryId, { limit: pageSize, offset });
  const total = await ExpenseModel.count({ categoryId });

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
 * Get expense records by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Success response with expense records
 */
export const getExpensesByDateRange = async (startDate, endDate) => {
  const records = await ExpenseModel.getByDateRange(startDate, endDate);
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
 * Get expense statistics
 * @returns {Object} - Success response with expense statistics
 */
export const getExpenseStatistics = async () => {
  const stats = await ExpenseModel.getStatistics();
  return {
    success: true,
    data: stats
  };
};

/**
 * Create a new expense record with transaction
 * @param {Object} data - Expense data
 * @param {number} data.expenseCategoryId - Expense category ID
 * @param {number} data.amount - Amount
 * @param {string} data.description - Description
 * @param {string} data.vendorName - Vendor name
 * @param {string} data.vendorContact - Vendor contact
 * @param {number} data.paymentMethodId - Payment method ID
 * @param {string} data.expenseDate - Expense date (YYYY-MM-DD)
 * @param {string} data.notes - Notes
 * @param {number} data.createdBy - User ID who created the record
 * @returns {Object} - Success response with created expense record
 */
export const createExpense = async (data) => {
  const {
    expenseCategoryId,
    amount,
    description,
    vendorName,
    vendorContact,
    paymentMethodId,
    expenseDate,
    notes,
    createdBy
  } = data;

  // Validate required fields
  if (!expenseCategoryId || !amount || !vendorName || !expenseDate) {
    return {
      success: false,
      error: 'Required fields: expenseCategoryId, amount, vendorName, expenseDate'
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

  // Validate expense category exists
  const category = await ExpenseCategoryModel.getById(expenseCategoryId);
  if (!category) {
    return {
      success: false,
      error: 'Expense category not found'
    };
  }

  // Generate receipt number (expense-specific format)
  const receiptNumber = generateReceiptNumber();

  // Check if receipt number already exists (shouldn't happen, but be safe)
  const existingReceipt = await ExpenseModel.getByReceiptNumber(receiptNumber);
  if (existingReceipt) {
    return {
      success: false,
      error: 'Receipt number already exists. Please try again.'
    };
  }

  try {
    // Create expense record
    const expenseData = {
      amount: amountNum,
      expenseCategoryId,
      description,
      vendorName,
      vendorContact,
      paymentMethodId,
      expenseDate,
      receiptNumber,
      notes,
      isVerified: false,
      createdBy,
      updatedBy: createdBy
    };

    const expenseRecord = await ExpenseModel.create(expenseData);

    // Create associated transaction
    const transactionData = {
      receipt_number: receiptNumber,
      transaction_type: 'expense',
      amount: amountNum,
      expense_category_id: expenseCategoryId,
      vendor_name: vendorName,
      vendor_contact: vendorContact,
      payment_method_id: paymentMethodId,
      transaction_date: expenseDate,
      description: description || `Expense: ${category.name}`,
      created_by: createdBy
    };

    await TransactionModel.create(transactionData);

    return {
      success: true,
      message: 'Expense record created successfully',
      data: {
        ...expenseRecord,
        amount: parseFloat(expenseRecord.amount),
        is_verified: Boolean(expenseRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    return {
      success: false,
      error: 'Failed to create expense record'
    };
  }
};

/**
 * Update an expense record
 * @param {number} id - Expense record ID
 * @param {Object} data - Updated expense data
 * @returns {Object} - Success response with updated expense record
 */
export const updateExpense = async (id, data) => {
  const {
    amount,
    expenseCategoryId,
    description,
    vendorName,
    vendorContact,
    paymentMethodId,
    expenseDate,
    receiptNumber,
    notes,
    isVerified,
    updatedBy
  } = data;

  // Check if expense record exists
  const existing = await ExpenseModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Expense record not found'
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

  // If expenseCategoryId is provided, validate it exists
  if (expenseCategoryId !== undefined) {
    const category = await ExpenseCategoryModel.getById(expenseCategoryId);
    if (!category) {
      return {
        success: false,
        error: 'Expense category not found'
      };
    }
  }

  try {
    const updateData = {
      amount,
      expenseCategoryId,
      description,
      vendorName,
      vendorContact,
      paymentMethodId,
      expenseDate,
      receiptNumber,
      notes,
      isVerified,
      updatedBy
    };

    const updatedRecord = await ExpenseModel.update(id, updateData);

    return {
      success: true,
      message: 'Expense record updated successfully',
      data: {
        ...updatedRecord,
        amount: parseFloat(updatedRecord.amount),
        is_verified: Boolean(updatedRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    return {
      success: false,
      error: 'Failed to update expense record'
    };
  }
};

/**
 * Delete an expense record
 * @param {number} id - Expense record ID
 * @returns {Object} - Success response
 */
export const deleteExpense = async (id) => {
  const existing = await ExpenseModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Expense record not found'
    };
  }

  try {
    await ExpenseModel.deleteById(id);
    return {
      success: true,
      message: 'Expense record deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return {
      success: false,
      error: 'Failed to delete expense record'
    };
  }
};

/**
 * Verify an expense record
 * @param {number} id - Expense record ID
 * @param {number} verifiedBy - User ID who verified the record
 * @returns {Object} - Success response
 */
export const verifyExpense = async (id, verifiedBy) => {
  const existing = await ExpenseModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Expense record not found'
    };
  }

  try {
    const updatedRecord = await ExpenseModel.update(id, {
      isVerified: true,
      updatedBy: verifiedBy
    });

    return {
      success: true,
      message: 'Expense record verified successfully',
      data: {
        ...updatedRecord,
        amount: parseFloat(updatedRecord.amount),
        is_verified: Boolean(updatedRecord.is_verified)
      }
    };
  } catch (error) {
    console.error('Error verifying expense:', error);
    return {
      success: false,
      error: 'Failed to verify expense record'
    };
  }
};

/**
 * Search expenses by various criteria
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional options
 * @returns {Object} - Success response with matching expense records
 */
export const searchExpenses = async (searchTerm, options = {}) => {
  const records = await ExpenseModel.search(searchTerm, options);
  return {
    success: true,
    data: records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_verified: Boolean(record.is_verified)
    }))
  };
};

// Export all functions as the default export
export default {
  getPaginatedExpenses,
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
