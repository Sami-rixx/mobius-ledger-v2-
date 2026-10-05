import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as DirectorWithdrawalController from '../controllers/directorWithdrawalController.js';

/**
 * Director Withdrawal Routes
 * API endpoints for director withdrawal management
 * 
 * Base Path: /api/withdrawals
 */

const router = Router();

// GET /api/withdrawals - Get paginated list of director withdrawals
router.get('/', requirePermission('withdrawals.read'), DirectorWithdrawalController.getWithdrawals);

// GET /api/withdrawals/all - Get all director withdrawals without pagination
router.get('/all', requirePermission('withdrawals.read'), DirectorWithdrawalController.getAllWithdrawals);

// GET /api/withdrawals/:id - Get a single director withdrawal by ID
router.get('/:id', requirePermission('withdrawals.read'), DirectorWithdrawalController.getWithdrawalById);

// GET /api/withdrawals/statistics - Get withdrawal statistics
router.get('/statistics', requirePermission('withdrawals.read'), DirectorWithdrawalController.getWithdrawalStatistics);

// GET /api/withdrawals/labels - Get all unique labels
router.get('/labels', requirePermission('withdrawals.read'), DirectorWithdrawalController.getAllLabels);

// GET /api/withdrawals/pending - Get pending withdrawals (awaiting approval)
router.get('/pending', requirePermission('withdrawals.read'), DirectorWithdrawalController.getPendingWithdrawals);

// GET /api/withdrawals/search - Search withdrawals
router.get('/search', requirePermission('withdrawals.read'), DirectorWithdrawalController.searchWithdrawals);

// GET /api/withdrawals/count - Get count of withdrawals
router.get('/count', requirePermission('withdrawals.read'), DirectorWithdrawalController.getWithdrawalsCount);

// POST /api/withdrawals - Create a new director withdrawal
router.post('/', requirePermission('withdrawals.create'), DirectorWithdrawalController.createWithdrawal);

// PUT /api/withdrawals/:id - Update a director withdrawal
router.put('/:id', requirePermission('withdrawals.update'), DirectorWithdrawalController.updateWithdrawal);

// DELETE /api/withdrawals/:id - Delete a director withdrawal
router.delete('/:id', requirePermission('withdrawals.update'), DirectorWithdrawalController.deleteWithdrawal);

// POST /api/withdrawals/:id/approve - Approve a director withdrawal
router.post('/:id/approve', requirePermission('withdrawals.approve'), DirectorWithdrawalController.approveWithdrawal);

// POST /api/withdrawals/:id/reject - Reject a director withdrawal
router.post('/:id/reject', requirePermission('withdrawals.reject'), DirectorWithdrawalController.rejectWithdrawal);

// POST /api/withdrawals/:id/complete - Mark a director withdrawal as completed
router.post('/:id/complete', requirePermission('withdrawals.update'), DirectorWithdrawalController.completeWithdrawal);

// POST /api/withdrawals/:id/cancel - Cancel a director withdrawal
router.post('/:id/cancel', requirePermission('withdrawals.update'), DirectorWithdrawalController.cancelWithdrawal);

/**
 * Director Withdrawal Routes Summary:
 * 
 * GET    /api/withdrawals                    - List withdrawals (paginated)
 * GET    /api/withdrawals/all                - List all withdrawals
 * GET    /api/withdrawals/:id                - Get withdrawal by ID
 * GET    /api/withdrawals/statistics          - Get withdrawal statistics
 * GET    /api/withdrawals/labels              - Get all unique labels
 * GET    /api/withdrawals/pending             - Get pending withdrawals
 * GET    /api/withdrawals/search               - Search withdrawals
 * GET    /api/withdrawals/count               - Get withdrawal count
 * POST   /api/withdrawals                    - Create new withdrawal
 * PUT    /api/withdrawals/:id                - Update withdrawal
 * DELETE /api/withdrawals/:id                - Delete withdrawal
 * POST   /api/withdrawals/:id/approve        - Approve withdrawal
 * POST   /api/withdrawals/:id/reject         - Reject withdrawal
 * POST   /api/withdrawals/:id/complete       - Mark as completed
 * POST   /api/withdrawals/:id/cancel         - Cancel withdrawal
 */

export default router;
