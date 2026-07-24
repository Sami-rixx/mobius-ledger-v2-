import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * LunchPaymentCard Component
 * Card component for displaying lunch payment information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.payment - Lunch payment data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.compact - Compact display mode
 */
function LunchPaymentCard({ payment, onEdit, onDelete, compact = false }) {
  if (!payment) {
    return <Card title="No Payment Data" className="payment-card">
      <p>No lunch payment information available</p>
    </Card>;
  }

  // Calculate days covered
  const calculateDaysCovered = () => {
    if (payment.payment_type === 'daily') {
      return 1;
    }
    
    if (payment.start_date && payment.end_date) {
      const start = new Date(payment.start_date);
      const end = new Date(payment.end_date);
      const timeDiff = end.getTime() - start.getTime();
      const dayDiff = timeDiff / (1000 * 3600 * 24);
      
      // Count weekdays only
      let weekdayCount = 0;
      for (let i = 0; i <= dayDiff; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
          weekdayCount++;
        }
      }
      return weekdayCount;
    }
    
    return 0;
  };

  const daysCovered = calculateDaysCovered();

  return (
    <Card 
      title={`Lunch Payment #${payment.id || 'N/A'}`} 
      className={`payment-card ${compact ? 'payment-card-compact' : ''}`}
    >
      <div className="payment-card-content">
        {/* Student Information */}
        <div className="payment-info-section">
          <h4>Student Information</h4>
          <div className="payment-info-grid">
            <div className="payment-info-item">
              <span className="payment-info-label">Name:</span>
              <span className="payment-info-value">
                {payment.first_name} {payment.last_name}
              </span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Admission #:</span>
              <span className="payment-info-value">{payment.admission_number}</span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Class:</span>
              <span className="payment-info-value">{payment.class_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="payment-info-section">
          <h4>Payment Information</h4>
          <div className="payment-info-grid">
            <div className="payment-info-item">
              <span className="payment-info-label">Amount:</span>
              <span className="payment-info-value payment-amount">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Payment Date:</span>
              <span className="payment-info-value">{formatDate(payment.payment_date)}</span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Payment Type:</span>
              <span className="payment-info-value">
                {payment.payment_type ? payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1) : 'N/A'}
              </span>
            </div>
            <div className="payment-info-item">
              <span className="payment-info-label">Days Covered:</span>
              <span className="payment-info-value">{daysCovered} days</span>
            </div>
          </div>
        </div>

        {/* Period Information (for weekly/monthly) */}
        {(payment.payment_type === 'weekly' || payment.payment_type === 'monthly') && (
          <div className="payment-info-section">
            <h4>Period Information</h4>
            <div className="payment-info-grid">
              <div className="payment-info-item">
                <span className="payment-info-label">Start Date:</span>
                <span className="payment-info-value">{formatDate(payment.start_date)}</span>
              </div>
              <div className="payment-info-item">
                <span className="payment-info-label">End Date:</span>
                <span className="payment-info-value">{formatDate(payment.end_date)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Information */}
        {payment.receipt_number && (
          <div className="payment-info-section">
            <h4>Receipt Information</h4>
            <div className="payment-info-grid">
              <div className="payment-info-item">
                <span className="payment-info-label">Receipt #:</span>
                <span className="payment-info-value receipt-number">{payment.receipt_number}</span>
              </div>
              <div className="payment-info-item">
                <span className="payment-info-label">Payment Method:</span>
                <span className="payment-info-value">{payment.payment_method || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {payment.notes && (
          <div className="payment-info-section">
            <h4>Notes</h4>
            <p className="payment-notes">{payment.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!compact && (onEdit || onDelete) && (
          <div className="payment-card-actions">
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(payment)} 
                className="payment-action-button"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="danger" 
                onClick={() => onDelete(payment)} 
                className="payment-action-button"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

LunchPaymentCard.propTypes = {
  payment: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  compact: PropTypes.bool
};

export default LunchPaymentCard;
