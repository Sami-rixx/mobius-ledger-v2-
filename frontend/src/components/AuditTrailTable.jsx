import React from 'react';
import PropTypes from 'prop-types';
import { Table, Badge, Pagination } from './index.js';
import { getAuditActionLabel, getAuditActionColor, formatAuditTrail } from '../services/auditTrailService.js';

/**
 * AuditTrailTable Component
 * Displays audit trail entries in a table format with pagination
 * 
 * @param {Object} props - Component props
 * @param {Array} props.auditTrails - Array of audit trail entries
 * @param {Object} props.pagination - Pagination information
 * @param {Function} props.onPageChange - Page change handler
 * @param {boolean} props.loading - Whether data is loading
 * @param {boolean} props.compact - Whether to use compact table layout
 */
function AuditTrailTable({
  auditTrails = [],
  pagination,
  onPageChange,
  loading = false,
  compact = false
}) {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get user display
  const getUserDisplay = (auditTrail) => {
    if (auditTrail.user_id) {
      return `User #${auditTrail.user_id}`;
    }
    if (auditTrail.ip_address) {
      return auditTrail.ip_address;
    }
    return 'System';
  };

  // Define table columns
  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (auditTrail) => (
        <Badge type={getAuditActionColor(auditTrail.action)}>
          {getAuditActionLabel(auditTrail.action)}
        </Badge>
      ),
      width: compact ? '100px' : '120px'
    },
    {
      key: 'table',
      header: 'Table',
      render: (auditTrail) => auditTrail.table_name,
      width: compact ? '120px' : '150px'
    },
    {
      key: 'record',
      header: 'Record ID',
      render: (auditTrail) => `#${auditTrail.record_id}`,
      width: compact ? '80px' : '100px'
    },
    {
      key: 'user',
      header: 'User',
      render: (auditTrail) => getUserDisplay(auditTrail),
      width: compact ? '120px' : '150px'
    },
    {
      key: 'date',
      header: 'Date',
      render: (auditTrail) => formatDate(auditTrail.created_at),
      width: compact ? '150px' : '180px'
    }
  ];

  // If not compact, add IP address column
  if (!compact) {
    columns.push({
      key: 'ip',
      header: 'IP Address',
      render: (auditTrail) => auditTrail.ip_address || 'N/A',
      width: '120px'
    });
  }

  return (
    <div className="audit-trail-table-container">
      <Table
        data={auditTrails}
        columns={columns}
        keyExtractor={(auditTrail) => auditTrail.id}
        loading={loading}
        emptyMessage={loading ? 'Loading audit trails...' : 'No audit trail entries found'}
        className="audit-trail-table"
      />

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="table-pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            showPageSize={false}
          />
          <div className="pagination-info">
            Showing {pagination.page} of {pagination.totalPages} pages ({pagination.total} total entries)
          </div>
        </div>
      )}
    </div>
  );
}

AuditTrailTable.propTypes = {
  auditTrails: PropTypes.array,
  pagination: PropTypes.object,
  onPageChange: PropTypes.func,
  loading: PropTypes.bool,
  compact: PropTypes.bool
};

export default AuditTrailTable;
