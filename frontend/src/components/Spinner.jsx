import React from 'react';
import PropTypes from 'prop-types';

/**
 * Spinner Component
 * Displays a loading spinner animation
 * 
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Spinner size (sm, md, lg)
 * @param {string} [props.message='Loading...'] - Message to display below spinner
 * @param {string} [props.className] - Additional CSS classes
 */
function Spinner({ size = 'md', message = 'Loading...', className = '' }) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg'
  };

  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} role="status" aria-label="Loading">
        <div className="spinner-border" />
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <p className="spinner-message">{message}</p>
      )}
    </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  message: PropTypes.string,
  className: PropTypes.string
};

export default Spinner;
