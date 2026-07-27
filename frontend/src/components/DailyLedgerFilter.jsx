/**
 * DailyLedgerFilter Component
 * Filter controls for daily ledger lists with date range filtering
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from './index.js';
import './DailyLedgerFilter.scss';

/**
 * DailyLedgerFilter Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filter - Current filter values
 * @param {string} props.filter.startDate - Start date filter
 * @param {string} props.filter.endDate - End date filter
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onReset - Reset handler
 * @param {boolean} props.disabled - Whether filters are disabled
 */
function DailyLedgerFilter({
  filter = {},
  onFilterChange,
  onReset,
  disabled = false
}) {
  const [localFilter, setLocalFilter] = useState({
    startDate: filter.startDate || '',
    endDate: filter.endDate || ''
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        startDate: localFilter.startDate || undefined,
        endDate: localFilter.endDate || undefined
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setLocalFilter({
      startDate: '',
      endDate: ''
    });
    
    if (onReset) {
      onReset();
    } else if (onFilterChange) {
      onFilterChange({
        startDate: undefined,
        endDate: undefined
      });
    }
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return localFilter.startDate || localFilter.endDate;
  };

  // Handle key press for quick apply
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="daily-ledger-filter">
      <div className="daily-ledger-filter__row">
        {/* Start Date */}
        <div className="daily-ledger-filter__group">
          <label htmlFor="startDate">Start Date</label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={localFilter.startDate}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
        </div>

        {/* End Date */}
        <div className="daily-ledger-filter__group">
          <label htmlFor="endDate">End Date</label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={localFilter.endDate}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="daily-ledger-filter__actions">
        <Button 
          variant="primary" 
          size="sm"
          onClick={applyFilters} 
          disabled={disabled}
        >
          Apply Filters
        </Button>
        
        {(hasActiveFilters() || filter.startDate || filter.endDate) && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={resetFilters} 
            disabled={disabled}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

DailyLedgerFilter.propTypes = {
  filter: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string
  }),
  onFilterChange: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  disabled: PropTypes.bool
};

DailyLedgerFilter.defaultProps = {
  filter: {},
  onReset: null,
  disabled: false
};

export default DailyLedgerFilter;
