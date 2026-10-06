import { Router } from 'express';
import * as ImportExportController from '../controllers/importExportController.js';
import { requirePermission } from '../middleware/auth.js';

/**
 * Import/Export Routes — permission-gated administrative surface
 * (specification §8). Defaults: full database export/import/backup and
 * CSV import/export require `import.export` (Admin); restore additionally
 * requires `database.restore` (Admin) plus an explicit confirmation field,
 * creates a pre-restore backup and verifies integrity afterwards.
 *
 * Arbitrary filesystem paths are NEVER accepted: all file references are
 * server-controlled filenames validated against the backup/export
 * directories (traversal rejected).
 *
 * Base Path: /api/import-export
 */

const router = Router();

// Logs & statistics
router.get('/logs', requirePermission('import.export'), ImportExportController.listLogs);
router.get('/logs/count', requirePermission('import.export'), ImportExportController.countLogs);
router.get('/logs/:id', requirePermission('import.export'), ImportExportController.getLogById);
router.get('/statistics', requirePermission('import.export'), ImportExportController.getStatistics);

// Full database export (Admin-level permission, audited)
router.get('/database/export', requirePermission('import.export'), ImportExportController.exportDatabase);

// Database import = restoring a server-controlled backup file (Admin,
// audited). Arbitrary SQL/filepaths are rejected inside the service/model.
router.post('/database/import', requirePermission('database.restore'), ImportExportController.importDatabase);

// CSV export/import (audited; table names allowlisted server-side)
router.get('/csv/export', requirePermission('import.export'), ImportExportController.exportToCSV);
router.post('/csv/import', requirePermission('import.export'), ImportExportController.importFromCSV);

// Backups
router.post('/backup', requirePermission('import.export'), ImportExportController.createBackup);
router.post('/restore', requirePermission('database.restore'), ImportExportController.restoreBackup);
router.get('/backups', requirePermission('import.export'), ImportExportController.listBackups);
router.get('/exports', requirePermission('import.export'), ImportExportController.listExports);
router.delete('/backups/:filename', requirePermission('database.restore'), ImportExportController.deleteBackup);
router.delete('/exports/:filename', requirePermission('import.export'), ImportExportController.deleteExport);

// Supported tables
router.get('/tables', requirePermission('import.export'), ImportExportController.getSupportedTables);

export default router;
