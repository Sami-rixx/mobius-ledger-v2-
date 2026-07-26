import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, DirectorWithdrawalCard } from '../../components/index.js';
import {
  getWithdrawalById,
  deleteWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  cancelWithdrawal,
  WITHDRAWAL_STATUS
} from '../../services/index.js';

/**
 * WithdrawalDetailPage Component
 * Page for viewing a single director withdrawal with all details
 */
function WithdrawalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [withdrawal, setWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load withdrawal data
  useEffect(() => {
    const loadWithdrawal = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getWithdrawalById(id);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to load withdrawal');
        }
      } catch (err) {
        setError(err.message || 'Failed to load withdrawal');
      } finally {
        setLoading(false);
      }
    };

    loadWithdrawal();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete withdrawal #${withdrawal?.id} for ${withdrawal?.purpose}?`)) {
      setActionLoading(true);
      setError(null);

      try {
        await deleteWithdrawal(withdrawal.id);
        navigate('/withdrawals');
      } catch (err) {
        setError(err.message || 'Failed to delete withdrawal');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle approve
  const handleApprove = async () => {
    const notes = window.prompt('Enter approval notes (optional):', '');
    if (notes !== null) {
      setActionLoading(true);
      setError(null);

      try {
        const result = await approveWithdrawal(withdrawal.id, notes || undefined);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to approve withdrawal');
        }
      } catch (err) {
        setError(err.message || 'Failed to approve withdrawal');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle reject
  const handleReject = async () => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason && reason.trim() !== '') {
      setActionLoading(true);
      setError(null);

      try {
        const result = await rejectWithdrawal(withdrawal.id, reason);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to reject withdrawal');
        }
      } catch (err) {
        setError(err.message || 'Failed to reject withdrawal');
      } finally {
        setActionLoading(false);
      }
    } else {
      alert('Rejection reason is required');
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (window.confirm(`Are you sure you want to mark withdrawal #${withdrawal?.id} as completed?`)) {
      setActionLoading(true);
      setError(null);

      try {
        const result = await completeWithdrawal(withdrawal.id);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to complete withdrawal');
        }
      } catch (err) {
        setError(err.message || 'Failed to complete withdrawal');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    const reason = window.prompt('Enter reason for cancellation (optional):', '');
    if (reason !== null) {
      setActionLoading(true);
      setError(null);

      try {
        const result = await cancelWithdrawal(withdrawal.id, reason || undefined);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to cancel withdrawal');
        }
      } catch (err) {
        setError(err.message || 'Failed to cancel withdrawal');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Check withdrawal status
  const isPending = withdrawal?.status === WITHDRAWAL_STATUS.PENDING || withdrawal?.is_pending;
  const isApproved = withdrawal?.status === WITHDRAWAL_STATUS.APPROVED || withdrawal?.is_approved;
  const isCompleted = withdrawal?.status === WITHDRAWAL_STATUS.COMPLETED || withdrawal?.is_completed;
  const canModify = !isCompleted;

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="page withdrawal-detail-page">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  if (error && !withdrawal) {
    return (
      <div className="page withdrawal-detail-page">
        <Card>
          <div className="alert alert-danger">
            {error}
            <Button
              variant="primary"
              onClick={() => navigate('/withdrawals')}
              className="ms-3"
            >
              Back to Withdrawals
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page withdrawal-detail-page">
      <div className="page-header">
        <h1>Director Withdrawal #{withdrawal?.id}</h1>
        <p className="text-muted">{withdrawal?.purpose}</p>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-3">
          <div className="alert alert-danger">
            {error}
            <button type="button" className="btn-close float-end" onClick={() => setError(null)} />
          </div>
        </Card>
      )}

      {/* Withdrawal Card */}
      <DirectorWithdrawalCard
        withdrawal={withdrawal}
        showActions={false}
      />

      {/* Additional Details Section */}
      <Card className="mt-3">
        <h5>Additional Details</h5>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">{formatCurrency(withdrawal?.amount)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Withdrawal Date:</span>
            <span className="detail-value">{formatDate(withdrawal?.withdrawal_date)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(withdrawal?.created_at)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Last Updated:</span>
            <span className="detail-value">{formatDate(withdrawal?.updated_at)}</span>
          </div>
          
          {withdrawal?.payment_method_name && (
            <div className="detail-item">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{withdrawal.payment_method_name}</span>
            </div>
          )}
          
          {withdrawal?.created_by_username && (
            <div className="detail-item">
              <span className="detail-label">Created By:</span>
              <span className="detail-value">{withdrawal.created_by_username}</span>
            </div>
          )}
          
          {withdrawal?.approved_by_username && (
            <div className="detail-item">
              <span className="detail-label">Approved By:</span>
              <span className="detail-value">{withdrawal.approved_by_username}</span>
            </div>
          )}
          
          {withdrawal?.approved_at && (
            <div className="detail-item">
              <span className="detail-label">Approved At:</span>
              <span className="detail-value">{formatDate(withdrawal.approved_at)}</span>
            </div>
          )}
          
          {withdrawal?.rejected_by_username && (
            <div className="detail-item">
              <span className="detail-label">Rejected By:</span>
              <span className="detail-value">{withdrawal.rejected_by_username}</span>
            </div>
          )}
          
          {withdrawal?.rejected_at && (
            <div className="detail-item">
              <span className="detail-label">Rejected At:</span>
              <span className="detail-value">{formatDate(withdrawal.rejected_at)}</span>
            </div>
          )}
        </div>

        {withdrawal?.description && (
          <div className="detail-section mt-3">
            <h6>Description</h6>
            <p>{withdrawal.description}</p>
          </div>
        )}

        {withdrawal?.notes && (
          <div className="detail-section mt-3">
            <h6>Notes</h6>
            <p>{withdrawal.notes}</p>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <Card className="mt-3">
        <h5>Actions</h5>
        <div className="action-buttons">
          <Button
            variant="secondary"
            onClick={() => navigate('/withdrawals')}
            className="me-2"
          >
            <i className="bi bi-arrow-left me-1" />
            Back to List
          </Button>

          {canModify && (
            <Button
              variant="primary"
              onClick={() => navigate(`/withdrawals/edit/${withdrawal.id}`)}
              className="me-2"
            >
              <i className="bi bi-pencil me-1" />
              Edit
            </Button>
          )}

          {isPending && (
            <>
              <Button
                variant="success"
                onClick={handleApprove}
                disabled={actionLoading}
                className="me-2"
              >
                <i className="bi bi-check-circle me-1" />
                Approve
              </Button>

              <Button
                variant="danger"
                onClick={handleReject}
                disabled={actionLoading}
                className="me-2"
              >
                <i className="bi bi-x-circle me-1" />
                Reject
              </Button>

              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={actionLoading}
                className="me-2"
              >
                <i className="bi bi-trash me-1" />
                Delete
              </Button>
            </>
          )}

          {isApproved && (
            <Button
              variant="success"
              onClick={handleComplete}
              disabled={actionLoading}
              className="me-2"
            >
              <i className="bi bi-check2-square me-1" />
              Mark as Complete
            </Button>
          )}

          {canModify && !isPending && (
            <Button
              variant="warning"
              onClick={handleCancel}
              disabled={actionLoading}
              className="me-2"
            >
              <i className="bi bi-ban me-1" />
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default WithdrawalDetailPage;
