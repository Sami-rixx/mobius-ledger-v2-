import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Spinner } from '@/components';
import { getImportExportLogById, getImportExportStatistics } from '@/services';
import { formatDate, formatFileSize } from '@/services/importExportService';
import { useNavigate, useParams } from 'react-router-dom';
import './ImportExportDetailPage.scss';

/**
 * ImportExportDetailPage Component
 * Displays detailed information about a specific import/export operation
 */
function ImportExportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load operation details
  const loadOperation = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await getImportExportLogById(parseInt(id, 10));
      setOperation(result.data.data);
    } catch (err) {
      console.error('Error loading operation details:', err);
      setError(err.message || 'Failed to load operation details');
      setOperation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadOperation();
  }, [loadOperation]);

  // Navigate back to list
  const navigateToList = () => {
    navigate('/import-export');
  };

  // Refresh data
  const handleRefresh = () => {
    loadOperation();
  };

  // Get status color
  const getStatusColor = () => {
    if (!operation) return 'primary';
    switch (operation.status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'primary';
    }
  };

  // Get action label
  const getActionLabel = () => {
    if (!operation) return '--';
    
    const actionLabels = {
      database_export: 'Database Export',
      database_import: 'Database Import',
      csv_export: 'CSV Export',
      csv_import: 'CSV Import',
      backup: 'Backup',
      restore: 'Restore'
    };
    
    return actionLabels[operation.action] || operation.action;
  };

  // Get operation icon
  const getOperationIcon = () => {
    if (!operation) return '📦';
    
    const actionIcons = {
      database_export: '🗃️',
      database_import: '📥',
      csv_export: '📤',
      csv_import: '📥',
      backup: '💾',
      restore: '🔄'
    };
    
    return actionIcons[operation.action] || '📦';
  };

  // Render loading state
  if (loading && !operation) {
    return (
      <div className="import-export-detail-page">
        <div className="loading-state">
          <Spinner size="large" />
          <p>Loading operation details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !operation) {
    return (
      <div className="import-export-detail-page">
        <div className="page-error">
          <h2>Error Loading Operation</h2>
          <p className="page-error-message">{error}</p>
          <Button variant="primary" onClick={navigateToList}>
            Back to Operations
          </Button>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!operation) {
    return (
      <div className="import-export-detail-page">
        <div className="page-error">
          <h2>Operation Not Found</h2>
          <p className="page-error-message">The requested operation could not be found.</p>
          <Button variant="primary" onClick={navigateToList}>
            Back to Operations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="import-export-detail-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Operation Details</h1>
          <p className="page-subtitle">Detailed information for operation #{operation.id}</p>
        </div>
        <div className="page-header-right">
          <Button variant="secondary" onClick={navigateToList} disabled={loading}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Operation Card */}
      <Card className="operation-detail-card">
        <div className="operation-detail-card__header">
          <span className="operation-detail-card__icon">
            {getOperationIcon()}
          </span>
          <div className="operation-detail-card__header-info">
            <h2 className="operation-detail-card__title">{getActionLabel()}</h2>
            <span className={`operation-detail-card__status operation-detail-card__status--${getStatusColor()}`}>
              {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="operation-detail-card__content">
          {/* Basic Information */}
          <section className="detail-section">
            <h3 className="detail-section__title">Basic Information</h3>
            <div className="detail-section__grid">
              <div className="detail-item">
                <span className="detail-item__label">Operation ID</span>
                <span className="detail-item__value">#{operation.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Type</span>
                <span className="detail-item__value">{operation.type || '--'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Action</span>
                <span className="detail-item__value">{operation.action || '--'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Status</span>
                <span className={`detail-item__value detail-item__value--${getStatusColor()}`}>
                  {operation.status || '--'}
                </span>
              </div>
            </div>
          </section>

          {/* File Information */}
          {operation.file_name && (
            <section className="detail-section">
              <h3 className="detail-section__title">File Information</h3>
              <div className="detail-section__grid">
                <div className="detail-item detail-item--full">
                  <span className="detail-item__label">Filename</span>
                  <span className="detail-item__value detail-item__value--filename">
                    {operation.file_name}
                  </span>
                </div>
                {operation.table_name && (
                  <div className="detail-item">
                    <span className="detail-item__label">Table</span>
                    <span className="detail-item__value">{operation.table_name}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-item__label">Record Count</span>
                  <span className="detail-item__value">{operation.record_count || 0}</span>
                </div>
                {operation.size && (
                  <div className="detail-item">
                    <span className="detail-item__label">File Size</span>
                    <span className="detail-item__value">{formatFileSize(operation.size)}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Timestamps */}
          <section className="detail-section">
            <h3 className="detail-section__title">Timestamps</h3>
            <div className="detail-section__grid">
              <div className="detail-item">
                <span className="detail-item__label">Created</span>
                <span className="detail-item__value">{formatDate(operation.created_at)}</span>
              </div>
              {operation.updated_at && operation.updated_at !== operation.created_at && (
                <div className="detail-item">
                  <span className="detail-item__label">Updated</span>
                  <span className="detail-item__value">{formatDate(operation.updated_at)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Error Information */}
          {operation.error_message && (
            <section className="detail-section detail-section--error">
              <h3 className="detail-section__title">Error Information</h3>
              <div className="error-message">
                <pre>{operation.error_message}</pre>
              </div>
            </section>
          )}

          {/* User Information */}
          {operation.user_id && (
            <section className="detail-section">
              <h3 className="detail-section__title">User Information</h3>
              <div className="detail-section__grid">
                <div className="detail-item">
                  <span className="detail-item__label">User ID</span>
                  <span className="detail-item__value">#{operation.user_id}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="operation-detail-card__actions">
          <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ImportExportDetailPage;
