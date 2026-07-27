/**
 * ImportExportCard Component
 * Card component for displaying import/export operation information
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatDate, formatFileSize, formatCurrency } from '../services/importExportService.js';
import './ImportExportCard.scss';

/**
 * ImportExportCard Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.operation - Import/export operation data
 * @param {number} props.operation.id - Operation ID
 * @param {string} props.operation.type - Operation type (export/import/backup/restore)
 * @param {string} props.operation.action - Action type (database_export, csv_export, etc.)
 * @param {string} props.operation.table_name - Table name (optional)
 * @param {string} props.operation.file_name - Filename
 * @param {number} props.operation.record_count - Number of records
 * @param {string} props.operation.status - Status (pending/completed/failed)
 * @param {string} props.operation.created_at - Creation timestamp
 * @param {number} props.operation.size - File size in bytes (optional)
 * @param {boolean} props.loading - Whether to show loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
function ImportExportCard({
  operation,
  loading = false,
  onClick,
  className = ''
}) {
  // Check if operation is provided
  if (!operation && !loading) {
    return (
      <div className={`import-export-card import-export-card--empty ${className}`}>
        <div className="import-export-card__content">
          <p className="import-export-card__empty-text">No operation data available</p>
        </div>
      </div>
    );
  }

  // Determine card color based on status
  const getCardColor = () => {
    if (loading) return 'loading';
    if (operation.status === 'completed') return 'success';
    if (operation.status === 'failed') return 'danger';
    if (operation.status === 'pending') return 'warning';
    return 'primary';
  };

  const cardColor = getCardColor();

  // Get operation icon based on type and action
  const getOperationIcon = () => {
    if (loading) return '⏳';
    
    const typeIcons = {
      export: '↗️',
      import: '↘️',
      backup: '💾',
      restore: '🔄'
    };
    
    const actionIcons = {
      database_export: '🗃️',
      database_import: '📥',
      csv_export: '📤',
      csv_import: '📥',
      backup: '💾',
      restore: '🔄'
    };
    
    return actionIcons[operation.action] || typeIcons[operation.type] || '📦';
  };

  // Get operation label
  const getOperationLabel = () => {
    if (loading) return 'Loading...';
    
    const actionLabels = {
      database_export: 'Database Export',
      database_import: 'Database Import',
      csv_export: 'CSV Export',
      csv_import: 'CSV Import',
      backup: 'Backup',
      restore: 'Restore'
    };
    
    return actionLabels[operation.action] || operation.action || operation.type;
  };

  // Format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '--';
    return formatDate(dateString);
  };

  // Handle click
  const handleClick = (e) => {
    if (onClick && !loading) {
      onClick(e, operation);
    }
  };

  return (
    <div 
      className={`import-export-card import-export-card--${cardColor} ${className}`}
      onClick={handleClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Import/Export operation: ${getOperationLabel()}`}
    >
      <div className="import-export-card__header">
        <span className="import-export-card__icon" aria-label={operation?.type}>
          {getOperationIcon()}
        </span>
        <span className="import-export-card__type">
          {operation?.type ? operation.type.charAt(0).toUpperCase() + operation.type.slice(1) : '--'}
        </span>
        <span className="import-export-card__status">
          {operation?.status ? operation.status.charAt(0).toUpperCase() + operation.status.slice(1) : '--'}
        </span>
      </div>
      
      <div className="import-export-card__content">
        <h3 className="import-export-card__title">
          {getOperationLabel()}
        </h3>
        
        {operation?.table_name && (
          <p className="import-export-card__detail">
            <span className="import-export-card__label">Table:</span>
            <span className="import-export-card__value">{operation.table_name}</span>
          </p>
        )}
        
        {operation?.file_name && (
          <p className="import-export-card__detail">
            <span className="import-export-card__label">File:</span>
            <span className="import-export-card__value import-export-card__value--filename">
              {operation.file_name}
            </span>
          </p>
        )}
        
        {operation?.record_count !== undefined && (
          <p className="import-export-card__detail">
            <span className="import-export-card__label">Records:</span>
            <span className="import-export-card__value">{operation.record_count.toLocaleString()}</span>
          </p>
        )}
        
        {operation?.size !== undefined && (
          <p className="import-export-card__detail">
            <span className="import-export-card__label">Size:</span>
            <span className="import-export-card__value">{formatFileSize(operation.size)}</span>
          </p>
        )}
        
        <p className="import-export-card__detail">
          <span className="import-export-card__label">Date:</span>
          <span className="import-export-card__value">{formatDateDisplay(operation?.created_at)}</span>
        </p>
      </div>
      
      {operation?.error_message && (
        <div className="import-export-card__error">
          <span className="import-export-card__error-icon">⚠️</span>
          <span className="import-export-card__error-text">{operation.error_message}</span>
        </div>
      )}
    </div>
  );
}

ImportExportCard.propTypes = {
  operation: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    action: PropTypes.string,
    table_name: PropTypes.string,
    file_name: PropTypes.string,
    record_count: PropTypes.number,
    status: PropTypes.string,
    created_at: PropTypes.string,
    size: PropTypes.number,
    error_message: PropTypes.string
  }),
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default ImportExportCard;
