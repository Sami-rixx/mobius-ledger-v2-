/**
 * BackupCard Component
 * Card component for displaying backup file information
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatDate, formatFileSize } from '../services/importExportService.js';
import './BackupCard.scss';

/**
 * BackupCard Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.backup - Backup file data
 * @param {string} props.backup.filename - Backup filename
 * @param {string} props.backup.filepath - Full file path
 * @param {number} props.backup.size - File size in bytes
 * @param {string} props.backup.created_at - Creation timestamp
 * @param {boolean} props.loading - Whether to show loading state
 * @param {Function} props.onRestore - Restore handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onDownload - Download handler
 * @param {string} props.className - Additional CSS classes
 */
function BackupCard({
  backup,
  loading = false,
  onRestore,
  onDelete,
  onDownload,
  className = ''
}) {
  // Check if backup is provided
  if (!backup && !loading) {
    return (
      <div className={`backup-card backup-card--empty ${className}`}>
        <div className="backup-card__content">
          <p className="backup-card__empty-text">No backup available</p>
        </div>
      </div>
    );
  }

  // Extract date from filename if created_at is not available
  const getBackupDate = () => {
    if (backup.created_at) {
      return formatDate(backup.created_at);
    }
    
    // Try to extract date from filename (format: backup_YYYYMMDD_HHMMSS.sql)
    const match = backup.filename?.match(/backup_(\d{8})_(\d{6})/);
    if (match) {
      const dateStr = `${match[1].substring(0, 4)}-${match[1].substring(4, 6)}-${match[1].substring(6, 8)}`;
      return dateStr;
    }
    
    return '--';
  };

  // Extract time from filename
  const getBackupTime = () => {
    if (backup.created_at && backup.created_at.includes(' ')) {
      return backup.created_at.split(' ')[1].substring(0, 8);
    }
    
    const match = backup.filename?.match(/backup_(\d{8})_(\d{6})/);
    if (match) {
      return `${match[2].substring(0, 2)}:${match[2].substring(2, 4)}:${match[2].substring(4, 6)}`;
    }
    
    return '--';
  };

  // Get file icon based on type
  const getFileIcon = () => {
    if (loading) return '⏳';
    if (backup.filename?.endsWith('.sql')) return '🗃️';
    if (backup.filename?.endsWith('.csv')) return '📊';
    if (backup.filename?.endsWith('.json')) return '📋';
    return '💾';
  };

  // Handle restore
  const handleRestore = (e) => {
    e.stopPropagation();
    if (onRestore && !loading) {
      onRestore(backup);
    }
  };

  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete && !loading) {
      onDelete(backup);
    }
  };

  // Handle download
  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload && !loading) {
      onDownload(backup);
    }
  };

  return (
    <div 
      className={`backup-card ${className}`}
      role="region"
      aria-label={`Backup file: ${backup?.filename || 'Loading...'}`}
    >
      <div className="backup-card__header">
        <span className="backup-card__icon">
          {getFileIcon()}
        </span>
        <span className="backup-card__type">Backup</span>
      </div>
      
      <div className="backup-card__content">
        <h3 className="backup-card__filename">
          {backup?.filename || 'Loading...'}
        </h3>
        
        <div className="backup-card__details">
          <div className="backup-card__detail">
            <span className="backup-card__detail-label">Date:</span>
            <span className="backup-card__detail-value">{getBackupDate()}</span>
          </div>
          
          <div className="backup-card__detail">
            <span className="backup-card__detail-label">Time:</span>
            <span className="backup-card__detail-value">{getBackupTime()}</span>
          </div>
          
          <div className="backup-card__detail">
            <span className="backup-card__detail-label">Size:</span>
            <span className="backup-card__detail-value">
              {backup?.size ? formatFileSize(backup.size) : '--'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="backup-card__actions">
        <button
          className="backup-card__action-btn backup-card__action-btn--download"
          onClick={handleDownload}
          disabled={loading || !onDownload}
          title="Download backup"
          aria-label="Download backup"
        >
          📥 Download
        </button>
        
        <button
          className="backup-card__action-btn backup-card__action-btn--restore"
          onClick={handleRestore}
          disabled={loading || !onRestore}
          title="Restore backup"
          aria-label="Restore backup"
        >
          🔄 Restore
        </button>
        
        <button
          className="backup-card__action-btn backup-card__action-btn--delete"
          onClick={handleDelete}
          disabled={loading || !onDelete}
          title="Delete backup"
          aria-label="Delete backup"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

BackupCard.propTypes = {
  backup: PropTypes.shape({
    filename: PropTypes.string,
    filepath: PropTypes.string,
    size: PropTypes.number,
    created_at: PropTypes.string
  }),
  loading: PropTypes.bool,
  onRestore: PropTypes.func,
  onDelete: PropTypes.func,
  onDownload: PropTypes.func,
  className: PropTypes.string
};

export default BackupCard;
