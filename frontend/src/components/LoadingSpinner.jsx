import React from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner.jsx';

/**
 * LoadingSpinner Component
 * A convenience component that combines Spinner with a loading message
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Message to display
 * @param {string} [props.size='md'] - Spinner size
 * @param {string} [props.className] - Additional CSS classes
 */
function LoadingSpinner({ message = 'Loading...', size = 'md', className = '' }) {
  return (
    <div className={`loading-spinner ${className}`}>
      <Spinner size={size} message={message} />
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default LoadingSpinner;
