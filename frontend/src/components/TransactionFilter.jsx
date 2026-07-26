import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from './index.js';
import { getAllStudents } from '../services/studentService.js';
import { TRANSACTION_TYPES } from '../services/transactionService.js';

/**
 * TransactionFilter Component
 * Filter controls for transaction lists
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onSearch - Search handler
 * @param {Function} props.onReset - Reset handler
 */
function TransactionFilter({ filters, onFilterChange, onSearch, onReset }) {
  const [students, setStudents] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // Load students for student filter
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await getAllStudents();
        setStudents(response.data || response);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudents();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    onFilterChange({
      ...filters,
      startDate,
      endDate
    });
  };

  // Transaction type options
  const transactionTypeOptions = [
    { value: '', label: 'All Types' },
    { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
    { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
    { value: TRANSACTION_TYPES.SCHOOL_FEE, label: 'School Fee' },
    { value: TRANSACTION_TYPES.LUNCH_FEE, label: 'Lunch Fee' },
    { value: TRANSACTION_TYPES.STUDENT_CHARGE, label: 'Student Charge' },
    { value: TRANSACTION_TYPES.DIRECTOR_WITHDRAWAL, label: 'Director Withdrawal' }
  ];

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' }
  ];

  // Check if any filter is active
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => {
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value !== 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    });
  };

  return (
    <div className="transaction-filter">
      <div className="filter-header">
        <h3>Filters</h3>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {expanded && (
        <div className="filter-content">
          <div className="filter-row">
            {/* Receipt Number */}
            <div className="filter-group">
              <label htmlFor="receiptNumber">Receipt #</label>
              <Input
                id="receiptNumber"
                name="receiptNumber"
                type="text"
                value={filters.receiptNumber || ''}
                onChange={handleChange}
                placeholder="ML-YYYY-#####"
              />
            </div>

            {/* Transaction Type */}
            <div className="filter-group">
              <label htmlFor="transactionType">Type</label>
              <select
                id="transactionType"
                name="transactionType"
                value={filters.transactionType || ''}
                onChange={handleChange}
              >
                {transactionTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Student */}
            <div className="filter-group">
              <label htmlFor="studentId">Student</label>
              <select
                id="studentId"
                name="studentId"
                value={filters.studentId || ''}
                onChange={handleChange}
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.admission_number} - {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            {/* Start Date */}
            <div className="filter-group">
              <label htmlFor="startDate">Start Date</label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={handleChange}
              />
            </div>

            {/* End Date */}
            <div className="filter-group">
              <label htmlFor="endDate">End Date</label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div className="filter-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="isVerified"
                value={filters.isVerified || ''}
                onChange={handleChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            {/* Search */}
            <div className="filter-group full-width">
              <label htmlFor="search">Search</label>
              <div className="search-with-button">
                <Input
                  id="search"
                  name="search"
                  type="text"
                  value={filters.search || ''}
                  onChange={handleChange}
                  placeholder="Search transactions..."
                />
                {onSearch && (
                  <Button variant="primary" onClick={onSearch}>
                    Search
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="filter-actions">
            {hasActiveFilters() && onReset && (
              <Button variant="outline" onClick={onReset}>
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

TransactionFilter.propTypes = {
  filters: PropTypes.object,
  onFilterChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onReset: PropTypes.func
};

TransactionFilter.defaultProps = {
  filters: {},
  onSearch: null,
  onReset: null
};

export default TransactionFilter;
