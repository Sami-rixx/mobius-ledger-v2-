import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, DailyLedgerList } from '@/components';
import { getDailyLedgers, deleteDailyLedger } from '@/services';
import { useNavigate } from 'react-router-dom';

/**
 * DailyLedgerListPage Component
 * Displays a paginated list of daily ledger records with filtering and statistics
 */
function DailyLedgerListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load daily ledgers
  const loadDailyLedgers = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDailyLedgers({ page, pageSize });
      // DailyLedgerList handles its own state, so we just need to trigger a refresh
      // The component will call this function when it needs data
      return result;
    } catch (err) {
      setError(err.message || 'Failed to load daily ledger data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle create
  const navigateToCreate = () => {
    navigate('/daily-ledgers/create');
  };

  // Handle view detail
  const navigateToDetail = (id) => {
    navigate(`/daily-ledgers/${id}`);
  };

  // Handle edit
  const navigateToEdit = (id) => {
    navigate(`/daily-ledgers/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this daily ledger record?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDailyLedger(id);
      // Refresh the list
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to delete daily ledger record');
    } finally {
      setDeleting(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="daily-ledger-list-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Daily Ledger</h1>
          <p className="page-subtitle">Track daily financial movements and balances</p>
        </div>
        <div className="page-header-right">
          <Button variant="primary" onClick={navigateToCreate} disabled={loading || deleting}>
            <i className="fa fa-plus" aria-hidden="true" />
            Create Entry
          </Button>
          <Button variant="secondary" onClick={handleRefresh} disabled={loading || deleting}>
            <i className="fa fa-sync-alt" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <Card>
        <DailyLedgerList
          onCreate={navigateToCreate}
          onView={navigateToDetail}
          onEdit={navigateToEdit}
          onDelete={handleDelete}
          showFilter={true}
          limit={10}
        />
      </Card>
    </div>
  );
}

export default DailyLedgerListPage;
