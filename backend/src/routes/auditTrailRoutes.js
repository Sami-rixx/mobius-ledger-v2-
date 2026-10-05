/**
 * AuditTrail Routes
 * Read-only, permission-gated API endpoints for the audit trail.
 *
 * SECURITY: the audit trail must be server-generated evidence. The
 * previous version of this router exposed `POST /` (create an arbitrary
 * audit row), `DELETE /:id` (destroy audit evidence) and
 * `POST /log-financial` as plain, unauthenticated-at-the-route-level
 * client-callable endpoints - letting any caller fabricate or erase audit
 * history with an attacker-chosen actor/table/record. Those endpoints have
 * been removed entirely. All real audit writes now happen exclusively from
 * trusted server-side code (authController, directorWithdrawalService,
 * import/export service, etc.) calling `logFinancialAction()` directly -
 * never via an HTTP route. The audit_trail table additionally has SQLite
 * triggers that reject any UPDATE/DELETE as defense in depth (see
 * database/migrations/003_audit_immutability.js).
 *
 * Endpoints:
 * - GET /api/audit-trail - List audit trails with pagination and filtering
 * - GET /api/audit-trail/count - Get audit trail count
 * - GET /api/audit-trail/:id - Get a single audit trail entry by ID
 * - GET /api/audit-trail/record/:tableName/:recordId - Get audit trails for a specific record
 * - GET /api/audit-trail/table/:tableName - Get audit trails for a specific table
 * - GET /api/audit-trail/recent - Get recent audit trail entries
 * - GET /api/audit-trail/search - Search audit trails
 * - GET /api/audit-trail/stats - Get audit trail statistics
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

router.use(requirePermission('audit.read'));

router.get('/', listAuditTrails);
router.get('/count', countAuditTrails);
router.get('/record/:tableName/:recordId', getAuditTrailsByRecordHandler);
router.get('/table/:tableName', getAuditTrailsByTableHandler);
router.get('/recent', getRecentAuditTrailsHandler);
router.get('/search', searchAuditTrailsHandler);
router.get('/stats', getAuditTrailStatsHandler);
// NOTE: '/:id' is intentionally registered last so the more specific
// literal paths above (/count, /recent, /search, /stats) are not
// swallowed by this param route.
router.get('/:id', getSingleAuditTrail);

export default router;
