import * as DirectorWithdrawalModel from '../models/DirectorWithdrawal.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';
import { recordAuditEventStrict, recordAuditEvent, AUDIT } from './auditService.js';
import * as PaymentMethodModel from '../models/PaymentMethod.js';
import * as UserModel from '../models/User.js';
import { WITHDRAWAL_STATUS } from '../models/DirectorWithdrawal.js';

/**
 * Director Withdrawal Service
 * Business logic layer for director withdrawal management
 * 
 * Handles:
 * - Business rule validation
 * - Approval workflow management
 * - Data transformation
 * - Complex queries
 * - Transaction integration
 * - Financial calculations
 * - Audit trail
 */

/**
 * Validation constants
 */
const VALIDATION = {
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 1000000,
  LABEL_MAX_LENGTH: 100,
  PURPOSE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  RECIPIENT_NAME_MAX_LENGTH: 200,
  RECIPIENT_CONTACT_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 2000
};

/**
 * Status transition rules
 * Maps current status to allowed next statuses
 */
const STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: ['cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Validate withdrawal data
 * @param {Object} data - Withdrawal data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result with isValid and errors
 */
function validateWithdrawalData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.amount !== undefined) {
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < VALIDATION.AMOUNT_MIN) {
        errors.push(`Amount must be at least ${VALIDATION.AMOUNT_MIN}`);
      }
      if (amount > VALIDATION.AMOUNT_MAX) {
        errors.push(`Amount must be at most ${VALIDATION.AMOUNT_MAX}`);
      }
    }
  }

  if (!isUpdate || data.purpose !== undefined) {
    if (!data.purpose || data.purpose.trim() === '') {
      errors.push('Purpose is required');
    } else if (data.purpose.length > VALIDATION.PURPOSE_MAX_LENGTH) {
      errors.push(`Purpose must be at most ${VALIDATION.PURPOSE_MAX_LENGTH} characters`);
    }
  }

  if (!isUpdate || data.recipientName !== undefined) {
    if (!data.recipientName || data.recipientName.trim() === '') {
      errors.push('Recipient name is required');
    } else if (data.recipientName.length > VALIDATION.RECIPIENT_NAME_MAX_LENGTH) {
      errors.push(`Recipient name must be at most ${VALIDATION.RECIPIENT_NAME_MAX_LENGTH} characters`);
    }
  }

  if (data.label && data.label.length > VALIDATION.LABEL_MAX_LENGTH) {
    errors.push(`Label must be at most ${VALIDATION.LABEL_MAX_LENGTH} characters`);
  }

  if (data.description && data.description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be at most ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`);
  }

  if (data.recipientContact && data.recipientContact.length > VALIDATION.RECIPIENT_CONTACT_MAX_LENGTH) {
    errors.push(`Recipient contact must be at most ${VALIDATION.RECIPIENT_CONTACT_MAX_LENGTH} characters`);
  }

  if (data.notes && data.notes.length > VALIDATION.NOTES_MAX_LENGTH) {
    errors.push(`Notes must be at most ${VALIDATION.NOTES_MAX_LENGTH} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate status transition
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status to transition to
 * @returns {boolean} - Whether the transition is valid
 */
function validateStatusTransition(currentStatus, newStatus) {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus.toLowerCase()] || [];
  return allowedTransitions.includes(newStatus.toLowerCase());
}

/**
 * Get paginated list of director withdrawals
 * @param {Object} options - Filter and pagination options
 * @param {string} options.label - Filter by withdrawal label
 * @param {string} options.status - Filter by status
 * @param {string} options.recipientName - Filter by recipient name
 * @param {string} options.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} options.endDate - Filter by end date (YYYY-MM-DD)
 * @param {string} options.search - Search term
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with withdrawal records and metadata
 */
