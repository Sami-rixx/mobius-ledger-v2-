import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Input component
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Input name
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.label] - Input label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string|number} [props.value] - Input value
 * @param {Function} [props.onChange] - Change handler
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.required=false] - Required field
 * @param {string} [props.error] - Error message
 * @param {string} [props.className] - Additional CSS classes
 */
function Input({
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={error ? 'input-error' : ''}
        {...props}
      />
      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
}

Input.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

export default Input;
