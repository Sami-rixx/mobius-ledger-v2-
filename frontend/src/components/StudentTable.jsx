import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * StudentTable Component
 * Displays a list of students in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.students - Array of student objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function StudentTable({
  students,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    }
    return phone;
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Table columns
  const columns = [
    {
      key: 'admission_number',
      header: 'Admission #',
      width: '120px',
      render: (row) => row.admission_number || 'N/A'
    },
    {
      key: 'name',
      header: 'Name',
      width: '200px',
      render: (row) => `${row.last_name || ''}, ${row.first_name || ''}`.trim() || 'N/A'
    },
    {
      key: 'class',
      header: 'Class',
      width: '120px',
      render: (row) => row.class_name || 'N/A'
    },
    {
      key: 'gender',
      header: 'Gender',
      width: '80px',
      render: (row) => row.gender || 'N/A'
    },
    {
      key: 'age',
      header: 'Age',
      width: '60px',
      render: (row) => {
        const age = calculateAge(row.date_of_birth);
        return age || 'N/A';
      }
    },
    {
      key: 'parent_phone',
      header: 'Parent Phone',
      width: '120px',
      render: (row) => formatPhone(row.parent_phone)
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const status = row.status || 'N/A';
        const variant = status === 'Active' ? 'success' : 
                       status === 'Graduated' ? 'info' : 
                       status === 'Transferred' ? 'warning' : 'error';
        return <span className={`badge badge-${variant}`}>{status}</span>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      render: (row) => (
        <div className="action-buttons">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(row)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(row)}>
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
    <div className="student-table">
      <Table
        columns={columns}
        data={students || []}
        emptyMessage={loading ? 'Loading students...' : 'No students found'}
      />

      {pagination && onPageChange && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {pagination.page} of {pagination.totalPages} pages ({pagination.total} students)
          </div>
          <div className="pagination-buttons">
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => onPageChange(pagination.previousPage)}
            >
              Previous
            </Button>
            <span className="page-indicator">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => onPageChange(pagination.nextPage)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

StudentTable.propTypes = {
  students: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default StudentTable;
