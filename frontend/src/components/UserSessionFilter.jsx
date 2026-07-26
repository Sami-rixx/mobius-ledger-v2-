import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from './index.js';

/**
 * UserSessionFilter Component
 * Filter controls for user session lists
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - Current user ID filter
 * @param {boolean} props.isActive - Current active status filter
 * @param {string} props.ipAddress - Current IP address filter
 * @param {string} props.search - Current search term
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onReset - Reset filters handler
 */
function UserSessionFilter({
  userId,
  isActive,
  ipAddress,
  search,
  onFilterChange,
  onReset
}) {
  const [localFilters, setLocalFilters] = useState({
    userId: userId || '',
    isActive: isActive || null,
    ipAddress: ipAddress || '',
    search: search || ''
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocalFilters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Apply filters
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        userId: localFilters.userId ? parseInt(localFilters.userId) : undefined,
        isActive: localFilters.isActive === null ? undefined : localFilters.isActive === true,
        ipAddress: localFilters.ipAddress || undefined,
        search: localFilters.search || undefined
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setLocalFilters({
      userId: '',
      isActive: null,
      ipAddress: '',
      search: ''
    });
    
    if (onReset) {
      onReset();
    } else if (onFilterChange) {
      onFilterChange({
        userId: undefined,
        isActive: undefined,
        ipAddress: undefined,
        search: undefined
      });
    }
  };

  return (
    <div className="user-session-filter">
      <div className="filter-grid">
        <div className="filter-group">
          <label htmlFor="userIdFilter">User ID</label>
          <Input
            id="userIdFilter"
            name="userId"
            type="number"
            value={localFilters.userId}
            onChange={handleChange}
            placeholder="Filter by user ID"
          />
        </div>

        <div className="filter-group">
          <label>
            <Input
              type="checkbox"
              name="isActive"
              checked={localFilters.isActive === true}
              onChange={(e) => {
                setLocalFilters(prev => ({
                  ...prev,
                  isActive: e.target.checked ? true : null
                }));
              }}
            />
            Active Only
          </label>
        </div>

        <div className="filter-group">
          <label htmlFor="ipAddressFilter">IP Address</label>
          <Input
            id="ipAddressFilter"
            name="ipAddress"
            type="text"
            value={localFilters.ipAddress}
            onChange={handleChange}
            placeholder="Filter by IP address"
          />
        </div>

        <div className="filter-group search-group">
          <label htmlFor="searchFilter">Search</label>
          <Input
            id="searchFilter"
            name="search"
            type="text"
            value={localFilters.search}
            onChange={handleChange}
            placeholder="Search sessions..."
          />
        </div>
      </div>

      <div className="filter-actions">
        <Button variant="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
        
        <Button variant="secondary" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );
}

UserSessionFilter.propTypes = {
  userId: PropTypes.number,
  isActive: PropTypes.bool,
  ipAddress: PropTypes.string,
  search: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  onReset: PropTypes.func
};

export default UserSessionFilter;
