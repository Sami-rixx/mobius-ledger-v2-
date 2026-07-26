/**
 * Transaction Controller
 * HTTP request handlers for transaction endpoints
 * 
 * Handles:
 * - List transactions with pagination
 * - Get single transaction
 * - Create transaction
 * - Update transaction
 * - Delete transaction
 * - Search and filter transactions
 * - Transaction statistics
 */

import {
  getPaginatedTransactions,
  getTransaction,
  getTransactionByReceipt,
  createTransactionRecord,
  updateTransactionRecord,
  deleteTransactionRecord,
  searchTransactions,
  getTransactionStatistics,
  getTransactionCountByFilter
} from '../services/transactionService.js';

/**
 * GET /api/transactions
 * List transactions with pagination and filtering
 */
export const listTransactions = (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      transactionType,
      studentId,
      receiptNumber,
      startDate,
      endDate,
      search,
      orderBy,
      orderDir
    } = req.query;
    
    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      transactionType,
      studentId: studentId ? parseInt(studentId) : undefined,
      receiptNumber,
      startDate,
      endDate,
      search,
      orderBy,
      orderDir
    };
    
    const result = getPaginatedTransactions(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/count
 * Get total transaction count with optional filters
 */
export const countTransactions = (req, res) => {
  try {
    const {
      transactionType,
      studentId,
      receiptNumber,
      startDate,
      endDate
    } = req.query;
    
    const options = {
      transactionType,
      studentId: studentId ? parseInt(studentId) : undefined,
      receiptNumber,
      startDate,
      endDate
    };
    
    const count = getTransactionCountByFilter(options);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
 */
export const getSingleTransaction = (req, res) => {
  try {
    const { id } = req.params;
    const transaction = getTransaction(parseInt(id));
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/receipt/:receiptNumber
 * Get a transaction by receipt number
 */
export const getTransactionByReceiptHandler = (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const transaction = getTransactionByReceipt(receiptNumber);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/transactions
 * Create a new transaction
 */
export const createTransaction = (req, res) => {
  try {
    const transactionData = req.body;
    const userContext = req.user || {};
    
    const result = createTransactionRecord(transactionData, userContext);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/transactions/:id
 * Update a transaction
 */
export const updateTransaction = (req, res) => {
  try {
    const { id } = req.params;
    const transactionData = req.body;
    const userContext = req.user || {};
    
    const result = updateTransactionRecord(parseInt(id), transactionData, userContext);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
export const deleteTransaction = (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteTransactionRecord(parseInt(id));
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/search
 * Search transactions
 */
export const searchTransactionHandler = (req, res) => {
  try {
    const {
      q: search,
      page = 1,
      pageSize = 20,
      ...filters
    } = req.query;
    
    const options = {
      ...filters,
      search,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const result = searchTransactions(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/filter
 * Filter transactions with advanced options
 */
export const filterTransactions = (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      ...filters
    } = req.query;
    
    const options = {
      ...filters,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const result = getPaginatedTransactions(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
export const getTransactionStats = (req, res) => {
  try {
    const {
      transactionType,
      studentId,
      startDate,
      endDate
    } = req.query;
    
    const options = {
      transactionType,
      studentId: studentId ? parseInt(studentId) : undefined,
      startDate,
      endDate
    };
    
    const stats = getTransactionStatistics(options);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  listTransactions,
  countTransactions,
  getSingleTransaction,
  getTransactionByReceiptHandler,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  searchTransactionHandler,
  filterTransactions,
  getTransactionStats
};
