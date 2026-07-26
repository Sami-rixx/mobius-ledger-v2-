/**
 * Transaction Service
 * Business logic layer for transaction operations
 * 
 * Handles:
 * - Transaction validation
 * - Business rule enforcement
 * - Data transformation
 * - Pagination
 * - Advanced filtering and search
 */

import {
  getAllTransactions,
  getTransactionCount,
  getTransactionById,
  getTransactionByReceiptNumber,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByStudent,
  getTransactionsByDateRange
} from '../models/Transaction.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

// Valid transaction types
const VALID_TYPES = ['income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal'];

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate transaction data
 * @param {Object} data - Transaction data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateTransaction = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.transactionType) {
    errors.push('Transaction type is required');
  } else if (!VALID_TYPES.includes(data.transactionType)) {
    errors.push(`Invalid transaction type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount is required');
  } else if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) < 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (data.transactionDate && isNaN(new Date(data.transactionDate).getTime())) {
    errors.push('Invalid transaction date');
  }
  
  if (data.receiptNumber && typeof data.receiptNumber !== 'string') {
    errors.push('Receipt number must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get paginated transactions with optional filtering
 * @param {Object} options - Filter and pagination options
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Items per page
 * @param {string} options.transactionType - Filter by type
 * @param {number} options.studentId - Filter by student
 * @param {string} options.receiptNumber - Filter by receipt
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {string} options.search - Search term
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with data and pagination info
 */
export const getPaginatedTransactions = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    transactionType,
    studentId,
    receiptNumber,
    startDate,
    endDate,
    search,
    orderBy,
    orderDir
  } = options;
  
  const offset = (page - 1) * pageSize;
  
  // Build filter options for model
  const filterOptions = {
    receiptNumber,
    transactionType,
    studentId,
    startDate,
    endDate,
    orderBy: orderBy || 'transaction_date',
    orderDir: orderDir || 'DESC',
    limit: pageSize,
    offset
  };
  
  // Apply search if provided
  if (search) {
    // For now, search is handled by filtering. In future, could use full-text search
    if (!receiptNumber && !transactionType) {
      // Search by receipt number or description
      filterOptions.receiptNumber = search;
    }
  }
  
  const transactions = getAllTransactions(filterOptions);
  const total = getTransactionCount(filterOptions);
  
  const pagination = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: offset + pageSize < total,
    hasPrevPage: page > 1
  };
  
  return { data: transactions, pagination };
};

/**
 * Get a single transaction by ID with validation
 * @param {number} id - Transaction ID
 * @returns {Object|null} - Transaction or null
 */
export const getTransaction = (id) => {
  if (!id || isNaN(id)) {
    return null;
  }
  return getTransactionById(id);
};

/**
 * Get a transaction by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Object|null} - Transaction or null
 */
export const getTransactionByReceipt = (receiptNumber) => {
  if (!receiptNumber) {
    return null;
  }
  return getTransactionByReceiptNumber(receiptNumber);
};

/**
 * Create a new transaction
 * @param {Object} data - Transaction data
 * @param {Object} userContext - User context for audit fields
 * @returns {Object} - Created transaction or error
 */
export const createTransactionRecord = (data, userContext = {}) => {
  // Validate data
  const validation = validateTransaction(data);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }
  
  // Generate receipt number if not provided
  if (!data.receiptNumber) {
    data.receiptNumber = generateReceiptNumber();
  }
  
  // Set audit fields
  const now = new Date().toISOString();
  const transactionData = {
    ...data,
    transactionDate: data.transactionDate || now.split('T')[0],
    transactionTime: data.transactionTime || now.split('T')[1].split('.')[0],
    createdAt: now,
    updatedAt: now,
    createdBy: userContext.userId || data.createdBy,
    updatedBy: userContext.userId || data.updatedBy
  };
  
  try {
    const transaction = createTransaction(transactionData);
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update a transaction
 * @param {number} id - Transaction ID
 * @param {Object} data - Updated data
 * @param {Object} userContext - User context for audit fields
 * @returns {Object} - Updated transaction or error
 */
export const updateTransactionRecord = (id, data, userContext = {}) => {
  if (!id || isNaN(id)) {
    return { success: false, error: 'Invalid transaction ID' };
  }
  
  // Validate data
  const validation = validateTransaction(data);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }
  
  // Set audit fields
  const transactionData = {
    ...data,
    updatedBy: userContext.userId || data.updatedBy,
    updatedAt: new Date().toISOString()
  };
  
  try {
    const existing = getTransactionById(id);
    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }
    
    const transaction = updateTransaction(id, transactionData);
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a transaction
 * @param {number} id - Transaction ID
 * @returns {Object} - Success status
 */
export const deleteTransactionRecord = (id) => {
  if (!id || isNaN(id)) {
    return { success: false, error: 'Invalid transaction ID' };
  }
  
  try {
    const existing = getTransactionById(id);
    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }
    
    const deleted = deleteTransaction(id);
    return { success: deleted, data: deleted ? existing : null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get transactions by student
 * @param {number} studentId - Student ID
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated transactions
 */
export const getTransactionsByStudentPaginated = (studentId, options = {}) => {
  if (!studentId || isNaN(studentId)) {
    return { success: false, error: 'Invalid student ID' };
  }
  
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = options;
  const offset = (page - 1) * pageSize;
  
  const transactions = getTransactionsByStudent(studentId);
  const total = transactions.length;
  
  // Apply pagination to results
  const paginatedData = transactions.slice(offset, offset + pageSize);
  
  const pagination = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: offset + pageSize < total,
    hasPrevPage: page > 1
  };
  
  return { success: true, data: paginatedData, pagination };
};

/**
 * Get transactions by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated transactions
 */
export const getTransactionsByDateRangePaginated = (startDate, endDate, options = {}) => {
  if (!startDate || !endDate) {
    return { success: false, error: 'Start and end dates are required' };
  }
  
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = options;
  const offset = (page - 1) * pageSize;
  
  const transactions = getTransactionsByDateRange(startDate, endDate);
  const total = transactions.length;
  
  // Apply pagination to results
  const paginatedData = transactions.slice(offset, offset + pageSize);
  
  const pagination = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: offset + pageSize < total,
    hasPrevPage: page > 1
  };
  
  return { success: true, data: paginatedData, pagination };
};

/**
 * Search transactions
 * @param {Object} options - Search options
 * @returns {Object} - Paginated search results
 */
export const searchTransactions = (options = {}) => {
  // For now, delegate to getPaginatedTransactions with search parameter
  return getPaginatedTransactions(options);
};

/**
 * Get transaction statistics
 * @param {Object} options - Filter options
 * @returns {Object} - Statistics
 */
export const getTransactionStatistics = (options = {}) => {
  const allTransactions = getAllTransactions(options);
  
  const stats = {
    totalTransactions: allTransactions.length,
    totalAmount: allTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    byType: {}
  };
  
  // Group by transaction type
  allTransactions.forEach(t => {
    const type = t.transaction_type || 'unknown';
    if (!stats.byType[type]) {
      stats.byType[type] = { count: 0, totalAmount: 0 };
    }
    stats.byType[type].count++;
    stats.byType[type].totalAmount += parseFloat(t.amount) || 0;
  });
  
  return stats;
};

/**
 * Get transaction count by filter
 * @param {Object} options - Filter options
 * @returns {number} - Count
 */
export const getTransactionCountByFilter = (options = {}) => {
  return getTransactionCount(options);
};

export default {
  validateTransaction,
  getPaginatedTransactions,
  getTransaction,
  getTransactionByReceipt,
  createTransactionRecord,
  updateTransactionRecord,
  deleteTransactionRecord,
  getTransactionsByStudentPaginated,
  getTransactionsByDateRangePaginated,
  searchTransactions,
  getTransactionStatistics,
  getTransactionCountByFilter
};
