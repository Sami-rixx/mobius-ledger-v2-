import { Router } from 'express';
import * as ImportExportController from '../controllers/importExportController.js';

/**
 * Import/Export Routes
 * API endpoints for data import and export operations
 *
 * Base Path: /api/import-export
 */

const router = Router();

// GET /api/import-export/logs - List all import/export logs with pagination and filtering
router.get('/logs', ImportExportController.listLogs);

// GET /api/import-export/logs/count - Count import/export logs
router.get('/logs/count', ImportExportController.countLogs);

// GET /api/import-export/logs/:id - Get import/export log by ID
router.get('/logs/:id', ImportExportController.getLogById);

// GET /api/import-export/statistics - Get import/export statistics
router.get('/statistics', ImportExportController.getStatistics);

// GET /api/import-export/database/export - Export entire database to SQL file
router.get('/database/export', ImportExportController.exportDatabase);

// POST /api/import-export/database/import - Import database from SQL file
router.post('/database/import', ImportExportController.importDatabase);

// GET /api/import-export/csv/export - Export table to CSV
router.get('/csv/export', ImportExportController.exportToCSV);

// POST /api/import-export/csv/import - Import data from CSV
router.post('/csv/import', ImportExportController.importFromCSV);

// POST /api/import-export/backup - Create database backup
router.post('/backup', ImportExportController.createBackup);

// POST /api/import-export/restore - Restore database from backup
router.post('/restore', ImportExportController.restoreBackup);

// GET /api/import-export/backups - List all backup files
router.get('/backups', ImportExportController.listBackups);

// GET /api/import-export/exports - List all export files
router.get('/exports', ImportExportController.listExports);

// DELETE /api/import-export/backups/:filename - Delete backup file
router.delete('/backups/:filename', ImportExportController.deleteBackup);

// DELETE /api/import-export/exports/:filename - Delete export file
router.delete('/exports/:filename', ImportExportController.deleteExport);

// GET /api/import-export/tables - Get supported tables for export/import
router.get('/tables', ImportExportController.getSupportedTables);

/**
 * Import/Export Routes Summary:
 *
 * GET /logs                          - List all import/export logs with pagination and filtering
 * GET /logs/count                    - Count import/export logs
 * GET /logs/:id                      - Get import/export log by ID
 * GET /statistics                    - Get import/export statistics
 * GET /database/export               - Export entire database to SQL file
 * POST /database/import              - Import database from SQL file
 * GET /csv/export                    - Export table to CSV
 * POST /csv/import                   - Import data from CSV
 * POST /backup                       - Create database backup
 * POST /restore                      - Restore database from backup
 * GET /backups                       - List all backup files
 * GET /exports                       - List all export files
 * DELETE /backups/:filename          - Delete backup file
 * DELETE /exports/:filename          - Delete export file
 * GET /tables                        - Get supported tables for export/import
 */

export default router;
