/**
 * Import/Export Service
 * Service layer for import and export operations
 * Handles business logic, validation, and coordinates between models
 */

const { ImportExport } = require('../models');
const fs = require('fs');
const path = require('path');

// Validation constants
const IMPORT_EXPORT_VALIDATION = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_CSV_ROWS: 100000,
  ALLOWED_EXTENSIONS: {
    sql: ['.sql'],
    csv: ['.csv'],
    backup: ['.sql', '.backup']
  },
  SUPPORTED_TYPES: ['database', 'csv', 'backup'],
  SUPPORTED_ACTIONS: ['export', 'import', 'backup', 'restore'],
  DEFAULT_PAGE_SIZE: 20
};

// Error messages
const ERROR_MESSAGES = {
  INVALID_TYPE: 'Invalid type. Must be one of: database, csv, backup',
  INVALID_ACTION: 'Invalid action. Must be one of: export, import, backup, restore',
  INVALID_TABLE: (table) => `Table ${table} is not supported for this operation`,
  FILE_TOO_LARGE: (size) => `File size ${size} exceeds maximum allowed size of ${IMPORT_EXPORT_VALIDATION.MAX_FILE_SIZE / (1024 * 1024)}MB`,
  FILE_NOT_FOUND: (filename) => `File ${filename} not found`,
  INVALID_FILE_EXTENSION: (ext) => `Invalid file extension: ${ext}`,
  NO_DATA_TO_EXPORT: 'No data to export',
  EXPORT_FAILED: 'Export operation failed',
  IMPORT_FAILED: 'Import operation failed',
  BACKUP_FAILED: 'Backup operation failed',
  RESTORE_FAILED: 'Restore operation failed'
};

/**
 * Import/Export Service
 * Provides business logic layer for import and export operations
 */
