import { Router } from 'express';
import * as DirectorWithdrawalController from '../controllers/directorWithdrawalController.js';

/**
 * Director Withdrawal Routes
 * API endpoints for director withdrawal management
 * 
 * Base Path: /api/withdrawals
 */

const router = Router();

// GET /api/withdrawals - Get paginated list of director withdrawals
router.get('/', DirectorWithdrawalController.getWithdrawals);

// GET /api/withdrawals/all - Get all director withdrawals without pagination
router.get('/all', DirectorWithdrawalController.getAllWithdrawals);

// GET /api/withdrawals/:id - Get a single director withdrawal by ID
router.get('/:id', DirectorWithdrawalController.getWithdrawalById);

// GET /api/withdrawals/statistics - Get withdrawal statistics
router.get('/statistics', DirectorWithdrawalController.getWithdrawalStatistics);

// GET /api/withdrawals/labels - Get all unique labels
router.get('/labels', DirectorWithdrawalController.getAllLabels);

// GET /api/withdrawals/pending - Get pending withdrawals (awaiting approval)
router.get('/pending', DirectorWithdrawalController.getPendingWithdrawals);

// GET /api/withdrawals/search - Search withdrawals
router.get('/search', DirectorWithdrawalController.searchWithdrawals);

// GET /api/withdrawals/count - Get count of withdrawals
router.get('/count', DirectorWithdrawalController.getWithdrawalsCount);

// POST /api/withdrawals - Create a new director withdrawal
router.post('/', DirectorWithdrawalController.createWithdrawal);

// PUT /api/withdrawals/:id - Update a director withdrawal
router.put('/:id', DirectorWithdrawalController.updateWithdrawal);

// DELETE /api/withdrawals/:id - Delete a director withdrawal
router.delete('/:id', DirectorWithdrawalController.deleteWithdrawal);

// POST /api/withdrawals/:id/approve - Approve a director withdrawal
router.post('/:id/approve', DirectorWithdrawalController.approveWithdrawal);

// POST /api/withdrawals/:id/reject - Reject a director withdrawal
router.post('/:id/reject', DirectorWithdrawalController.rejectWithdrawal);

// POST /api/withdrawals/:id/complete - Mark a director withdrawal as completed
router.post('/:id/complete', DirectorWithdrawalController.completeWithdrawal);

// POST /api/withdrawals/:id/cancel - Cancel a director withdrawal
router.post('/:id/cancel', DirectorWithdrawalController.cancelWithdrawal);

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
