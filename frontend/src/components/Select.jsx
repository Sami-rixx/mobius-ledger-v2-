/**
 * Select Component
 * Custom select dropdown component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} [props.id] - HTML id attribute
 * @param {boolean} [props.disabled=false] - Whether select is disabled
 * @param {string} [props.className] - Additional CSS classes
 */
import React from 'react';
import PropTypes from 'prop-types';

function Select({ options = [], value, onChange, id, disabled = false, className = '' }) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <select
      id={id}
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      className={`select ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  value: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Select;
