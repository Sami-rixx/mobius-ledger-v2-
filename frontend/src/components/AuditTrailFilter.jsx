import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Select } from './index.js';
import { AUDIT_ACTIONS } from '../services/auditTrailService.js';

/**
 * AuditTrailFilter Component
 * Filter controls for audit trail lists
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change callback
 * @param {boolean} props.disabled - Whether filters are disabled
 * @param {boolean} props.showTableFilter - Whether to show table name filter
 */
function AuditTrailFilter({
  filters = {},
  onFilterChange,
  disabled = false,
  showTableFilter = true
}) {
  const [localFilters, setLocalFilters] = useState({
    action: filters.action || '',
    tableName: filters.tableName || '',
    recordId: filters.recordId || '',
    userId: filters.userId || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    search: filters.search || ''
  });

  // Available tracked tables
  const trackedTables = [
    'students',
    'classes',
    'school_fees',
    'lunch_payments',
    'lunch_attendance',
    'student_charges',
    'student_charge_assignments',
    'income',
    'income_categories',
    'expenses',
    'expense_categories',
    'director_withdrawals',
    'transactions',
    'daily_summaries',
    'reports'
  ];

  // Action options
  const actionOptions = [
    { value: '', label: 'All Actions' },
    ...AUDIT_ACTIONS.map(action => ({ value: action, label: action }))
  ];

  // Table options
  const tableOptions = [
    { value: '', label: 'All Tables' },
    ...trackedTables.map(table => ({ value: table, label: table }))
  ];

  // Handle input change
  const handleChange = useCallback((field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    if (onFilterChange) {
      onFilterChange(localFilters);
    }
  }, [localFilters, onFilterChange]);

  // Reset filters
  const handleReset = useCallback(() => {
    const resetFilters = {
      action: '',
      tableName: '',
      recordId: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  }, [onFilterChange]);

  // Handle key press for quick apply
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  }, [handleApply]);

  return (
    <div className="audit-trail-filter">
      <div className="filter-row">
        {/* Action Filter */}
        <div className="filter-group">
          <label htmlFor="filter-action">Action</label>
          <Select
            id="filter-action"
            options={actionOptions}
            value={localFilters.action}
            onChange={(value) => handleChange('action', value)}
            disabled={disabled}
          />
        </div>

        {/* Table Name Filter */}
        {showTableFilter && (
          <div className="filter-group">
            <label htmlFor="filter-table">Table</label>
            <Select
              id="filter-table"
              options={tableOptions}
              value={localFilters.tableName}
              onChange={(value) => handleChange('tableName', value)}
              disabled={disabled}
            />
          </div>
        )}

        {/* Record ID Filter */}
        <div className="filter-group">
          <label htmlFor="filter-record">Record ID</label>
          <Input
            id="filter-record"
            type="number"
            value={localFilters.recordId}
            onChange={(e) => handleChange('recordId', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Record ID"
            disabled={disabled}
          />
        </div>

        {/* User ID Filter */}
        <div className="filter-group">
          <label htmlFor="filter-user">User ID</label>
          <Input
            id="filter-user"
            type="number"
            value={localFilters.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="User ID"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="filter-row">
        {/* Date Range Filters */}
        <div className="filter-group">
          <label htmlFor="filter-start-date">Start Date</label>
          <Input
            id="filter-start-date"
            type="date"
            value={localFilters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-end-date">End Date</label>
          <Input
            id="filter-end-date"
            type="date"
            value={localFilters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Search Filter */}
        <div className="filter-group search-group">
          <label htmlFor="filter-search">Search</label>
          <Input
            id="filter-search"
            type="text"
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search..."
            disabled={disabled}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <Button onClick={handleApply} disabled={disabled}>
          Apply Filters
        </Button>
        <Button onClick={handleReset} disabled={disabled} variant="secondary">
          Reset
        </Button>
      </div>
    </div>
  );
}

AuditTrailFilter.propTypes = {
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  disabled: PropTypes.bool,
  showTableFilter: PropTypes.bool
};

export default AuditTrailFilter;
