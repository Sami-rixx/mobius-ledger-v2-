import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * LunchPaymentTable Component
 * Table component for listing lunch payments
 * 
 * @param {Object} props - Component props
 * @param {Array} props.payments - Array of lunch payment objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {boolean} props.loading - Loading state
 */
function LunchPaymentTable({ payments, onEdit, onDelete, onView, loading = false }) {
  // Calculate days covered for a payment
  const calculateDaysCovered = (payment) => {
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

  // Define table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (payment) => payment.id
    },
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      render: (payment) => (
        <div className="table-cell-student">
          <div className="student-name">{payment.first_name} {payment.last_name}</div>
          <div className="student-admission">{payment.admission_number}</div>
        </div>
      )
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      render: (payment) => payment.class_name || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (payment) => formatCurrency(payment.amount),
      className: 'table-cell-right'
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      sortable: true,
      render: (payment) => formatDate(payment.payment_date)
    },
    {
      key: 'paymentType',
      header: 'Type',
      sortable: true,
      render: (payment) => payment.payment_type ? payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1) : 'N/A'
    },
    {
      key: 'daysCovered',
      header: 'Days',
      sortable: true,
      render: (payment) => calculateDaysCovered(payment),
      className: 'table-cell-right'
    },
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      sortable: true,
      render: (payment) => payment.receipt_number || 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (payment) => (
        <div className="table-cell-actions">
          {onView && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onView(payment)} 
              className="table-action-button"
            >
              View
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onEdit(payment)} 
              className="table-action-button"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              size="small" 
              onClick={() => onDelete(payment)} 
              className="table-action-button"
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={payments}
      keyExtractor={(payment) => payment.id}
      loading={loading}
      emptyMessage="No lunch payments found"
      className="lunch-payment-table"
    />
  );
}

LunchPaymentTable.propTypes = {
  payments: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  loading: PropTypes.bool
};

export default LunchPaymentTable;