export const getPaginatedWithdrawals = async (options = {}) => {
  const {
    label,
    status,
    recipientName,
    startDate,
    endDate,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'withdrawal_date',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Build filter options for model
  const filterOptions = {
    label,
    status,
    recipientName,
    startDate,
    endDate,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  try {
    let withdrawalRecords;
    let total;

    withdrawalRecords = await DirectorWithdrawalModel.getAll(filterOptions);
    total = await DirectorWithdrawalModel.getCount(filterOptions);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Transform records
    const transformedRecords = withdrawalRecords.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      withdrawal_date: record.withdrawal_date,
      is_pending: record.status === WITHDRAWAL_STATUS.PENDING,
      is_approved: record.status === WITHDRAWAL_STATUS.APPROVED,
      is_rejected: record.status === WITHDRAWAL_STATUS.REJECTED,
      is_completed: record.status === WITHDRAWAL_STATUS.COMPLETED,
      is_cancelled: record.status === WITHDRAWAL_STATUS.CANCELLED
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
        hasPreviousPage
      }
    };
  } catch (error) {
    console.error('Error in getPaginatedWithdrawals:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch withdrawals',
      details: error.message
    };
  }
};

/**
 * Get all director withdrawals (no pagination)
 * @param {Object} options - Filter options
 * @returns {Object} - Result with all withdrawal records
 */
export const getAllWithdrawals = async (options = {}) => {
  try {
    const records = await DirectorWithdrawalModel.getAll({ ...options, limit: null, offset: 0 });
    
    const transformedRecords = records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_pending: record.status === WITHDRAWAL_STATUS.PENDING,
      is_approved: record.status === WITHDRAWAL_STATUS.APPROVED,
      is_rejected: record.status === WITHDRAWAL_STATUS.REJECTED,
      is_completed: record.status === WITHDRAWAL_STATUS.COMPLETED,
      is_cancelled: record.status === WITHDRAWAL_STATUS.CANCELLED
    }));

    return {
      success: true,
      data: transformedRecords,
      count: records.length
    };
  } catch (error) {
    console.error('Error in getAllWithdrawals:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch all withdrawals',
      details: error.message
    };
  }
};

/**
 * Get director withdrawal by ID
 * @param {number} id - Withdrawal ID
 * @returns {Object} - Result with withdrawal record
 */
export const getWithdrawalById = async (id) => {
  try {
    const record = await DirectorWithdrawalModel.getById(id);
    
    if (!record) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    return {
      success: true,
      data: {
        ...record,
        amount: parseFloat(record.amount),
        is_pending: record.status === WITHDRAWAL_STATUS.PENDING,
        is_approved: record.status === WITHDRAWAL_STATUS.APPROVED,
        is_rejected: record.status === WITHDRAWAL_STATUS.REJECTED,
        is_completed: record.status === WITHDRAWAL_STATUS.COMPLETED,
        is_cancelled: record.status === WITHDRAWAL_STATUS.CANCELLED
      }
    };
  } catch (error) {
    console.error('Error in getWithdrawalById:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch withdrawal',
      details: error.message
    };
  }
};

/**
 * Create a new director withdrawal
 * @param {Object} data - Withdrawal data
 * @param {number} createdBy - ID of user creating the withdrawal
 * @returns {Object} - Result with created withdrawal record
 */
export const createWithdrawal = async (data, createdBy) => {
  try {
    // Validate data
    const validation = validateWithdrawalData(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
        statusCode: 400
      };
    }

    // Check if payment method exists (if provided)
    if (data.paymentMethodId) {
      const paymentMethod = await PaymentMethodModel.getById(data.paymentMethodId);
      if (!paymentMethod) {
        return {
          success: false,
          error: 'Payment method not found',
          statusCode: 400
        };
      }
    }

    // Check if user exists
    const user = await UserModel.getById(createdBy);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 400
      };
    }

    // Create withdrawal
    const withdrawalData = {
      ...data,
      createdBy
    };

    const record = await DirectorWithdrawalModel.create(withdrawalData);

    recordAuditEvent({
      action: AUDIT.CREATE,
      tableName: 'director_withdrawals',
      recordId: record.id,
      newValues: { amount: record.amount, purpose: record.purpose, status: record.status },
      userId: createdBy
    });

    return {
      success: true,
      message: 'Withdrawal created successfully and is pending approval',
      data: {
        ...record,
        amount: parseFloat(record.amount)
      }
    };
  } catch (error) {
    console.error('Error in createWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to create withdrawal',
      details: error.message
    };
  }
};

/**
 * Update a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {Object} data - Withdrawal data to update
 * @param {number} updatedBy - ID of user updating the withdrawal
 * @returns {Object} - Result with updated withdrawal record
 */
