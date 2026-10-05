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
  getTransactionsByStudent,
  getTransactionsByDateRange
} from '../models/Transaction.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';
import { toCents } from '../utils/money.js';
import db from '../config/database.js';
import { logFinancialAction } from './auditTrailService.js';

// Transaction types that are posted via a dedicated entity table/service
// (income, expenses, school_fee_payments, student_charge_assignments,
// director_withdrawals) which each already implement their own atomic
// create + reversal flow. Reversing one of these through the generic
// /api/transactions endpoint would mark only the `transactions` row
// reversed while leaving its owning entity row (and whatever UI/report
// reads that entity row) completely unaware - creating two diverging
// "sources of truth" for the same money event. Those types must be
// reversed through their own entity-specific endpoint instead.
const ENTITY_BACKED_TYPES = ['income', 'expense', 'school_fee', 'student_charge', 'director_withdrawal'];

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

  const existing = getTransactionById(id);
  if (!existing) {
    return { success: false, error: 'Transaction not found' };
  }

  // Validate the resulting record, not just the (possibly partial) patch -
  // this is a partial-update endpoint (e.g. just correcting a description),
  // and validateTransaction() always requires transactionType/amount to be
  // present. Previously calling it directly against the raw partial `data`
  // meant ANY partial update that didn't resend transactionType and amount
  // was rejected as "invalid data", even though nothing about the request
  // was actually wrong.
  const effective = {
    transactionType: data.transactionType !== undefined ? data.transactionType : existing.transaction_type,
    amount: data.amount !== undefined ? data.amount : existing.amount,
    transactionDate: data.transactionDate !== undefined ? data.transactionDate : existing.transaction_date,
    receiptNumber: data.receiptNumber !== undefined ? data.receiptNumber : existing.receipt_number
  };
  const validation = validateTransaction(effective);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  if (existing.is_reversed) {
    return { success: false, error: 'This transaction has been reversed and can no longer be edited', statusCode: 409 };
  }

  // IMMUTABILITY GUARD (owner decision 6): once a transaction is posted to
  // the ledger, its core financial facts - the amount and the transaction
  // type - may never be silently edited. Previously this endpoint allowed
  // changing the amount/type of any already-posted transaction with no
  // restriction at all, which (a) bypassed every reversal mechanism built
  // for income/expenses/school fees/student charges/withdrawals, and (b)
  // permanently desynced the daily_ledger running totals, since the
  // daily_ledger triggers only react to INSERT/DELETE on `transactions`,
  // never UPDATE - an edited amount/date is never reflected in the ledger
  // totals that were computed at insert time. transaction_date is locked
  // for the same reason (it determines which daily_ledger row absorbed the
  // original amount). Corrections must go through a reversal instead.
  const attemptsAmountChange = data.amount !== undefined && toCents(parseFloat(data.amount)) !== existing.amount_cents;
  const attemptsTypeChange = data.transactionType !== undefined && data.transactionType !== existing.transaction_type;
  const attemptsDateChange = data.transactionDate !== undefined && data.transactionDate !== existing.transaction_date;
  if (attemptsAmountChange || attemptsTypeChange || attemptsDateChange) {
    return {
      success: false,
      error: 'Posted transactions are immutable: amount, transaction type and transaction date cannot be edited. Create a reversal instead.',
      statusCode: 409
    };
  }

  // Set audit fields
  const transactionData = {
    ...data,
    updatedBy: userContext.userId || data.updatedBy,
    updatedAt: new Date().toISOString()
  };
  
  try {
    const transaction = updateTransaction(id, transactionData);
    return { success: true, data: transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Reverse a posted transaction (owner decision 6: posted financial records
 * are never hard-deleted - corrections are reversal transactions that
 * preserve the original record).
 *
 * Transaction types that are posted via a dedicated entity table (income,
 * expenses, school fees, student charges, director withdrawals) must be
 * reversed through that entity's own service/endpoint instead, since each
 * of those already atomically keeps its own table's `is_reversed` flag in
 * sync with the transaction row - reversing only the `transactions` row
 * here would leave the owning entity record looking unreversed. This
 * generic path is for transactions with no such owning entity (manually
 * created ledger entries).
 *
 * @param {number} id - Transaction ID
 * @param {number} [reversedBy] - Authenticated user id performing the reversal
 * @param {string} [reason] - Optional reversal reason
 * @returns {Object} - Success status
 */
export const reverseTransactionRecord = (id, reversedBy = null, reason = null) => {
  if (!id || isNaN(id)) {
    return { success: false, error: 'Invalid transaction ID' };
  }

  const existing = getTransactionById(id);
  if (!existing) {
    return { success: false, error: 'Transaction not found' };
  }

  if (existing.is_reversed) {
    return { success: false, error: 'This transaction has already been reversed' };
  }

  if (existing.is_reversal) {
    return { success: false, error: 'A reversal transaction cannot itself be reversed' };
  }

  if (ENTITY_BACKED_TYPES.includes(existing.transaction_type)) {
    return {
      success: false,
      error: `Transactions of type '${existing.transaction_type}' are posted via a dedicated record and must be reversed through its own endpoint (e.g. DELETE /api/income/:id, /api/expenses/:id, /api/school-fees/:id, /api/charges/assignments/:id/unpay, or the withdrawal workflow), not the generic transactions endpoint.`,
      statusCode: 409
    };
  }

  try {
    const amount = parseFloat(existing.amount);
    const amountCents = existing.amount_cents != null ? existing.amount_cents : toCents(amount);

    const insertReversalTx = db.prepare(`
      INSERT INTO transactions
        (receipt_number, transaction_type, amount, amount_cents, category_id, student_id,
         description, payment_method_id, transaction_date, notes, is_reversal,
         reverses_transaction_id, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, 1, ?, ?, ?)
    `);
    const markOriginalReversed = db.prepare(`
      UPDATE transactions
      SET is_reversed = 1, reversed_by = ?, reversed_at = CURRENT_TIMESTAMP,
          reversal_reason = ?, reversal_transaction_id = ?
      WHERE id = ? AND is_reversed = 0
    `);

    const reverseAtomically = db.transaction(() => {
      const receiptNumber = generateReceiptNumber();
      const reversalTxResult = insertReversalTx.run(
        receiptNumber, existing.transaction_type, -amount, -amountCents, existing.category_id || null,
        existing.student_id || null, `Reversal of transaction #${id}${reason ? `: ${reason}` : ''}`,
        existing.payment_method_id || null, reason, id, reversedBy, reversedBy
      );
      const reversalTransactionId = reversalTxResult.lastInsertRowid;

      const changes = markOriginalReversed.run(reversedBy, reason, reversalTransactionId, id).changes;
      if (changes !== 1) {
        throw new Error('Transaction was modified concurrently; reversal aborted');
      }

      return reversalTransactionId;
    });

    const reversalTransactionId = reverseAtomically();

    logFinancialAction('REVERSAL', 'transactions', id, existing, { reversalTransactionId, reason }, { userId: reversedBy });

    return {
      success: true,
      message: 'Transaction reversed successfully (original record preserved for audit)',
      data: { reversalTransactionId }
    };
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
  reverseTransactionRecord,
  getTransactionsByStudentPaginated,
  getTransactionsByDateRangePaginated,
  searchTransactions,
  getTransactionStatistics,
  getTransactionCountByFilter
};
