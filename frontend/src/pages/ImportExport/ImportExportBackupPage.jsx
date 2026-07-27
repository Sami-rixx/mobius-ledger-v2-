import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, BackupCard, Spinner } from '@/components';
import { listBackups, listExports, createBackup, deleteBackup, createTimestampedBackup, downloadFile, restoreBackup } from '@/services';
import { useNavigate } from 'react-router-dom';
import './ImportExportBackupPage.scss';

/**
 * ImportExportBackupPage Component
 * Displays a list of backup and export files with management actions
 */
function ImportExportBackupPage() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load backups and exports in parallel
      const [backupsResponse, exportsResponse] = await Promise.all([
        listBackups(),
        listExports()
      ]);
      
      setBackups(backupsResponse.data.data || []);
      setExports(exportsResponse.data.data || []);
    } catch (err) {
      console.error('Error loading backup data:', err);
      setError(err.message || 'Failed to load backup data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle create backup
  const handleCreateBackup = async () => {
    if (!window.confirm('Create a new database backup? This may take a moment.')) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await createTimestampedBackup();
      window.alert(`Backup created successfully: ${result.data.data?.filename || result.data.message}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create backup');
      window.alert(`Error creating backup: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete backup
  const handleDeleteBackup = async (backup) => {
    if (!window.confirm(`Are you sure you want to delete backup: ${backup.filename}? This cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteBackup(backup.filename);
      window.alert(`Backup deleted successfully: ${backup.filename}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete backup');
      window.alert(`Error deleting backup: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle restore backup
  const handleRestoreBackup = async (backup) => {
    if (!window.confirm(`Are you sure you want to restore backup: ${backup.filename}? This will replace all current data.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await restoreBackup({ filename: backup.filename });
      window.alert(`Backup restored successfully: ${result.data.message || 'Restoration complete'}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to restore backup');
      window.alert(`Error restoring backup: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download backup
  const handleDownloadBackup = async (backup) => {
    try {
      await downloadFile(`/api/import-export/backups/${backup.filename}`, backup.filename);
    } catch (err) {
      window.alert(`Error downloading backup: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle download export
  const handleDownloadExport = async (exportFile) => {
    try {
      await downloadFile(`/api/import-export/exports/${exportFile.filename}`, exportFile.filename);
    } catch (err) {
      window.alert(`Error downloading export: ${err.message || 'Unknown error'}`);
    }
  };

  // Navigate back to list
  const navigateToList = () => {
    navigate('/import-export');
  };

  // Refresh data
  const handleRefresh = () => {
    loadData();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="import-export-backup-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Backup & Export Management</h1>
          <p className="page-subtitle">Manage database backups and exported files</p>
        </div>
        <div className="page-header-right">
          <Button variant="secondary" onClick={navigateToList} disabled={loading || actionLoading}>
            Back to Operations
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="import-export-quick-actions">
        <div className="import-export-quick-actions__header">
          <h2>Backup Actions</h2>
        </div>
        <div className="import-export-quick-actions__buttons">
          <Button 
            variant="success" 
            onClick={handleCreateBackup} 
            disabled={loading || actionLoading}
          >
            {actionLoading ? <><Spinner size="small" /> Creating...</> : 'Create Backup'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRefresh} 
            disabled={loading || actionLoading}
          >
            Refresh List
          </Button>
        </div>
      </Card>

      {/* Error message */}
      {error && (
        <div className="page-error">
          <p className="page-error-message">{error}</p>
        </div>
      )}

      {/* Backups Section */}
      <section className="import-export-section">
        <h2>Database Backups</h2>
        <p className="section-description">
          {backups.length} backup(s) available. Backups contain complete database snapshots.
        </p>

        {loading ? (
          <div className="loading-state">
            <Spinner size="large" />
            <p>Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <Card className="empty-state">
            <p>No backups found. Create your first backup to get started.</p>
          </Card>
        ) : (
          <div className="backup-list">
            {backups.map((backup) => (
              <BackupCard
                key={backup.filename}
                backup={{
                  ...backup,
                  // Ensure size is available
                  size: backup.size || 0
                }}
                onRestore={handleRestoreBackup}
                onDelete={() => handleDeleteBackup(backup)}
                onDownload={handleDownloadBackup}
              />
            ))}
          </div>
        )}
      </section>

      {/* Exports Section */}
      <section className="import-export-section">
        <h2>Exported Files</h2>
        <p className="section-description">
          {exports.length} exported file(s) available. These are data exports in various formats.
        </p>

        {loading ? null : exports.length === 0 ? (
          <Card className="empty-state">
            <p>No exported files found. Export data to create files.</p>
          </Card>
        ) : (
          <div className="export-list">
            {exports.map((exportFile) => (
              <Card key={exportFile.filename} className="export-card">
                <div className="export-card__header">
                  <span className="export-card__icon">📊</span>
                  <span className="export-card__type">Exported File</span>
                </div>
                <div className="export-card__content">
                  <h3 className="export-card__filename">{exportFile.filename}</h3>
                  <div className="export-card__details">
                    <div className="export-card__detail">
                      <span className="export-card__detail-label">Size:</span>
                      <span className="export-card__detail-value">
                        {formatFileSize(exportFile.size || 0)}
                      </span>
                    </div>
                    <div className="export-card__detail">
                      <span className="export-card__detail-label">Created:</span>
                      <span className="export-card__detail-value">
                        {exportFile.created_at ? new Date(exportFile.created_at).toLocaleDateString() : '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="export-card__actions">
                  <button
                    className="export-card__action-btn export-card__action-btn--download"
                    onClick={() => handleDownloadExport(exportFile)}
                    title="Download export"
                  >
                    📥 Download
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ImportExportBackupPage;