export const updateWithdrawal = async (id, data, updatedBy) => {
  try {
    // Get current withdrawal to check status transition
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);
    
    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Validate data
    const validation = validateWithdrawalData(data, true);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
        statusCode: 400
      };
    }

    // POSTED-RECORD IMMUTABILITY (owner decision): once a withdrawal has
    // left the pending (draft) state it is a posted financial record and
    // can no longer be edited. Corrections happen through the dedicated
    // reject/cancel/reversal flows.
    if (currentWithdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return {
        success: false,
        error: `Cannot update a withdrawal that is ${currentWithdrawal.status}. Only pending withdrawals can be edited.`,
        statusCode: 409
      };
    }

    // Status transitions must go through the dedicated approve/reject/
    // complete/cancel endpoints (which enforce maker-checker); the generic
    // update endpoint can never change status.
    if (data.status && data.status !== currentWithdrawal.status) {
      return {
        success: false,
        error: 'Status cannot be changed through update. Use the approve/reject/complete/cancel endpoints.',
        statusCode: 400
      };
    }

    // Check if payment method exists (if provided)
    if (data.paymentMethodId) {
      const paymentMethod = await PaymentMethodModel.getById(data.paymentMethodId);
      if (!paymentMethod) {
        return {
          success: false,
          error: 'Payment method not found',
          statusCode: 400
        };
      }
    }

    // Check if user exists
    const user = await UserModel.getById(updatedBy);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 400
      };
    }

    // Update withdrawal
    const withdrawalData = {
      ...data,
      updatedBy
    };

    const record = await DirectorWithdrawalModel.update(id, withdrawalData);

    recordAuditEvent({
      action: AUDIT.UPDATE,
      tableName: 'director_withdrawals',
      recordId: id,
      oldValues: { amount: currentWithdrawal.amount, purpose: currentWithdrawal.purpose },
      newValues: { amount: record.amount, purpose: record.purpose },
      userId: updatedBy
    });

    return {
      success: true,
      message: 'Withdrawal updated successfully',
      data: {
        ...record,
        amount: parseFloat(record.amount)
      }
    };
  } catch (error) {
    console.error('Error in updateWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to update withdrawal',
      details: error.message
    };
  }
};

/**
 * Delete a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {number} deletedBy - ID of user deleting the withdrawal
 * @returns {Object} - Result with deletion status
 */
export const deleteWithdrawal = async (id, deletedBy) => {
  try {
    // Get current withdrawal
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);
    
    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Only allow deletion of pending withdrawals
    if (currentWithdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return {
        success: false,
        error: `Cannot delete a withdrawal that is ${currentWithdrawal.status}. Only pending withdrawals can be deleted.`,
        statusCode: 400
      };
    }

    // Check if user exists
    const user = await UserModel.getById(deletedBy);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 400
      };
    }

    const deleted = await DirectorWithdrawalModel.deleteById(id);

    if (!deleted) {
      return {
        success: false,
        error: 'Failed to delete withdrawal',
        statusCode: 500
      };
    }

    recordAuditEvent({
      action: AUDIT.DELETE,
      tableName: 'director_withdrawals',
      recordId: id,
      oldValues: { amount: currentWithdrawal.amount, purpose: currentWithdrawal.purpose, status: currentWithdrawal.status },
      userId: deletedBy
    });

    return {
      success: true,
      message: 'Withdrawal deleted successfully'
    };
  } catch (error) {
    console.error('Error in deleteWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to delete withdrawal',
      details: error.message
    };
  }
};

/**
 * Approve a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {number} approvedBy - ID of user approving
 * @param {string} notes - Approval notes
 * @returns {Object} - Result with updated withdrawal record
 */
