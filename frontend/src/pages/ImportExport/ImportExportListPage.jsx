import React, { useState, useCallback } from 'react';
import { Button, Card, ImportExportList } from '../../../components/index.js';
import { getImportExportLogs, getImportExportStatistics, createBackup, exportDatabase } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';
import './ImportExportListPage.scss';

/**
 * ImportExportListPage Component
 * Displays a paginated list of import/export operations with filtering and statistics
 */
function ImportExportListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const result = await getImportExportStatistics();
      setStatistics(result.data.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError(err.message || 'Failed to load statistics');
    }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await loadStatistics();
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadStatistics]);

  // Initial load
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle create backup
  const handleCreateBackup = async () => {
    if (!window.confirm('Create a new database backup? This may take a moment.')) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await createBackup({});
      window.alert(`Backup created successfully: ${result.data.data?.filename || result.data.message}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create backup');
      window.alert(`Error creating backup: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle export database
  const handleExportDatabase = async () => {
    if (!window.confirm('Export the entire database? This may take a moment.')) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await exportDatabase({});
      window.alert(`Database exported successfully: ${result.data.data?.filename || result.data.message}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to export database');
      window.alert(`Error exporting database: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Navigate to backups
  const navigateToBackups = () => {
    navigate('/import-export/backups');
  };

  // Navigate to detail
  const navigateToDetail = (operation) => {
    if (operation?.id) {
      navigate(`/import-export/logs/${operation.id}`);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="import-export-list-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Import/Export Operations</h1>
          <p className="page-subtitle">Track data import and export operations, backups, and restores</p>
        </div>
        <div className="page-header-right">
          <Button variant="secondary" onClick={navigateToBackups} disabled={loading || actionLoading}>
            Manage Backups
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="import-export-quick-actions">
        <div className="import-export-quick-actions__header">
          <h2>Quick Actions</h2>
        </div>
        <div className="import-export-quick-actions__buttons">
          <Button 
            variant="success" 
            onClick={handleCreateBackup} 
            disabled={loading || actionLoading}
          >
            Create Backup
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExportDatabase} 
            disabled={loading || actionLoading}
          >
            Export Database
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="import-export-statistics">
          <Card className="import-export-stat-card">
            <h3>Operations Summary</h3>
            <div className="import-export-stat-grid">
              <div className="import-export-stat-item">
                <span className="import-export-stat-label">Total Operations</span>
                <span className="import-export-stat-value">{statistics.total || 0}</span>
              </div>
              <div className="import-export-stat-item">
                <span className="import-export-stat-label">Completed</span>
                <span className="import-export-stat-value import-export-stat-value--success">
                  {statistics.byStatus?.completed || 0}
                </span>
              </div>
              <div className="import-export-stat-item">
                <span className="import-export-stat-label">Pending</span>
                <span className="import-export-stat-value import-export-stat-value--warning">
                  {statistics.byStatus?.pending || 0}
                </span>
              </div>
              <div className="import-export-stat-item">
                <span className="import-export-stat-label">Failed</span>
                <span className="import-export-stat-value import-export-stat-value--danger">
                  {statistics.byStatus?.failed || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="page-error">
          <p className="page-error-message">{error}</p>
        </div>
      )}

      {/* Operations List */}
      <div className="import-export-list-container">
        <ImportExportList
          onItemClick={navigateToDetail}
          onRefresh={handleRefresh}
          limit={10}
        />
      </div>
    </div>
  );
}

export default ImportExportListPage;
