import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * SchoolFeeTable Component
 * Displays a list of school fee payments in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.payments - Array of school fee payment objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function SchoolFeeTable({
  payments,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
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

  // Table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (row) => row.id || 'N/A'
    },
    {
      key: 'paymentDate',
      header: 'Date',
      width: '100px',
      render: (row) => formatDate(row.payment_date || row.paymentDate)
    },
    {
      key: 'student',
      header: 'Student',
      width: '200px',
      render: (row) => row.student_name || `${row.student?.last_name || ''}, ${row.student?.first_name || ''}`.trim() || 'N/A'
    },
    {
      key: 'admissionNumber',
      header: 'Admission #',
      width: '120px',
      render: (row) => row.admission_number || row.student?.admission_number || 'N/A'
    },
    {
      key: 'class',
      header: 'Class',
      width: '100px',
      render: (row) => row.class_name || row.student?.class_name || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount),
      align: 'right'
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      width: '120px',
      render: (row) => getPaymentMethodName(row.payment_method_id || row.paymentMethodId)
    },
    {
      key: 'academicYear',
      header: 'Year',
      width: '80px',
      render: (row) => row.academic_year || row.academicYear || 'N/A'
    },
    {
      key: 'term',
      header: 'Term',
      width: '80px',
      render: (row) => row.term || 'N/A'
    },
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      width: '120px',
      render: (row) => row.receipt_number || 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="action-buttons">
          {onView && (
            <Button variant="info" size="sm" onClick={() => onView(row)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="primary" size="sm" onClick={() => onEdit(row)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(row)}>
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
      data={payments || []}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
      keyExtractor={(row) => row.id}
      emptyMessage="No school fee payments found"
      className="school-fee-table"
    />
  );
}

SchoolFeeTable.propTypes = {
  payments: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default SchoolFeeTable;
