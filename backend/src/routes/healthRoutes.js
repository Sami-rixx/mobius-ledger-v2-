import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', (req, res) => {
  try {
    // Check database connection
    const dbCheck = db.prepare('SELECT 1').get();
    const isDbConnected = dbCheck !== undefined;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

/**
 * Database info endpoint
 * GET /api/health/db
 */
router.get('/db', (req, res) => {
  try {
    const tableCount = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = ?').get('table').count;
    const rowCounts = db.prepare(`
      SELECT 
        name as table_name,
        (SELECT COUNT(*) FROM sqlite_master WHERE name = name AND type = 'table') as row_count
      FROM sqlite_master 
      WHERE type = 'table'
    `).all();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tables: tableCount,
      row_counts: rowCounts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
