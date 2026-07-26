import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, DirectorWithdrawalTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import {
  getWithdrawals,
  deleteWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  cancelWithdrawal,
  WITHDRAWAL_STATUS
} from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * WithdrawalListPage Component
 * Displays a paginated list of director withdrawals with search and filter capabilities
 */
function WithdrawalListPage() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [labelFilter, setLabelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load withdrawals
  const loadWithdrawals = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        label: labelFilter || undefined,
        status: statusFilter || undefined,
        recipientName: recipientFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const result = await getWithdrawals(params);
      setWithdrawals(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, [labelFilter, statusFilter, recipientFilter, startDate, endDate]);

  // Initial load
  useEffect(() => {
    loadWithdrawals(1);
  }, [loadWithdrawals]);

  // Handle page change
  const handlePageChange = (page) => {
    loadWithdrawals(page);
  };

  // Handle filter change
  const handleLabelChange = (e) => {
    setLabelFilter(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRecipientChange = (e) => {
    setRecipientFilter(e.target.value);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  // Handle apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadWithdrawals(1);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setLabelFilter('');
    setStatusFilter('');
    setRecipientFilter('');
    setStartDate('');
    setEndDate('');
    loadWithdrawals(1);
  };

  // Handle delete
  const handleDelete = async (withdrawal) => {
    if (window.confirm(`Are you sure you want to delete withdrawal #${withdrawal.id} for ${withdrawal.purpose}?`)) {
      try {
        await deleteWithdrawal(withdrawal.id);
        // Refresh the list
        loadWithdrawals(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete withdrawal');
      }
    }
  };

  // Handle approve
  const handleApprove = async (withdrawal) => {
    const notes = window.prompt('Enter approval notes (optional):', '');
    if (notes !== null) {
      try {
        await approveWithdrawal(withdrawal.id, notes || undefined);
        // Refresh the list
        loadWithdrawals(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to approve withdrawal');
      }
    }
  };

  // Handle reject
  const handleReject = async (withdrawal) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason && reason.trim() !== '') {
      try {
        await rejectWithdrawal(withdrawal.id, reason);
        // Refresh the list
        loadWithdrawals(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to reject withdrawal');
      }
    } else {
      alert('Rejection reason is required');
    }
  };

  // Handle complete
  const handleComplete = async (withdrawal) => {
    if (window.confirm(`Are you sure you want to mark withdrawal #${withdrawal.id} as completed?`)) {
      try {
        await completeWithdrawal(withdrawal.id);
        // Refresh the list
        loadWithdrawals(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to complete withdrawal');
      }
    }
  };

  // Handle cancel
  const handleCancel = async (withdrawal) => {
    const reason = window.prompt('Enter reason for cancellation (optional):', '');
    if (reason !== null) {
      try {
        await cancelWithdrawal(withdrawal.id, reason || undefined);
        // Refresh the list
        loadWithdrawals(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to cancel withdrawal');
      }
    }
  };

  // Handle view
  const handleView = (withdrawal) => {
    navigate(`/withdrawals/${withdrawal.id}`);
  };

  // Handle edit
  const handleEdit = (withdrawal) => {
    navigate(`/withdrawals/edit/${withdrawal.id}`);
  };

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: WITHDRAWAL_STATUS.PENDING, label: 'Pending' },
    { value: WITHDRAWAL_STATUS.APPROVED, label: 'Approved' },
    { value: WITHDRAWAL_STATUS.REJECTED, label: 'Rejected' },
    { value: WITHDRAWAL_STATUS.COMPLETED, label: 'Completed' },
    { value: WITHDRAWAL_STATUS.CANCELLED, label: 'Cancelled' }
  ];

  return (
    <div className="page withdrawal-list-page">
      <div className="page-header">
        <h1>Director Withdrawals</h1>
        <p className="text-muted">Manage director/management withdrawals with approval workflow</p>
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

      {/* Filters */}
      <Card className="mb-3">
        <h5>Filters</h5>
        <form onSubmit={handleApplyFilters}>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Label</label>
              <input
                type="text"
                value={labelFilter}
                onChange={handleLabelChange}
                placeholder="Filter by label"
                className="form-control"
              />
            </div>
            
            <div className="filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="form-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Recipient</label>
              <input
                type="text"
                value={recipientFilter}
                onChange={handleRecipientChange}
                placeholder="Filter by recipient"
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={startDate}
                onChange={handleDateChange}
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={endDate}
                onChange={handleDateChange}
                className="form-control"
              />
            </div>

            <div className="filter-actions">
              <Button type="submit" variant="primary" className="me-2">
                Apply Filters
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Actions */}
      <div className="page-actions mb-3">
        <Button
          variant="primary"
          onClick={() => navigate('/withdrawals/create')}
        >
          <i className="bi bi-plus-circle me-2" />
          Create New Withdrawal
        </Button>
      </div>

      {/* Withdrawals Table */}
      <DirectorWithdrawalTable
        withdrawals={withdrawals}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        onComplete={handleComplete}
        onCancel={handleCancel}
        showActions={true}
      />

      {/* Pagination */}
      {pagination && (
        <Card className="mt-3">
          <div className="pagination-info">
            <span>
              Showing {withdrawals.length} of {pagination.total} withdrawals
              {pagination.page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="ms-2"
                >
                  Previous
                </Button>
              )}
              {pagination.hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="ms-2"
                >
                  Next
                </Button>
              )}
            </span>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center mt-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading withdrawals...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && withdrawals.length === 0 && (
        <Card className="mt-3">
          <div className="text-center text-muted py-4">
            <i className="bi bi-inbox display-4" />
            <p className="mt-2">No withdrawals found</p>
            <Button
              variant="primary"
              onClick={() => navigate('/withdrawals/create')}
            >
              Create Your First Withdrawal
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default WithdrawalListPage;
