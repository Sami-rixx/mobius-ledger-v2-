/**
 * Import/Export Controller
 * HTTP request handlers for import and export operations
 */

const importExportService = require('../services/importExportService.js');
const path = require('path');

/**
 * Import/Export Controller
 * Handles HTTP requests for import and export operations
 */
const importExportController = {

  /**
   * List all import/export logs with pagination and filtering
   * GET /api/import-export/logs
   */
  async listLogs(req, res) {
    try {
      const query = req.query;
      const result = await importExportService.getPaginatedLogs(query);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Import/export logs retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve import/export logs'
      });
    }
  },

  /**
   * Count import/export logs
   * GET /api/import-export/logs/count
   */
  async countLogs(req, res) {
    try {
      const query = req.query;
      const count = await importExportService.countLogs(query);
      
      res.json({
        success: true,
        count,
        message: 'Import/export logs count retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to count import/export logs'
      });
    }
  },

  /**
   * Get import/export log by ID
   * GET /api/import-export/logs/:id
   */
  async getLogById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const log = await importExportService.getLogById(id);
      
      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Log not found',
          message: `Import/export log with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: log,
        message: 'Import/export log retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve import/export log'
      });
    }
  },

  /**
   * Get import/export statistics
   * GET /api/import-export/statistics
   */
  async getStatistics(req, res) {
    try {
      const stats = await importExportService.getStatistics();
      
      res.json({
        success: true,
        data: stats,
        message: 'Import/export statistics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve import/export statistics'
      });
    }
  },

  /**
   * Export entire database to SQL file
   * GET /api/import-export/database/export
   */
  async exportDatabase(req, res) {
    try {
      const { filename } = req.query;
      const userId = req.user ? req.user.id : null;
      
      const result = await importExportService.exportDatabase({
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Database export failed'
        });
      }
      
      res.json({
        success: true,
        data: {
          filename: result.filename,
          filepath: result.filepath,
          size: result.size,
          sizeFormatted: importExportService.formatFileSize(result.size)
        },
        message: 'Database exported successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to export database'
      });
    }
  },

  /**
   * Import database from SQL file
   * POST /api/import-export/database/import
   * Note: This endpoint accepts file path in body for server-side files
   */
  async importDatabase(req, res) {
    try {
      const { filepath } = req.body;
      const userId = req.user ? req.user.id : null;
      
      if (!filepath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required',
          message: 'Please provide the filepath parameter'
        });
      }
      
      // Validate that the file is within allowed directories
      const backupDir = importExportService.BACKUP_DIR || path.join(__dirname, '../../backups');
      const exportDir = importExportService.EXPORT_DIR || path.join(__dirname, '../../exports');
      
      const resolvedPath = path.resolve(filepath);
      if (!resolvedPath.startsWith(path.resolve(backupDir)) && 
          !resolvedPath.startsWith(path.resolve(exportDir)) &&
          !resolvedPath.startsWith(path.resolve(__dirname, '../../../'))) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Cannot access files outside allowed directories'
        });
      }
      
      const result = await importExportService.importDatabase({
        filepath: resolvedPath,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Database import failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Database imported successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to import database'
      });
    }
  },

  /**
   * Export table to CSV
   * GET /api/import-export/csv/export
   */
  async exportToCSV(req, res) {
    try {
      const { tableName, filename } = req.query;
      const userId = req.user ? req.user.id : null;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          error: 'Table name is required',
          message: 'Please provide the tableName parameter'
        });
      }
      
      const result = await importExportService.exportToCSV({
        tableName,
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.errors,
          error: result.error,
          message: result.message || 'CSV export failed'
        });
      }
      
      res.json({
        success: true,
        data: {
          filename: result.filename,
          filepath: result.filepath,
          recordCount: result.recordCount,
          size: result.size,
          sizeFormatted: importExportService.formatFileSize(result.size)
        },
        message: 'CSV export completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to export to CSV'
      });
    }
  },

  /**
   * Import data from CSV
   * POST /api/import-export/csv/import
   * Note: This endpoint accepts file path in body for server-side files
   */
  async importFromCSV(req, res) {
    try {
      const { tableName, filepath } = req.body;
      const userId = req.user ? req.user.id : null;
      
      if (!tableName || !filepath) {
        return res.status(400).json({
          success: false,
          error: 'Table name and file path are required',
          message: 'Please provide both tableName and filepath parameters'
        });
      }
      
      // Validate that the file is within allowed directories
      const exportDir = importExportService.EXPORT_DIR || path.join(__dirname, '../../exports');
      const resolvedPath = path.resolve(filepath);
      
      if (!resolvedPath.startsWith(path.resolve(exportDir)) &&
          !resolvedPath.startsWith(path.resolve(__dirname, '../../../'))) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Cannot access files outside allowed directories'
        });
      }
      
      const result = await importExportService.importFromCSV({
        tableName,
        filepath: resolvedPath,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.errors,
          error: result.error,
          message: result.message || 'CSV import failed'
        });
      }
      
      res.json({
        success: true,
        data: {
          recordCount: result.recordCount,
          totalRecords: result.totalRecords
        },
        message: 'CSV import completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to import from CSV'
      });
    }
  },

  /**
   * Create database backup
   * POST /api/import-export/backup
   */
  async createBackup(req, res) {
    try {
      const { filename } = req.body;
      const userId = req.user ? req.user.id : null;
      
      const result = await importExportService.createBackup({
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Backup failed'
        });
      }
      
      res.json({
        success: true,
        data: {
          filename: result.filename,
          filepath: result.filepath,
          size: result.size,
          sizeFormatted: importExportService.formatFileSize(result.size)
        },
        message: 'Database backup created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create backup'
      });
    }
  },

  /**
   * Restore database from backup
   * POST /api/import-export/restore
   */
  async restoreBackup(req, res) {
    try {
      const { filename } = req.body;
      const userId = req.user ? req.user.id : null;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          message: 'Please provide the filename parameter'
        });
      }
      
      const result = await importExportService.restoreBackup({
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Restore failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Database restored successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to restore backup'
      });
    }
  },

  /**
   * List all backup files
   * GET /api/import-export/backups
   */
  async listBackups(req, res) {
    try {
      const backups = await importExportService.listBackups();
      
      res.json({
        success: true,
        data: backups,
        count: backups.length,
        message: 'Backups listed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to list backups'
      });
    }
  },

  /**
   * List all export files
   * GET /api/import-export/exports
   */
  async listExports(req, res) {
    try {
      const exports = await importExportService.listExports();
      
      res.json({
        success: true,
        data: exports,
        count: exports.length,
        message: 'Exports listed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to list exports'
      });
    }
  },

  /**
   * Delete backup file
   * DELETE /api/import-export/backups/:filename
   */
  async deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      const userId = req.user ? req.user.id : null;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          message: 'Please provide the filename parameter'
        });
      }
      
      const result = await importExportService.deleteBackup({
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Failed to delete backup'
        });
      }
      
      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete backup'
      });
    }
  },

  /**
   * Delete export file
   * DELETE /api/import-export/exports/:filename
   */
  async deleteExport(req, res) {
    try {
      const { filename } = req.params;
      const userId = req.user ? req.user.id : null;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          message: 'Please provide the filename parameter'
        });
      }
      
      const result = await importExportService.deleteExport({
        filename,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message || 'Failed to delete export'
        });
      }
      
      res.json({
        success: true,
        message: 'Export deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete export'
      });
    }
  },

  /**
   * Get supported tables for export/import
   * GET /api/import-export/tables
   */
  async getSupportedTables(req, res) {
    try {
      const tables = importExportService.getSupportedTables();
      
      res.json({
        success: true,
        data: tables,
        count: tables.length,
        message: 'Supported tables retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve supported tables'
      });
    }
  }
};

module.exports = importExportController;
