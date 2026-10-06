/**
 * AuditTrail Routes — READ ONLY (specification §7).
 *
 * Audit events are server-generated evidence. The previous client-callable
 * POST /, POST /log-financial and DELETE /:id endpoints have been REMOVED:
 * clients must never be able to fabricate or destroy audit records. The
 * audit_trail table is additionally protected by database triggers that
 * reject UPDATE/DELETE.
 *
 * Endpoints (all require the audit.read permission):
 * - GET /api/audit-trail                              - List with pagination/filtering
 * - GET /api/audit-trail/count                        - Count entries
 * - GET /api/audit-trail/recent                       - Recent entries
 * - GET /api/audit-trail/search                       - Search entries
 * - GET /api/audit-trail/stats                        - Statistics
 * - GET /api/audit-trail/record/:tableName/:recordId  - Entries for a record
 * - GET /api/audit-trail/table/:tableName             - Entries for a table
 * - GET /api/audit-trail/:id                          - Single entry
 */

import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import {
  listAuditTrails,
  countAuditTrails,
  getSingleAuditTrail,
  getAuditTrailsByRecordHandler,
  getAuditTrailsByTableHandler,
  getRecentAuditTrailsHandler,
  searchAuditTrailsHandler,
  getAuditTrailStatsHandler
} from '../controllers/auditTrailController.js';

const router = Router();

router.get('/', requirePermission('audit.read'), listAuditTrails);
router.get('/count', requirePermission('audit.read'), countAuditTrails);
router.get('/recent', requirePermission('audit.read'), getRecentAuditTrailsHandler);
router.get('/search', requirePermission('audit.read'), searchAuditTrailsHandler);
router.get('/stats', requirePermission('audit.read'), getAuditTrailStatsHandler);
router.get('/record/:tableName/:recordId', requirePermission('audit.read'), getAuditTrailsByRecordHandler);
router.get('/table/:tableName', requirePermission('audit.read'), getAuditTrailsByTableHandler);
router.get('/:id', requirePermission('audit.read'), getSingleAuditTrail);

export default router;