export const approveWithdrawal = async (id, approvedBy, notes = null) => {
  try {
    // Get current withdrawal
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);

    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Only pending withdrawals can be approved
    if (currentWithdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return {
        success: false,
        error: `Cannot approve a withdrawal that is ${currentWithdrawal.status}. Only pending withdrawals can be approved.`,
        statusCode: 400
      };
    }

    // Check if approver exists
    const approver = await UserModel.getById(approvedBy);
    if (!approver) {
      return {
        success: false,
        error: 'Approver not found',
        statusCode: 400
      };
    }

    // MAKER-CHECKER (OWNER DECISION D6, specification §6): the creator of a
    // withdrawal can NEVER approve that same withdrawal. Enforced here in
    // the service layer, independent of any route/UI check.
    if (Number(currentWithdrawal.created_by) === Number(approvedBy)) {
      return {
        success: false,
        error: 'Separation of duties: you cannot approve a withdrawal you created yourself',
        statusCode: 403
      };
    }

    // ATOMIC approval (specification §6): status transition + linked
    // financial transaction + ledger update (via trigger) + audit event
    // either all commit or all roll back.
    const approveTx = db.transaction(() => {
      const statusChange = db.prepare(`
        UPDATE director_withdrawals
        SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP,
            notes = COALESCE(notes, '') || ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = ?
      `).run(
        WITHDRAWAL_STATUS.APPROVED,
        approvedBy,
        notes ? `\nApproval note: ${notes}` : '',
        approvedBy,
        id,
        WITHDRAWAL_STATUS.PENDING
      );
      if (statusChange.changes !== 1) {
        throw new Error('Withdrawal is no longer pending');
      }

      const transaction = TransactionModel.createTransaction({
        receiptNumber: generateReceiptNumber(),
        transactionType: 'director_withdrawal',
        amount: currentWithdrawal.amount,
        description: `Director withdrawal #${id}: ${currentWithdrawal.purpose}`,
        paymentMethodId: currentWithdrawal.payment_method_id,
        transactionDate: currentWithdrawal.withdrawal_date,
        reference: `withdrawal:${id}`,
        createdBy: approvedBy,
        updatedBy: approvedBy
      });

      db.prepare('UPDATE director_withdrawals SET transaction_id = ? WHERE id = ?')
        .run(transaction.id, id);

      recordAuditEventStrict({
        action: AUDIT.WITHDRAWAL_APPROVED,
        tableName: 'director_withdrawals',
        recordId: id,
        oldValues: { status: WITHDRAWAL_STATUS.PENDING },
        newValues: { status: WITHDRAWAL_STATUS.APPROVED, transaction_id: transaction.id, amount: currentWithdrawal.amount },
        userId: approvedBy
      });

      return transaction;
    });

    const transaction = approveTx();
    const record = await DirectorWithdrawalModel.getById(id);

    return {
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        ...record,
        amount: parseFloat(record.amount),
        transaction_id: transaction.id
      }
    };
  } catch (error) {
    console.error('Error in approveWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to approve withdrawal',
      details: error.message
    };
  }
};

/**
 * Reject a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {number} rejectedBy - ID of user rejecting
 * @param {string} reason - Reason for rejection
 * @returns {Object} - Result with updated withdrawal record
 */
export const rejectWithdrawal = async (id, rejectedBy, reason) => {
  try {
    if (!reason || reason.trim() === '') {
      return {
        success: false,
        error: 'Rejection reason is required',
        statusCode: 400
      };
    }

    // Get current withdrawal
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);
    
    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Only pending withdrawals can be rejected
    if (currentWithdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      return {
        success: false,
        error: `Cannot reject a withdrawal that is ${currentWithdrawal.status}. Only pending withdrawals can be rejected.`,
        statusCode: 400
      };
    }

    // Check if rejecter exists
    const rejecter = await UserModel.getById(rejectedBy);
    if (!rejecter) {
      return {
        success: false,
        error: 'Rejecter not found',
        statusCode: 400
      };
    }

    // MAKER-CHECKER (OWNER DECISION D6): the creator of a withdrawal can
    // never reject that same withdrawal either.
    if (Number(currentWithdrawal.created_by) === Number(rejectedBy)) {
      return {
        success: false,
        error: 'Separation of duties: you cannot reject a withdrawal you created yourself',
        statusCode: 403
      };
    }

    const rejectTx = db.transaction(() => {
      const record = DirectorWithdrawalModel.reject(id, rejectedBy, reason);
      recordAuditEventStrict({
        action: AUDIT.WITHDRAWAL_REJECTED,
        tableName: 'director_withdrawals',
        recordId: id,
        oldValues: { status: WITHDRAWAL_STATUS.PENDING },
        newValues: { status: WITHDRAWAL_STATUS.REJECTED, reason },
        userId: rejectedBy
      });
      return record;
    });
    await rejectTx();
    const record = await DirectorWithdrawalModel.getById(id);

    return {
      success: true,
      message: 'Withdrawal rejected successfully',
      data: {
        ...record,
        amount: parseFloat(record.amount)
      }
    };
  } catch (error) {
    console.error('Error in rejectWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to reject withdrawal',
      details: error.message
    };
  }
};

