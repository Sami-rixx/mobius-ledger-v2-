import * as IncomeModel from '../models/Income.js';
import db from '../config/database.js';
import { recordAuditEvent, recordAuditEventStrict, AUDIT } from './auditService.js';
import { validateAmount } from '../utils/money.js';
import * as IncomeCategoryModel from '../models/IncomeCategory.js';
import * as TransactionModel from '../models/Transaction.js';
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
    // ATOMIC financial write (specification §11): income row + linked
    // transaction + audit event commit together or not at all. The income
    // row stores the transaction id so the posted pair stays connected,
    // and amount_cents is written on both records (owner decision D8).
    const createTx = db.transaction(() => {
      const transaction = TransactionModel.createTransaction({
        receiptNumber,
        transactionType: 'income',
        amount: amountNum,
        incomeCategoryId,
        paymentMethodId,
        transactionDate: incomeDate,
        description: description || `Income: ${category.name}`,
        createdBy,
        updatedBy: createdBy
      });

      const inserted = db.prepare(`
        INSERT INTO income (
          receipt_number, amount, amount_cents, income_category_id, description,
          payer_name, payer_contact, payment_method_id, transaction_id,
          income_date, notes, is_verified, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        receiptNumber, amountNum, Math.round(amountNum * 100), incomeCategoryId,
        description ?? null, payerName, payerContact ?? null, paymentMethodId ?? null,
        transaction.id, incomeDate, notes ?? null, createdBy ?? null, createdBy ?? null
      );

      recordAuditEventStrict({
        action: AUDIT.CREATE,
        tableName: 'income',
        recordId: inserted.lastInsertRowid,
        newValues: { receiptNumber, amount: amountNum, incomeCategoryId, transactionId: transaction.id },
        userId: createdBy ?? null
      });

      return inserted.lastInsertRowid;
    });

    const incomeId = createTx();
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

  // POSTED-RECORD IMMUTABILITY (owner decision / specification §11):
  // income records are posted financial records. Their monetary facts
  // (amount, date, receipt number) are immutable — corrections must be
  // made with a reversal (POST /api/income/:id/reverse) plus a new record.
  if (amount !== undefined && parseFloat(amount) !== parseFloat(existing.amount)) {
    return {
      success: false,
      statusCode: 409,
      error: 'Posted income amounts are immutable. Reverse this record and create a new one instead.'
    };
  }
  if (incomeDate !== undefined && incomeDate !== existing.income_date) {
    return {
      success: false,
      statusCode: 409,
      error: 'Posted income dates are immutable. Reverse this record and create a new one instead.'
    };
  }
  if (receiptNumber !== undefined && receiptNumber !== existing.receipt_number) {
    return {
      success: false,
      statusCode: 409,
      error: 'Receipt numbers are immutable.'
    };
  }
  if (existing.reversed_by_id || existing.reversal_of_id) {
    return {
      success: false,
      statusCode: 409,
      error: 'Reversed or reversal records cannot be edited.'
    };
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

    recordAuditEvent({
      action: AUDIT.UPDATE,
      tableName: 'income',
      recordId: id,
      oldValues: { description: existing.description, notes: existing.notes, is_verified: existing.is_verified },
      newValues: { description: updatedRecord.description, notes: updatedRecord.notes, is_verified: updatedRecord.is_verified },
      userId: updatedBy ?? null
    });

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
  // POSTED-RECORD IMMUTABILITY (owner decision): posted income is never
  // hard-deleted. Corrections preserve history through reversal records.
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Income record not found'
    };
  }
  return {
    success: false,
    statusCode: 409,
    error: 'Posted income records cannot be deleted. Use POST /api/income/:id/reverse to create a correcting reversal.'
  };
};

/**
 * Reverse a posted income record: creates a compensating negative income
 * record and a compensating transaction, linked to the original. The
 * original row is preserved (immutable ledger).
 */
export const reverseIncome = async (id, actorId, reason = null) => {
  const existing = await IncomeModel.getById(id);
  if (!existing) {
    return { success: false, statusCode: 404, error: 'Income record not found' };
  }
  if (existing.reversed_by_id) {
    return { success: false, statusCode: 409, error: 'This income record has already been reversed' };
  }
  if (existing.reversal_of_id) {
    return { success: false, statusCode: 409, error: 'Reversal records cannot themselves be reversed' };
  }

  try {
    const reversalReceipt = generateReceiptNumber();
    const reverseTx = db.transaction(() => {
      const reversalTransaction = TransactionModel.createTransaction({
        receiptNumber: reversalReceipt,
        transactionType: 'income',
        amount: -parseFloat(existing.amount),
        incomeCategoryId: existing.income_category_id,
        paymentMethodId: existing.payment_method_id,
        transactionDate: new Date().toISOString().split('T')[0],
        description: `Reversal of income ${existing.receipt_number}${reason ? `: ${reason}` : ''}`,
        reference: `reversal:income:${id}`,
        createdBy: actorId,
        updatedBy: actorId,
        reversalOfId: existing.transaction_id ?? null
      });

      const inserted = db.prepare(`
        INSERT INTO income (
          receipt_number, amount, amount_cents, income_category_id, description,
          payer_name, payer_contact, payment_method_id, transaction_id,
          income_date, notes, is_verified, created_by, updated_by, reversal_of_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(
        reversalReceipt,
        -parseFloat(existing.amount),
        -Math.round(parseFloat(existing.amount) * 100),
        existing.income_category_id,
        `Reversal of ${existing.receipt_number}${reason ? `: ${reason}` : ''}`,
        existing.payer_name,
        existing.payer_contact,
        existing.payment_method_id,
        reversalTransaction.id,
        new Date().toISOString().split('T')[0],
        reason ?? null,
        actorId,
        actorId,
        id
      );

      db.prepare('UPDATE income SET reversed_by_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(inserted.lastInsertRowid, actorId, id);
      if (existing.transaction_id) {
        db.prepare('UPDATE transactions SET reversed_by_id = ? WHERE id = ?')
          .run(reversalTransaction.id, existing.transaction_id);
      }

      recordAuditEventStrict({
        action: AUDIT.REVERSAL,
        tableName: 'income',
        recordId: id,
        oldValues: { amount: existing.amount, receipt_number: existing.receipt_number },
        newValues: { reversal_id: inserted.lastInsertRowid, reason },
        userId: actorId
      });

      return inserted.lastInsertRowid;
    });

    const reversalId = reverseTx();
    const reversal = await IncomeModel.getById(reversalId);
    return {
      success: true,
      message: 'Income record reversed successfully',
      data: { original_id: id, reversal }
    };
  } catch (error) {
    console.error('Error reversing income:', error);
    return { success: false, error: 'Failed to reverse income record' };
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
  reverseIncome,
  verifyIncome,
  getIncomeStatistics,
  getIncomeCount
};
