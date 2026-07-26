/**
 * AuditTrail Routes
 * RESTful API endpoint definitions for audit trail operations
 * 
 * Endpoints:
 * - GET /api/audit-trail - List audit trails with pagination and filtering
 * - GET /api/audit-trail/count - Get audit trail count
 * - GET /api/audit-trail/:id - Get a single audit trail entry by ID
 * - GET /api/audit-trail/record/:tableName/:recordId - Get audit trails for a specific record
 * - GET /api/audit-trail/table/:tableName - Get audit trails for a specific table
 * - GET /api/audit-trail/recent - Get recent audit trail entries
 * - POST /api/audit-trail - Create a new audit trail entry
 * - DELETE /api/audit-trail/:id - Delete an audit trail entry
 * - GET /api/audit-trail/search - Search audit trails
 * - GET /api/audit-trail/stats - Get audit trail statistics
 * - POST /api/audit-trail/log-financial - Log a financial action to audit trail
 */

import { Router } from 'express';
import {
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
} from '../controllers/auditTrailController.js';

const router = Router();

// GET /api/audit-trail - List audit trails with pagination and filtering
router.get('/', listAuditTrails);

// GET /api/audit-trail/count - Get audit trail count
router.get('/count', countAuditTrails);

// GET /api/audit-trail/:id - Get a single audit trail entry by ID
router.get('/:id', getSingleAuditTrail);

// GET /api/audit-trail/record/:tableName/:recordId - Get audit trails for a specific record
router.get('/record/:tableName/:recordId', getAuditTrailsByRecordHandler);

// GET /api/audit-trail/table/:tableName - Get audit trails for a specific table
router.get('/table/:tableName', getAuditTrailsByTableHandler);

// GET /api/audit-trail/recent - Get recent audit trail entries
router.get('/recent', getRecentAuditTrailsHandler);

// POST /api/audit-trail - Create a new audit trail entry
router.post('/', createAuditTrailHandler);

// DELETE /api/audit-trail/:id - Delete an audit trail entry
router.delete('/:id', deleteAuditTrailHandler);

// GET /api/audit-trail/search - Search audit trails
router.get('/search', searchAuditTrailsHandler);

// GET /api/audit-trail/stats - Get audit trail statistics
router.get('/stats', getAuditTrailStatsHandler);

// POST /api/audit-trail/log-financial - Log a financial action to audit trail
router.post('/log-financial', logFinancialActionHandler);

export default router;
