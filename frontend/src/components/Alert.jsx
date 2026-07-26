import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button.jsx';

/**
 * Alert Component
 * Displays an alert message with optional dismiss button
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type (info, success, warning, error)
 * @param {string} props.message - Alert message
 * @param {boolean} props.dismissible - Whether alert can be dismissed
 * @param {Function} props.onClose - Callback when alert is closed
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.duration] - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
 */
function Alert({ type, message, dismissible = true, onClose, className = '', duration = 0 }) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss if duration is set
  useEffect(() => {
    if (duration > 0 && visible) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, visible]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  const typeClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error'
  };

  const alertClasses = `alert ${typeClasses[type]} ${className}`;

  return (
    <div className={alertClasses} role="alert">
      <span className="alert-message">{message}</span>
      {dismissible && (
        <Button
          variant="text"
          size="sm"
          className="alert-close"
          onClick={handleClose}
          aria-label="Close"
        >
          &times;
        </Button>
      )}
    </div>
  );
}

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
  message: PropTypes.string.isRequired,
  dismissible: PropTypes.bool,
  onClose: PropTypes.func,
  className: PropTypes.string,
  duration: PropTypes.number
};

export default Alert;
