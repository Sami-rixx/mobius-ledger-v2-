/**
 * Transaction Routes
 * API endpoint definitions for transaction operations
 */

import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';
import {
  listTransactions,
  countTransactions,
  getSingleTransaction,
  getTransactionByReceiptHandler,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  reverseTransaction,
  searchTransactionHandler,
  filterTransactions,
  getTransactionStats
} from '../controllers/transactionController.js';

const router = Router();

// GET /api/transactions - List all transactions with pagination
router.get('/', requirePermission('transactions.read'), listTransactions);

// GET /api/transactions/count - Get transaction count
router.get('/count', requirePermission('transactions.read'), countTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', requirePermission('transactions.read'), getSingleTransaction);

// GET /api/transactions/receipt/:receiptNumber - Get by receipt number
router.get('/receipt/:receiptNumber', requirePermission('transactions.read'), getTransactionByReceiptHandler);

// POST /api/transactions - Create new transaction
router.post('/', requirePermission('transactions.create'), idempotency(), createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', requirePermission('transactions.update'), updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', requirePermission('transactions.update'), deleteTransaction);

// POST /api/transactions/:id/reverse - Reverse a posted transaction (correction)
router.post('/:id/reverse', requirePermission('transactions.update'), reverseTransaction);

// GET /api/transactions/search - Search transactions
router.get('/search', requirePermission('transactions.read'), searchTransactionHandler);

// GET /api/transactions/filter - Filter transactions
router.get('/filter', requirePermission('transactions.read'), filterTransactions);

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', requirePermission('transactions.read'), getTransactionStats);

export default router;
