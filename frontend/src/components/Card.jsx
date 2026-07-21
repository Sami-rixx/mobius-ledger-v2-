import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Card component
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} [props.subtitle] - Card subtitle
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler (makes card clickable)
 */
function Card({ title, subtitle, children, className = '', onClick }) {
  const cardClasses = onClick ? 'card card-clickable' : 'card';

  return (
    <div className={`${cardClasses} ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Card;
