import * as IncomeModel from '../models/Income.js';
import * as IncomeCategoryModel from '../models/IncomeCategory.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';
import { toCents } from '../utils/money.js';
import { logFinancialAction } from './auditTrailService.js';

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
    // Create the income record AND its backing ledger transaction
    // atomically in a single SQLite transaction. Previously these were two
    // separate, unwrapped writes (IncomeModel.create() then
    // TransactionModel.createTransaction()) - if the second write failed
    // (e.g. a DB error, a disk-full condition, process crash) the income
    // row would be left orphaned with no corresponding ledger entry,
    // silently corrupting the daily ledger. better-sqlite3 transactions
    // must be plain synchronous functions, so this performs the raw
    // synchronous inserts directly rather than calling the async model
    // wrapper functions (which would break atomicity if awaited mid-
    // transaction).
    const amountCents = toCents(amountNum);
    const txDescription = description || `Income: ${category.name}`;

    const insertIncome = db.prepare(`
      INSERT INTO income
        (receipt_number, amount, amount_cents, income_category_id, description, payer_name, payer_contact, payment_method_id, income_date, notes, is_verified, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);
    const insertTransaction = db.prepare(`
      INSERT INTO transactions
        (receipt_number, transaction_type, amount, amount_cents, income_category_id, payment_method_id, transaction_date, description, created_by, updated_by)
      VALUES (?, 'income', ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const linkTransaction = db.prepare('UPDATE income SET transaction_id = ? WHERE id = ?');

    const createAtomically = db.transaction(() => {
      const incomeResult = insertIncome.run(
        receiptNumber, amountNum, amountCents, incomeCategoryId, description || null,
        payerName, payerContact || null, paymentMethodId || null, incomeDate, notes || null,
        createdBy, createdBy
      );
      const incomeId = incomeResult.lastInsertRowid;

      const txResult = insertTransaction.run(
        receiptNumber, amountNum, amountCents, incomeCategoryId, paymentMethodId || null,
        incomeDate, txDescription, createdBy, createdBy
      );
      const transactionId = txResult.lastInsertRowid;

      linkTransaction.run(transactionId, incomeId);

      return incomeId;
    });

    const incomeId = createAtomically();
    const incomeRecord = await IncomeModel.getById(incomeId);

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
/**
 * "Delete" a posted income record.
 *
 * SECURITY / FINANCIAL INTEGRITY (owner decision: posted financial records
 * are immutable and are never hard-deleted): this previously called
 * `IncomeModel.deleteById(id)`, permanently destroying the row (and, since
 * there was no FK cascade guard, silently leaving its linked `transactions`
 * row and any downstream reports pointing at a vanished record). It now
 * performs a reversal instead - the original income row and its linked
 * transaction are preserved untouched, a negated reversal transaction is
 * posted against the ledger, and the income row is flagged `is_reversed`
 * so reports/ledgers can exclude it going forward while audit history
 * remains complete. The response envelope (`{ success: true }`) is kept
 * backward compatible with existing callers/tests.
 *
 * @param {number} id - Income record ID
 * @param {number} reversedBy - authenticated user performing the reversal
 * @param {string} [reason] - reason for the reversal/correction
 */
export const deleteIncome = async (id, reversedBy, reason = null) => {
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }

  if (existing.is_reversed) {
    return {
      success: false,
      error: 'This income record has already been reversed'
    };
  }

  try {
    const amount = parseFloat(existing.amount);
    const amountCents = toCents(amount);

    const insertReversalTx = db.prepare(`
      INSERT INTO transactions
        (receipt_number, transaction_type, amount, amount_cents, income_category_id, payment_method_id,
         transaction_date, description, is_reversal, reverses_transaction_id, created_by, updated_by)
      VALUES (?, 'income', ?, ?, ?, ?, date('now'), ?, 1, ?, ?, ?)
    `);
    const markOriginalTxReversed = db.prepare(`
      UPDATE transactions
      SET is_reversed = 1, reversed_by = ?, reversed_at = CURRENT_TIMESTAMP,
          reversal_reason = ?, reversal_transaction_id = ?
      WHERE id = ?
    `);
    const markIncomeReversed = db.prepare(`
      UPDATE income
      SET is_reversed = 1, reversed_by = ?, reversed_at = CURRENT_TIMESTAMP, reversal_reason = ?
      WHERE id = ? AND is_reversed = 0
    `);

    const reverseAtomically = db.transaction(() => {
      const receiptNumber = generateReceiptNumber();
      const reversalTxResult = insertReversalTx.run(
        receiptNumber, -amount, -amountCents, existing.income_category_id, existing.payment_method_id || null,
        `Reversal of income #${id}${reason ? `: ${reason}` : ''}`, existing.transaction_id || null,
        reversedBy, reversedBy
      );
      const reversalTransactionId = reversalTxResult.lastInsertRowid;

      if (existing.transaction_id) {
        markOriginalTxReversed.run(reversedBy, reason, reversalTransactionId, existing.transaction_id);
      }

      const changes = markIncomeReversed.run(reversedBy, reason, id).changes;
      if (changes !== 1) {
        throw new Error('Income record was modified concurrently; reversal aborted');
      }

      return reversalTransactionId;
    });

    const reversalTransactionId = reverseAtomically();

    logFinancialAction('REVERSAL', 'income', id, existing, { reversalTransactionId, reason }, { userId: reversedBy });

    return {
      success: true,
      message: 'Income record reversed successfully (original record preserved for audit)',
      data: { reversalTransactionId }
    };
  } catch (error) {
    console.error('Error reversing income:', error);
    return {
      success: false,
      error: 'Failed to reverse income record'
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
