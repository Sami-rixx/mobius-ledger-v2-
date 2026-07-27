import React, { useState, useEffect } from 'react';
import { Button, Card, DailyLedgerCard } from '@/components';
import { getDailyLedgerById, deleteDailyLedger } from '@/services';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * DailyLedgerDetailPage Component
 * Page for viewing daily ledger record details
 */
function DailyLedgerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load ledger data
  useEffect(() => {
    const loadLedger = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);

      try {
        const result = await getDailyLedgerById(parseInt(id));
        if (result && result.data) {
          setLedger(result.data);
        } else {
          setError('Failed to load daily ledger data');
        }
      } catch (err) {
        setError(err.message || 'Failed to load daily ledger data');
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!id || !window.confirm(`Are you sure you want to delete this daily ledger record?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDailyLedger(parseInt(id));
      navigate('/daily-ledgers');
    } catch (err) {
      setError(err.message || 'Failed to delete daily ledger record');
    } finally {
      setDeleting(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/daily-ledgers/edit/${id}`);
  };

  // Handle back
  const handleBack = () => {
    navigate('/daily-ledgers');
  };

  if (loading && !ledger) {
    return (
      <div className="daily-ledger-detail-page">
        <div className="page-header">
          <h1>Daily Ledger Details</h1>
        </div>
        <p>Loading daily ledger data...</p>
      </div>
    );
  }

  if (error && !ledger) {
    return (
      <div className="daily-ledger-detail-page">
        <div className="page-header">
          <h1>Daily Ledger Details</h1>
        </div>
        <div className="alert alert-error">
          {error}
        </div>
        <Button variant="secondary" onClick={handleBack}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="daily-ledger-detail-page">
      <div className="page-header">
        <h1>Daily Ledger Details</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="detail-actions">
        <Button variant="secondary" onClick={handleBack} disabled={deleting}>
          <i className="fa fa-arrow-left" aria-hidden="true" />
          Back to List
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={deleting}>
          <i className="fa fa-edit" aria-hidden="true" />
          Edit
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={deleting}>
          <i className="fa fa-trash" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <Card>
        <div className="detail-content">
          {ledger ? (
            <DailyLedgerCard ledger={ledger} />
          ) : (
            <p>No ledger data available</p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default DailyLedgerDetailPage;
