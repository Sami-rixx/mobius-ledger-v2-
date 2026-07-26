/**
 * Transaction Routes
 * API endpoint definitions for transaction operations
 */

import { Router } from 'express';
import {
  listTransactions,
  countTransactions,
  getSingleTransaction,
  getTransactionByReceiptHandler,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  searchTransactionHandler,
  filterTransactions,
  getTransactionStats
} from '../controllers/transactionController.js';

const router = Router();

// GET /api/transactions - List all transactions with pagination
router.get('/', listTransactions);

// GET /api/transactions/count - Get transaction count
router.get('/count', countTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getSingleTransaction);

// GET /api/transactions/receipt/:receiptNumber - Get by receipt number
router.get('/receipt/:receiptNumber', getTransactionByReceiptHandler);

// POST /api/transactions - Create new transaction
router.post('/', createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

// GET /api/transactions/search - Search transactions
router.get('/search', searchTransactionHandler);

// GET /api/transactions/filter - Filter transactions
router.get('/filter', filterTransactions);

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', getTransactionStats);

export default router;
