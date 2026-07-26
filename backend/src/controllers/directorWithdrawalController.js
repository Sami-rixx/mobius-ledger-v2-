import * as directorWithdrawalService from '../services/directorWithdrawalService.js';
import { WITHDRAWAL_STATUS } from '../models/DirectorWithdrawal.js';

/**
 * Director Withdrawal Controller
 * Route handlers for director withdrawal API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 * - Authentication/Authorization (when implemented)
 */

/**
 * Get paginated list of director withdrawals
 * GET /api/withdrawals
 * 
 * Query Parameters:
 * - label: Filter by withdrawal label
 * - status: Filter by status (pending, approved, rejected, completed, cancelled)
 * - recipientName: Filter by recipient name
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: withdrawal_date)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated withdrawals list
 */
export const getWithdrawals = async (req, res, next) => {
  try {
    const {
      label,
      status,
      recipientName,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      orderBy = 'withdrawal_date',
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

    // Validate status if provided
    const validStatuses = Object.values(WITHDRAWAL_STATUS);
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await directorWithdrawalService.getPaginatedWithdrawals({
      label,
      status,
      recipientName,
      startDate,
      endDate,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawals',
      details: error.message
    });
  }
};

/**
 * Get all director withdrawals (no pagination)
 * GET /api/withdrawals/all
 * 
 * Query Parameters:
 * - label: Filter by withdrawal label
 * - status: Filter by status
 * - recipientName: Filter by recipient name
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * 
 * Response: 200 OK with all withdrawal records
 */
export const getAllWithdrawals = async (req, res, next) => {
  try {
    const {
      label,
      status,
      recipientName,
      startDate,
      endDate
    } = req.query;

    // Validate status if provided
    const validStatuses = Object.values(WITHDRAWAL_STATUS);
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await directorWithdrawalService.getAllWithdrawals({
      label,
      status,
      recipientName,
      startDate,
      endDate
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all withdrawals',
      details: error.message
    });
  }
};

/**
 * Get director withdrawal by ID
 * GET /api/withdrawals/:id
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Response: 200 OK with withdrawal record or 404 if not found
 */
export const getWithdrawalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    const result = await directorWithdrawalService.getWithdrawalById(withdrawalId);

    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawal',
      details: error.message
    });
  }
};

/**
 * Create a new director withdrawal
 * POST /api/withdrawals
 * 
 * Request Body:
 * {
 *   amount: number (required),
 *   label: string (optional),
 *   purpose: string (required),
 *   description: string (optional),
 *   recipientName: string (required),
 *   recipientContact: string (optional),
 *   paymentMethodId: number (optional),
 *   withdrawalDate: string (YYYY-MM-DD, optional, default: today),
 *   notes: string (optional)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user creating the withdrawal (temporary until auth is implemented)
 * 
 * Response: 201 Created with created withdrawal record or 400 for validation errors
 */
export const createWithdrawal = async (req, res, next) => {
  try {
    const {
      amount,
      label,
      purpose,
      description,
      recipientName,
      recipientContact,
      paymentMethodId,
      withdrawalDate,
      notes
    } = req.body;

    // Get user ID from headers (temporary until auth is implemented)
    const createdBy = parseInt(req.headers['x-user-id'] || '1', 10);

    // Validate required fields
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({
        success: false,
        error: 'Amount is required'
      });
    }

    if (!purpose || purpose.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Purpose is required'
      });
    }

    if (!recipientName || recipientName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Recipient name is required'
      });
    }

    const result = await directorWithdrawalService.createWithdrawal({
      amount,
      label,
      purpose,
      description,
      recipientName,
      recipientContact,
      paymentMethodId,
      withdrawalDate,
      notes
    }, createdBy);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create withdrawal',
      details: error.message
    });
  }
};

/**
 * Update a director withdrawal
 * PUT /api/withdrawals/:id
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Request Body:
 * {
 *   amount: number (optional),
 *   label: string (optional),
 *   purpose: string (optional),
 *   description: string (optional),
 *   recipientName: string (optional),
 *   recipientContact: string (optional),
 *   paymentMethodId: number (optional),
 *   withdrawalDate: string (YYYY-MM-DD, optional),
 *   status: string (optional),
 *   notes: string (optional)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user updating the withdrawal (temporary until auth is implemented)
 * 
 * Response: 200 OK with updated withdrawal record or 400/404 for errors
 */
export const updateWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const updatedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const {
      amount,
      label,
      purpose,
      description,
      recipientName,
      recipientContact,
      paymentMethodId,
      withdrawalDate,
      status,
      notes
    } = req.body;

    const result = await directorWithdrawalService.updateWithdrawal(
      withdrawalId,
      {
        amount,
        label,
        purpose,
        description,
        recipientName,
        recipientContact,
        paymentMethodId,
        withdrawalDate,
        status,
        notes
      },
      updatedBy
    );

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update withdrawal',
      details: error.message
    });
  }
};