const importExportService = {

  /**
   * Validate import/export parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  validateParams(params = {}) {
    const errors = [];
    
    if (params.type && !IMPORT_EXPORT_VALIDATION.SUPPORTED_TYPES.includes(params.type)) {
      errors.push(ERROR_MESSAGES.INVALID_TYPE);
    }
    
    if (params.action && !IMPORT_EXPORT_VALIDATION.SUPPORTED_ACTIONS.includes(params.action)) {
      errors.push(ERROR_MESSAGES.INVALID_ACTION);
    }
    
    if (params.tableName) {
      const supportedTables = ImportExport.getSupportedTables();
      if (!supportedTables.includes(params.tableName) && params.action !== 'database') {
        errors.push(ERROR_MESSAGES.INVALID_TABLE(params.tableName));
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      valid: errors.length === 0
    };
  },

  /**
   * Create pagination parameters
   * @param {Object} query - Query parameters
   * @returns {Object} - Pagination parameters
   */
  createPaginationParams(query = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || IMPORT_EXPORT_VALIDATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    
    return {
      page,
      pageSize,
      offset
    };
  },

  /**
   * Validate file for import
   * @param {string} filepath - File path
   * @param {string} type - File type (csv, sql, backup)
   * @returns {Object} - Validation result
   */
  validateFile(filepath, type = 'csv') {
    try {
      // Check file exists
      if (!fs.existsSync(filepath)) {
        return {
          isValid: false,
          error: ERROR_MESSAGES.FILE_NOT_FOUND(path.basename(filepath))
        };
      }
      
      // Check file size
      const stats = fs.statSync(filepath);
      if (stats.size > IMPORT_EXPORT_VALIDATION.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: ERROR_MESSAGES.FILE_TOO_LARGE(this.formatFileSize(stats.size))
        };
      }
      
      // Check file extension
      const ext = path.extname(filepath).toLowerCase();
      const allowedExtensions = IMPORT_EXPORT_VALIDATION.ALLOWED_EXTENSIONS[type] || [];
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
        return {
          isValid: false,
          error: ERROR_MESSAGES.INVALID_FILE_EXTENSION(ext)
        };
      }
      
      return {
        isValid: true,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size)
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  },

  /**
   * Get paginated import/export logs
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Paginated logs
   */
  async getPaginatedLogs(query = {}) {
    const pagination = this.createPaginationParams(query);
    const { type, action, status, startDate, endDate } = query;
    
    const logs = await ImportExport.getAllLogs({
      limit: pagination.pageSize,
      offset: pagination.offset,
      type,
      action,
      status,
      startDate,
      endDate
    });
    
    const total = await ImportExport.countLogs({
      type,
      action,
      status,
      startDate,
      endDate
    });
    
    return {
      data: logs,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    };
  },

  /**
   * Get import/export log by ID
   * @param {number} id - Log ID
   * @returns {Promise<Object|null>} - Log entry or null
   */
  async getLogById(id) {
    if (!id || isNaN(id)) {
      return null;
    }
    return await ImportExport.getLogById(parseInt(id));
  },

  /**
   * Get import/export statistics
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics() {
    return await ImportExport.getStatistics();
  },

  /**
   * Export entire database
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportDatabase(params = {}) {
    const { filename, userId } = params;
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'database',
      action: 'export',
      fileName: filename || null,
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.exportDatabase(filename);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed',
        recordCount: 0,
        fileName: result.filename
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.EXPORT_FAILED
      };
    }
  },

  /**
   * Import database from SQL file
   * @param {Object} params - Import parameters
   * @returns {Promise<Object>} - Import result
   */
  async importDatabase(params = {}) {
    const { filepath, userId } = params;
    
    // Validate file
    const fileValidation = this.validateFile(filepath, 'sql');
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error
      };
    }
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'database',
      action: 'import',
      fileName: path.basename(filepath),
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.importDatabase(filepath);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed'
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.IMPORT_FAILED
      };
    }
  },

  /**
   * Export table to CSV
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportToCSV(params = {}) {
    const { tableName, filename, userId } = params;
    
    // Validate parameters
    const validation = this.validateParams({ tableName, type: 'csv', action: 'export' });
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'csv',
      action: 'export',
      tableName,
      fileName: filename || null,
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.exportToCSV(tableName, filename);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed',
        recordCount: result.recordCount,
        fileName: result.filename
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.EXPORT_FAILED
      };
    }
  },

  /**
   * Import data from CSV
   * @param {Object} params - Import parameters
   * @returns {Promise<Object>} - Import result
   */
  async importFromCSV(params = {}) {
    const { tableName, filepath, userId } = params;
    
    // Validate parameters
    const validation = this.validateParams({ tableName, type: 'csv', action: 'import' });
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    // Validate file
    const fileValidation = this.validateFile(filepath, 'csv');
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error
      };
    }
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'csv',
      action: 'import',
      tableName,
      fileName: path.basename(filepath),
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.importFromCSV(tableName, filepath, userId);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed',
        recordCount: result.recordCount
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.IMPORT_FAILED
      };
    }
  },

  /**
   * Create database backup
   * @param {Object} params - Backup parameters
   * @returns {Promise<Object>} - Backup result
   */
  async createBackup(params = {}) {
    const { filename, userId } = params;
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'backup',
      action: 'backup',
      fileName: filename || null,
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.createBackup(filename);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed',
        fileName: result.filename
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.BACKUP_FAILED
      };
    }
  },

  /**
   * Restore database from backup
   * @param {Object} params - Restore parameters
   * @returns {Promise<Object>} - Restore result
   */
  async restoreBackup(params = {}) {
    const { filename, userId } = params;
    
    // Validate file
    const filepath = path.join(ImportExport.BACKUP_DIR, filename);
    const fileValidation = this.validateFile(filepath, 'backup');
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error
      };
    }
    
    // Create log entry
    const log = await ImportExport.createLog({
      type: 'backup',
      action: 'restore',
      fileName: filename,
      status: 'in_progress',
      userId
    });
    
    try {
      const result = await ImportExport.restoreBackup(filename);
      
      // Update log
      await ImportExport.updateLogStatus(log.id, {
        status: 'completed'
      });
      
      return {
        ...result,
        logId: log.id
      };
    } catch (error) {
      await ImportExport.updateLogStatus(log.id, {
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: ERROR_MESSAGES.RESTORE_FAILED
      };
    }
  },

  /**
   * List backup files
   * @returns {Promise<Array>} - Array of backup files
   */
  async listBackups() {
    return await ImportExport.listBackups();
  },

  /**
   * List export files
   * @returns {Promise<Array>} - Array of export files
   */
  async listExports() {
    return await ImportExport.listExports();
  },

  /**
   * Delete backup file
   * @param {Object} params - Delete parameters
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteBackup(params = {}) {
    const { filename, userId } = params;
    
    if (!filename) {
      return {
        success: false,
        error: 'Filename is required'
      };
    }
    
    try {
      const result = await ImportExport.deleteBackup(filename);
      
      // Create log entry
      await ImportExport.createLog({
        type: 'backup',
        action: 'delete',
        fileName: filename,
        status: result.success ? 'completed' : 'failed',
        errorMessage: result.error,
        userId
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Delete export file
   * @param {Object} params - Delete parameters
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteExport(params = {}) {
    const { filename, userId } = params;
    
    if (!filename) {
      return {
        success: false,
        error: 'Filename is required'
      };
    }
    
    try {
      const result = await ImportExport.deleteExport(filename);
      
      // Create log entry
      await ImportExport.createLog({
        type: 'csv',
        action: 'delete',
        fileName: filename,
        status: result.success ? 'completed' : 'failed',
        errorMessage: result.error,
        userId
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get supported tables for export/import
   * @returns {Array} - Array of supported table names
   */
  getSupportedTables() {
    return ImportExport.getSupportedTables();
  },

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

// Export validation constants
importExportService.IMPORT_EXPORT_VALIDATION = IMPORT_EXPORT_VALIDATION;
importExportService.ERROR_MESSAGES = ERROR_MESSAGES;

module.exports = importExportService;