/**
 * Mark a director withdrawal as completed
 * @param {number} id - Withdrawal ID
 * @param {number} updatedBy - ID of user marking as completed
 * @param {number} transactionId - Optional transaction ID
 * @returns {Object} - Result with updated withdrawal record
 */
export const completeWithdrawal = async (id, updatedBy, transactionId = null) => {
  try {
    // Get current withdrawal
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);
    
    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Only approved withdrawals can be marked as completed
    if (currentWithdrawal.status !== WITHDRAWAL_STATUS.APPROVED) {
      return {
        success: false,
        error: `Cannot complete a withdrawal that is ${currentWithdrawal.status}. Only approved withdrawals can be completed.`,
        statusCode: 400
      };
    }

    // If transaction ID is provided, verify it exists
    if (transactionId) {
      const transaction = await TransactionModel.getTransactionById(transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          statusCode: 400
        };
      }
    }

    // Check if user exists
    const user = await UserModel.getById(updatedBy);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 400
      };
    }

    const record = await DirectorWithdrawalModel.markAsCompleted(id, updatedBy, transactionId);

    recordAuditEvent({
      action: AUDIT.WITHDRAWAL_COMPLETED,
      tableName: 'director_withdrawals',
      recordId: id,
      newValues: { status: record.status, transaction_id: record.transaction_id },
      userId: updatedBy
    });

    return {
      success: true,
      message: 'Withdrawal marked as completed successfully',
      data: {
        ...record,
        amount: parseFloat(record.amount)
      }
    };
  } catch (error) {
    console.error('Error in completeWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to complete withdrawal',
      details: error.message
    };
  }
};

/**
 * Cancel a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {number} updatedBy - ID of user cancelling
 * @param {string} reason - Reason for cancellation
 * @returns {Object} - Result with updated withdrawal record
 */
export const cancelWithdrawal = async (id, updatedBy, reason = null) => {
  try {
    // Get current withdrawal
    const currentWithdrawal = await DirectorWithdrawalModel.getById(id);
    
    if (!currentWithdrawal) {
      return {
        success: false,
        error: 'Withdrawal not found',
        statusCode: 404
      };
    }

    // Cannot cancel completed withdrawals
    if (currentWithdrawal.status === WITHDRAWAL_STATUS.COMPLETED) {
      return {
        success: false,
        error: 'Cannot cancel a completed withdrawal',
        statusCode: 400
      };
    }

    // Check if user exists
    const user = await UserModel.getById(updatedBy);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 400
      };
    }

    const cancelTx = db.transaction(() => {
      DirectorWithdrawalModel.cancel(id, updatedBy, reason);
      // If the withdrawal was already approved it has a posted financial
      // transaction: cancelling must create a compensating REVERSAL
      // transaction (never delete posted history).
      if (currentWithdrawal.status === WITHDRAWAL_STATUS.APPROVED && currentWithdrawal.transaction_id) {
        const original = TransactionModel.getTransactionById(currentWithdrawal.transaction_id);
        if (original && !original.reversed_by_id) {
          const reversal = TransactionModel.createTransaction({
            transactionType: original.transaction_type,
            amount: -original.amount,
            description: `Reversal of transaction #${original.id} (withdrawal #${id} cancelled)` ,
            paymentMethodId: original.payment_method_id,
            transactionDate: new Date().toISOString().split('T')[0],
            reference: `reversal:${original.id}`,
            createdBy: updatedBy,
            updatedBy: updatedBy,
            reversalOfId: original.id
          });
          db.prepare('UPDATE transactions SET reversed_by_id = ? WHERE id = ?').run(reversal.id, original.id);
          recordAuditEventStrict({
            action: AUDIT.REVERSAL,
            tableName: 'transactions',
            recordId: original.id,
            newValues: { reversal_id: reversal.id },
            userId: updatedBy
          });
        }
      }
      recordAuditEventStrict({
        action: AUDIT.WITHDRAWAL_CANCELLED,
        tableName: 'director_withdrawals',
        recordId: id,
        oldValues: { status: currentWithdrawal.status },
        newValues: { status: WITHDRAWAL_STATUS.CANCELLED, reason },
        userId: updatedBy
      });
    });
    cancelTx();
    const record = await DirectorWithdrawalModel.getById(id);

    return {
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: {
        ...record,
        amount: parseFloat(record.amount)
      }
    };
  } catch (error) {
    console.error('Error in cancelWithdrawal:', error.message);
    throw {
      success: false,
      error: 'Failed to cancel withdrawal',
      details: error.message
    };
  }
};

