/**
 * AuditTrail Controller
 * HTTP request handlers for audit trail endpoints
 * 
 * Handles:
 * - RESTful CRUD operations
 * - Request/response handling
 * - Error handling
 * - Status codes
 */

import {
  validateAuditTrail,
  getPaginatedAuditTrails,
  getAuditTrail,
  getAuditTrailsByRecord,
  getAuditTrailsByTable,
  getRecentAuditTrails,
  createAuditTrailRecord,
  deleteAuditTrailRecord,
  searchAuditTrails,
  getAuditTrailStats,
  getAuditTrailCountByFilter,
  logFinancialAction
} from '../services/auditTrailService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List audit trails with pagination and filtering
 * GET /api/audit-trail
 */
export const listAuditTrails = (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
      action,
      tableName,
      recordId,
      userId,
      startDate,
      endDate,
      search,
      orderBy,
      orderDir
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      action,
      tableName,
      recordId: recordId ? parseInt(recordId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
      startDate,
      endDate,
      search,
      orderBy,
      orderDir
    };

    const result = getPaginatedAuditTrails(options);
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
 * Get audit trail count
 * GET /api/audit-trail/count
 */
export const countAuditTrails = (req, res) => {
  try {
    const options = req.query;
    const count = getAuditTrailCountByFilter(options);
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
 * Get a single audit trail entry by ID
 * GET /api/audit-trail/:id
 */
export const getSingleAuditTrail = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const auditTrail = getAuditTrail(id);
    
    if (!auditTrail) {
      return res.status(404).json({
        success: false,
        error: 'Audit trail entry not found'
      });
    }

    res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get audit trails for a specific record
 * GET /api/audit-trail/record/:tableName/:recordId
 */
export const getAuditTrailsByRecordHandler = (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const auditTrails = getAuditTrailsByRecord(tableName, parseInt(recordId));
    
    res.json({
      success: true,
      data: auditTrails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get audit trails for a specific table
 * GET /api/audit-trail/table/:tableName
 */
export const getAuditTrailsByTableHandler = (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = req.query;
    
    const result = getAuditTrailsByTable(tableName, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

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
 * Get recent audit trail entries
 * GET /api/audit-trail/recent
 */
export const getRecentAuditTrailsHandler = (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const auditTrails = getRecentAuditTrails(parseInt(limit));
    
    res.json({
      success: true,
      data: auditTrails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new audit trail entry
 * POST /api/audit-trail
 */
export const createAuditTrailHandler = (req, res) => {
  try {
    const data = req.body;
    const userContext = {
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const result = createAuditTrailRecord(data, userContext);
    
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
 * Delete an audit trail entry
 * DELETE /api/audit-trail/:id
 */
export const deleteAuditTrailHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = deleteAuditTrailRecord(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Audit trail entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search audit trails
 * GET /api/audit-trail/search
 */
export const searchAuditTrailsHandler = (req, res) => {
  try {
    const options = req.query;
    const result = searchAuditTrails(options);
    
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
 * Get audit trail statistics
 * GET /api/audit-trail/stats
 */
export const getAuditTrailStatsHandler = (req, res) => {
  try {
    const options = req.query;
    const stats = getAuditTrailStats(options);
    
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

/**
 * Log a financial action to audit trail
 * POST /api/audit-trail/log-financial
 */
export const logFinancialActionHandler = (req, res) => {
  try {
    const { action, tableName, recordId, oldValues, newValues } = req.body;
    const userContext = {
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const result = logFinancialAction(
      action,
      tableName,
      recordId,
      oldValues,
      newValues,
      userContext
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      warning: result.warning
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  listAuditTrails,
  countAuditTrails,
  getSingleAuditTrail,
  getAuditTrailsByRecordHandler,
  getAuditTrailsByTableHandler,
  getRecentAuditTrailsHandler,
  createAuditTrailHandler,
  deleteAuditTrailHandler,
  searchAuditTrailsHandler,
  getAuditTrailStatsHandler,
  logFinancialActionHandler
};
