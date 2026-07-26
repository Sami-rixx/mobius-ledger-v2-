/**
 * Transaction Service
 * API client for transaction endpoints
 * 
 * Provides:
 * - CRUD operations for transactions
 * - Pagination support
 * - Filtering and search
 * - Statistics
 */

import { api } from './api.js';

// Base URL for transaction endpoints
const BASE_URL = '/api/transactions';

// Transaction types
const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  SCHOOL_FEE: 'school_fee',
  LUNCH_FEE: 'lunch_fee',
  STUDENT_CHARGE: 'student_charge',
  DIRECTOR_WITHDRAWAL: 'director_withdrawal'
};

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of transactions
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.transactionType - Filter by type
 * @param {number} params.studentId - Filter by student
 * @param {string} params.receiptNumber - Filter by receipt
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getTransactions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.receiptNumber) queryParams.append('receiptNumber', params.receiptNumber);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Get a single transaction by ID
 * @param {number} id - Transaction ID
 * @returns {Promise<Object>} - API response with transaction data
 */
export const getTransactionById = async (id) => {
  if (!id) {
    throw new Error('Transaction ID is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Get a transaction by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<Object>} - API response with transaction data
 */
export const getTransactionByReceipt = async (receiptNumber) => {
  if (!receiptNumber) {
    throw new Error('Receipt number is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/receipt/${receiptNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transaction by receipt ${receiptNumber}:`, error);
    throw error;
  }
};

/**
 * Create a new transaction
 * @param {Object} transactionData - Transaction data
 * @param {string} transactionData.transactionType - Type of transaction
 * @param {number} transactionData.amount - Amount
 * @param {string} [transactionData.receiptNumber] - Receipt number (auto-generated if not provided)
 * @param {number} [transactionData.studentId] - Student ID
 * @param {number} [transactionData.categoryId] - Category ID
 * @param {number} [transactionData.incomeCategoryId] - Income category ID
 * @param {number} [transactionData.expenseCategoryId] - Expense category ID
 * @param {string} [transactionData.description] - Description
 * @param {number} [transactionData.paymentMethodId] - Payment method ID
 * @param {string} [transactionData.transactionDate] - Transaction date
 * @param {string} [transactionData.reference] - Reference
 * @param {string} [transactionData.notes] - Notes
 * @returns {Promise<Object>} - API response with created transaction
 */
export const createTransaction = async (transactionData) => {
  if (!transactionData) {
    throw new Error('Transaction data is required');
  }
  
  try {
    const response = await api.post(BASE_URL, transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Update a transaction
 * @param {number} id - Transaction ID
 * @param {Object} transactionData - Updated transaction data
 * @returns {Promise<Object>} - API response with updated transaction
 */
export const updateTransaction = async (id, transactionData) => {
  if (!id) {
    throw new Error('Transaction ID is required');
  }
  if (!transactionData) {
    throw new Error('Transaction data is required');
  }
  
  try {
    const response = await api.put(`${BASE_URL}/${id}`, transactionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a transaction
 * @param {number} id - Transaction ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const deleteTransaction = async (id) => {
  if (!id) {
    throw new Error('Transaction ID is required');
  }
  
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Get transaction count
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} - API response with count
 */
export const getTransactionCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.receiptNumber) queryParams.append('receiptNumber', params.receiptNumber);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction count:', error);
    throw error;
  }
};

/**
 * Search transactions
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {Promise<Object>} - API response with search results
 */
export const searchTransactions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.q) queryParams.append('q', params.q);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  // Add any additional filters
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching transactions:', error);
    throw error;
  }
};

/**
 * Filter transactions with advanced options
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} - API response with filtered results
 */
export const filterTransactions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/filter${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error filtering transactions:', error);
    throw error;
  }
};

/**
 * Get transaction statistics
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} - API response with statistics
 */
export const getTransactionStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/stats${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
    throw error;
  }
};

/**
 * Format transaction for display
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Formatted transaction
 */
export const formatTransaction = (transaction) => {
  if (!transaction) return null;
  
  return {
    ...transaction,
    formattedAmount: `KES ${parseFloat(transaction.amount || 0).toFixed(2)}`,
    formattedDate: transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A',
    formattedTime: transaction.transaction_time || 'N/A',
    status: transaction.is_verified ? 'Verified' : 'Pending',
    typeLabel: getTransactionTypeLabel(transaction.transaction_type)
  };
};

/**
 * Get label for transaction type
 * @param {string} type - Transaction type
 * @returns {string} - Display label
 */
export const getTransactionTypeLabel = (type) => {
  const labels = {
    income: 'Income',
    expense: 'Expense',
    school_fee: 'School Fee',
    lunch_fee: 'Lunch Fee',
    student_charge: 'Student Charge',
    director_withdrawal: 'Director Withdrawal'
  };
  return labels[type] || type || 'Unknown';
};

/**
 * Get color class for transaction type
 * @param {string} type - Transaction type
 * @returns {string} - CSS color class
 */
export const getTransactionTypeColor = (type) => {
  const colors = {
    income: 'text-success',
    school_fee: 'text-success',
    lunch_fee: 'text-success',
    student_charge: 'text-warning',
    expense: 'text-danger',
    director_withdrawal: 'text-primary'
  };
  return colors[type] || 'text-secondary';
};

/**
 * Filter transactions by date range helper
 * @param {Object[]} transactions - Array of transactions
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object[]} - Filtered transactions
 */
export const filterByDateRange = (transactions, startDate, endDate) => {
  if (!startDate && !endDate) return transactions;
  
  return transactions.filter(t => {
    const transactionDate = t.transaction_date || t.created_at;
    if (!transactionDate) return true;
    
    if (startDate) {
      const start = new Date(startDate);
      const transDate = new Date(transactionDate);
      if (transDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include end date
      const transDate = new Date(transactionDate);
      if (transDate >= end) return false;
    }
    
    return true;
  });
};

/**
 * Sort transactions helper
 * @param {Object[]} transactions - Array of transactions
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Object[]} - Sorted transactions
 */
export const sortTransactions = (transactions, sortBy = 'transaction_date', sortOrder = 'desc') => {
  return [...transactions].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Handle date sorting
    if (sortBy.includes('date') || sortBy.includes('time')) {
      aVal = new Date(aVal || a.created_at || '').getTime();
      bVal = new Date(bVal || b.created_at || '').getTime();
    }
    
    // Handle numeric sorting
    if (!isNaN(aVal) && !isNaN(bVal)) {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }
    
    if (aVal === bVal) return 0;
    return sortOrder === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
  });
};

export {
  TRANSACTION_TYPES
};

export default {
  getTransactions,
  getTransactionById,
  getTransactionByReceipt,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionCount,
  searchTransactions,
  filterTransactions,
  getTransactionStatistics,
  formatTransaction,
  getTransactionTypeLabel,
  getTransactionTypeColor,
  filterByDateRange,
  sortTransactions,
  TRANSACTION_TYPES
};