/**
 * Get withdrawal statistics
 * @returns {Object} - Result with withdrawal statistics
 */
export const getWithdrawalStatistics = async () => {
  try {
    const stats = await DirectorWithdrawalModel.getStatistics();
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error in getWithdrawalStatistics:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch withdrawal statistics',
      details: error.message
    };
  }
};

/**
 * Get all unique labels
 * @returns {Object} - Result with array of labels
 */
export const getAllLabels = async () => {
  try {
    const labels = await DirectorWithdrawalModel.getAllLabels();
    
    return {
      success: true,
      data: labels,
      count: labels.length
    };
  } catch (error) {
    console.error('Error in getAllLabels:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch labels',
      details: error.message
    };
  }
};

/**
 * Get pending withdrawals (awaiting approval)
 * @param {Object} options - Filter and pagination options
 * @returns {Object} - Paginated result with pending withdrawal records
 */
export const getPendingWithdrawals = async (options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = options;

    const offset = (page - 1) * pageSize;

    const filterOptions = {
      status: WITHDRAWAL_STATUS.PENDING,
      limit: pageSize,
      offset,
      orderBy,
      orderDirection: orderDir
    };

    const records = await DirectorWithdrawalModel.getAll(filterOptions);
    const total = await DirectorWithdrawalModel.getCount(filterOptions);

    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const transformedRecords = records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
      is_pending: true
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
        hasPreviousPage
      }
    };
  } catch (error) {
    console.error('Error in getPendingWithdrawals:', error.message);
    throw {
      success: false,
      error: 'Failed to fetch pending withdrawals',
      details: error.message
    };
  }
};

/**
 * Search withdrawals
 * @param {string} query - Search term
 * @param {Object} options - Filter and pagination options
 * @returns {Object} - Paginated result with matching withdrawal records
 */
export const searchWithdrawals = async (query, options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'withdrawal_date',
      orderDir = 'DESC'
    } = options;

    const offset = (page - 1) * pageSize;

    const filterOptions = {
      limit: pageSize,
      offset,
      orderBy,
      orderDirection: orderDir
    };

    // Search in multiple fields
    const records = await DirectorWithdrawalModel.getAll({
      ...filterOptions,
      label: query,
      recipientName: query
    });

    const total = await DirectorWithdrawalModel.getCount({
      label: query,
      recipientName: query
    });

    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const transformedRecords = records.map(record => ({
      ...record,
      amount: parseFloat(record.amount)
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
        hasPreviousPage
      },
      query
    };
  } catch (error) {
    console.error('Error in searchWithdrawals:', error.message);
    throw {
      success: false,
      error: 'Failed to search withdrawals',
      details: error.message
    };
  }
};

// Export constants
export { WITHDRAWAL_STATUS, VALIDATION, STATUS_TRANSITIONS };

// Default export aggregating all named exports above, so this module can
// be consumed either via named imports or via services/index.js's
// `export { default as X } from './directorWithdrawalService.js'` barrel re-export
// (that barrel previously crashed with SyntaxError: does not provide an
// export named 'default' since this file had no default export at all).
export default {
  getPaginatedWithdrawals,
  getAllWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  cancelWithdrawal,
  getWithdrawalStatistics,
  getAllLabels,
  getPendingWithdrawals,
  searchWithdrawals,
  WITHDRAWAL_STATUS,
  VALIDATION,
  STATUS_TRANSITIONS,
};
