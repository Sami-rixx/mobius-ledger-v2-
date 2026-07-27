/**
 * ImportExportFilter Component
 * Filter component for import/export operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { IMPORT_EXPORT_PARAMS, getSupportedTables } from '../services/importExportService.js';
import './ImportExportFilter.scss';

/**
 * ImportExportFilter Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filter - Current filter values
 * @param {Function} props.onChange - Filter change handler
 * @param {boolean} props.disabled - Whether filter is disabled
 * @param {string} props.className - Additional CSS classes
 */
function ImportExportFilter({
  filter = {},
  onChange,
  disabled = false,
  className = ''
}) {
  // State management
  const [localFilter, setLocalFilter] = useState(filter);
  const [supportedTables, setSupportedTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Load supported tables
  useEffect(() => {
    const loadSupportedTables = async () => {
      try {
        setLoadingTables(true);
        const response = await getSupportedTables();
        setSupportedTables(response.data.data || []);
      } catch (error) {
        console.error('Error loading supported tables:', error);
        setSupportedTables([]);
      } finally {
        setLoadingTables(false);
      }
    };
    
    loadSupportedTables();
  }, []);

  // Update local state when external filter changes
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  // Handle input change
  const handleChange = useCallback((field, value) => {
    setLocalFilter(prev => {
      const newFilter = { ...prev, [field]: value };
      
      // Clear dependent fields when type or action changes
      if (field === 'type' || field === 'action') {
        delete newFilter.tableName;
        delete newFilter.filename;
      }
      
      // Apply immediately
      if (onChange) {
        onChange(newFilter);
      }
      
      return newFilter;
    });
  }, [onChange]);

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onChange) {
      onChange(localFilter);
    }
  };

  // Handle reset
  const handleReset = () => {
    const resetFilter = {};
    setLocalFilter(resetFilter);
    if (onChange) {
      onChange(resetFilter);
    }
  };

  // Filter options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'backup', label: 'Backup' },
    { value: 'restore', label: 'Restore' }
  ];

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'database_export', label: 'Database Export' },
    { value: 'database_import', label: 'Database Import' },
    { value: 'csv_export', label: 'CSV Export' },
    { value: 'csv_import', label: 'CSV Import' },
    { value: 'backup', label: 'Backup' },
    { value: 'restore', label: 'Restore' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <form 
      className={`import-export-filter ${className}`} 
      onSubmit={handleSubmit}
    >
      <div className="import-export-filter__fields">
        {/* Type filter */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="type"
          >
            Type
          </label>
          <select
            id="type"
            className="import-export-filter__select"
            value={localFilter.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
            disabled={disabled || loadingTables}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="action"
          >
            Action
          </label>
          <select
            id="action"
            className="import-export-filter__select"
            value={localFilter.action || ''}
            onChange={(e) => handleChange('action', e.target.value || undefined)}
            disabled={disabled || loadingTables}
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table filter */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="tableName"
          >
            Table
          </label>
          <select
            id="tableName"
            className="import-export-filter__select"
            value={localFilter.tableName || ''}
            onChange={(e) => handleChange('tableName', e.target.value || undefined)}
            disabled={disabled || loadingTables}
          >
            <option value="">All Tables</option>
            {loadingTables && (
              <option value="" disabled>
                Loading tables...
              </option>
            )}
            {supportedTables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="status"
          >
            Status
          </label>
          <select
            id="status"
            className="import-export-filter__select"
            value={localFilter.status || ''}
            onChange={(e) => handleChange('status', e.target.value || undefined)}
            disabled={disabled || loadingTables}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filename filter */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="filename"
          >
            Filename
          </label>
          <input
            id="filename"
            type="text"
            className="import-export-filter__input"
            value={localFilter.filename || ''}
            onChange={(e) => handleChange('filename', e.target.value || undefined)}
            placeholder="Enter filename..."
            disabled={disabled}
          />
        </div>

        {/* Date range filters */}
        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="startDate"
          >
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            className="import-export-filter__input"
            value={localFilter.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value || undefined)}
            disabled={disabled}
          />
        </div>

        <div className="import-export-filter__field">
          <label 
            className="import-export-filter__label" 
            htmlFor="endDate"
          >
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            className="import-export-filter__input"
            value={localFilter.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value || undefined)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="import-export-filter__actions">
        <button
          type="submit"
          className="import-export-filter__apply-btn"
          disabled={disabled || loadingTables}
        >
          Apply Filters
        </button>
        <button
          type="button"
          className="import-export-filter__reset-btn"
          onClick={handleReset}
          disabled={disabled}
        >
          Reset
        </button>
      </div>

      {/* Active filters indicator */}
      {Object.keys(localFilter).length > 0 && (
        <div className="import-export-filter__active">
          <span className="import-export-filter__active-label">Active Filters:</span>
          <span className="import-export-filter__active-count">
            {Object.keys(localFilter).length}
          </span>
        </div>
      )}
    </form>
  );
}

ImportExportFilter.propTypes = {
  filter: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default ImportExportFilter;
