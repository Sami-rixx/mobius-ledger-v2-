import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * SchoolFeeCard Component
 * Displays school fee payment information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.payment - School fee payment data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function SchoolFeeCard({ payment, showActions = true, onEdit, onDelete, onView }) {
  if (!payment) {
    return null;
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get payment method name
  const getPaymentMethodName = (id) => {
    const methods = {
      1: 'Cash',
      2: 'M-Pesa',
      3: 'Bank Transfer',
      4: 'Cheque',
      5: 'Other'
    };
    return methods[id] || `Method ${id}` || 'N/A';
  };

  // Get status badge variant
  const getStatusVariant = (status) => {
    if (!status) return 'info';
    return 'success';
  };

  return (
    <Card
      title={`Payment #${payment.id || 'N/A'}`}
      subtitle={`${formatDate(payment.payment_date)} | ${payment.academic_year || 'N/A'} ${payment.term || 'N/A'}`}
      className="school-fee-card"
    >
      <div className="school-fee-info">
        {/* Student Information */}
        <div className="info-section">
          <h4>Student</h4>
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{payment.student_name || payment.student?.last_name + ', ' + payment.student?.first_name || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Admission #:</span>
            <span className="detail-value">{payment.admission_number || payment.student?.admission_number || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Class:</span>
            <span className="detail-value">{payment.class_name || payment.student?.class_name || 'N/A'}</span>
          </div>
        </div>

        {/* Payment Information */}
        <div className="info-section">
          <h4>Payment Details</h4>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value amount">{formatCurrency(payment.amount)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Method:</span>
            <span className="detail-value">{getPaymentMethodName(payment.payment_method_id || payment.paymentMethodId)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Receipt #:</span>
            <span className="detail-value">{payment.receipt_number || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Transaction ID:</span>
            <span className="detail-value">{payment.transaction_id || payment.transactionId || 'N/A'}</span>
          </div>
        </div>

        {/* Additional Information */}
        {payment.description && (
          <div className="info-section">
            <h4>Description</h4>
            <div className="detail-row">
              <span className="detail-value">{payment.description}</span>
            </div>
          </div>
        )}

        {payment.notes && (
          <div className="info-section">
            <h4>Notes</h4>
            <div className="detail-row">
              <span className="detail-value">{payment.notes}</span>
            </div>
          </div>
        )}

        {/* Created/Updated Information */}
        <div className="info-section metadata">
          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(payment.created_at || payment.createdAt)}</span>
          </div>
          {payment.updated_at && (
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{formatDate(payment.updated_at || payment.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="card-actions">
          {onView && (
            <Button variant="info" size="sm" onClick={() => onView(payment)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="primary" size="sm" onClick={() => onEdit(payment)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(payment)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

SchoolFeeCard.propTypes = {
  payment: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default SchoolFeeCard;
