import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge Component
 * Displays a small badge/pill for labels, status indicators, etc.
 * 
 * @param {Object} props - Component props
 * @param {string} props.children - Badge content
 * @param {string} [props.type='secondary'] - Badge type (primary, secondary, success, warning, danger, info)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler
 */
function Badge({ children, type = 'secondary', className = '', onClick }) {
  const typeClasses = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info'
  };

  const badgeClasses = `badge ${typeClasses[type]} ${className}`;

  if (onClick) {
    return (
      <button className={badgeClasses} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Badge;