/**
 * Delete a director withdrawal
 * DELETE /api/withdrawals/:id
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Headers:
 * - X-User-ID: ID of user deleting the withdrawal (temporary until auth is implemented)
 * 
 * Response: 200 OK with success message or 400/404 for errors
 */
export const deleteWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const deletedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const result = await directorWithdrawalService.deleteWithdrawal(withdrawalId, deletedBy);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete withdrawal',
      details: error.message
    });
  }
};

/**
 * Approve a director withdrawal
 * POST /api/withdrawals/:id/approve
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Request Body:
 * {
 *   notes: string (optional)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user approving the withdrawal (temporary until auth is implemented)
 * 
 * Response: 200 OK with updated withdrawal record or 400/404 for errors
 */
export const approveWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const approvedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const { notes } = req.body;

    const result = await directorWithdrawalService.approveWithdrawal(withdrawalId, approvedBy, notes);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to approve withdrawal',
      details: error.message
    });
  }
};

/**
 * Reject a director withdrawal
 * POST /api/withdrawals/:id/reject
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Request Body:
 * {
 *   reason: string (required)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user rejecting the withdrawal (temporary until auth is implemented)
 * 
 * Response: 200 OK with updated withdrawal record or 400/404 for errors
 */
export const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const rejectedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const result = await directorWithdrawalService.rejectWithdrawal(withdrawalId, rejectedBy, reason);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reject withdrawal',
      details: error.message
    });
  }
};

/**
 * Mark a director withdrawal as completed
 * POST /api/withdrawals/:id/complete
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Request Body:
 * {
 *   transactionId: number (optional)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user marking as completed (temporary until auth is implemented)
 * 
 * Response: 200 OK with updated withdrawal record or 400/404 for errors
 */
export const completeWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const updatedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const { transactionId } = req.body;

    const result = await directorWithdrawalService.completeWithdrawal(
      withdrawalId,
      updatedBy,
      transactionId
    );

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete withdrawal',
      details: error.message
    });
  }
};

/**
 * Cancel a director withdrawal
 * POST /api/withdrawals/:id/cancel
 * 
 * URL Parameters:
 * - id: Director withdrawal ID
 * 
 * Request Body:
 * {
 *   reason: string (optional)
 * }
 * 
 * Headers:
 * - X-User-ID: ID of user cancelling the withdrawal (temporary until auth is implemented)
 * 
 * Response: 200 OK with updated withdrawal record or 400/404 for errors
 */
export const cancelWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal ID. Must be a number.'
      });
    }

    // Get user ID from headers (temporary until auth is implemented)
    const updatedBy = parseInt(req.headers['x-user-id'] || '1', 10);

    const { reason } = req.body;

    const result = await directorWithdrawalService.cancelWithdrawal(withdrawalId, updatedBy, reason);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel withdrawal',
      details: error.message
    });
  }
};

/**
 * Get withdrawal statistics
 * GET /api/withdrawals/statistics
 * 
 * Response: 200 OK with withdrawal statistics
 */
export const getWithdrawalStatistics = async (req, res, next) => {
  try {
    const result = await directorWithdrawalService.getWithdrawalStatistics();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawal statistics',
      details: error.message
    });
  }
};

/**
 * Get all unique labels
 * GET /api/withdrawals/labels
 * 
 * Response: 200 OK with array of unique labels
 */
export const getAllLabels = async (req, res, next) => {
  try {
    const result = await directorWithdrawalService.getAllLabels();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch labels',
      details: error.message
    });
  }
};

/**
 * Get pending withdrawals (awaiting approval)
 * GET /api/withdrawals/pending
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: created_at)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated list of pending withdrawals
 */
export const getPendingWithdrawals = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'created_at',
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

    const result = await directorWithdrawalService.getPendingWithdrawals({
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending withdrawals',
      details: error.message
    });
  }
};

/**
 * Search withdrawals
 * GET /api/withdrawals/search
 * 
 * Query Parameters:
 * - q: Search term (required)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: withdrawal_date)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated search results
 */
export const searchWithdrawals = async (req, res, next) => {
  try {
    const {
      q,
      page = 1,
      pageSize = 20,
      orderBy = 'withdrawal_date',
      orderDir = 'DESC'
    } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

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

    const result = await directorWithdrawalService.searchWithdrawals(q, {
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search withdrawals',
      details: error.message
    });
  }
};

/**
 * Get count of director withdrawals
 * GET /api/withdrawals/count
 * 
 * Query Parameters:
 * - label: Filter by withdrawal label
 * - status: Filter by status
 * - recipientName: Filter by recipient name
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * 
 * Response: 200 OK with count of matching withdrawals
 */
export const getWithdrawalsCount = async (req, res, next) => {
  try {
    const {
      label,
      status,
      recipientName,
      startDate,
      endDate
    } = req.query;

    // Validate status if provided
    const validStatuses = Object.values(WITHDRAWAL_STATUS);
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const count = await directorWithdrawalService.getCount({
      label,
      status,
      recipientName,
      startDate,
      endDate
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get withdrawal count',
      details: error.message
    });
  }
};
