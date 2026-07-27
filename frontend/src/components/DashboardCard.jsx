/**
 * DashboardCard Component
 * Reusable card component for displaying dashboard statistics and information
 */

import React from 'react';
import PropTypes from 'prop-types';
import './DashboardCard.scss';

/**
 * DashboardCard Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.label - Label for the value
 * @param {string} props.icon - Icon class (Font Awesome or custom)
 * @param {string} props.color - Card color theme (primary, success, warning, danger, info)
 * @param {string} props.trend - Trend indicator (up, down, neutral)
 * @param {string} props.trendValue - Trend value/percentage
 * @param {boolean} props.loading - Whether to show loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
function DashboardCard({
  title,
  value,
  label,
  icon,
  color = 'primary',
  trend,
  trendValue,
  loading = false,
  onClick,
  className = ''
}) {
  // Format value based on type
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val;
  };

  // Get trend icon and class
  const getTrendIcon = () => {
    if (loading) return 'fa fa-spinner fa-spin';
    if (trend === 'up') return 'fa fa-arrow-up';
    if (trend === 'down') return 'fa fa-arrow-down';
    return null;
  };

  const getTrendClass = () => {
    if (trend === 'up') return 'dashboard-card__trend--up';
    if (trend === 'down') return 'dashboard-card__trend--down';
    return 'dashboard-card__trend--neutral';
  };

  return (
    <div 
      className={`dashboard-card dashboard-card--${color} ${className}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="dashboard-card__header">
        {icon && <i className={`dashboard-card__icon ${icon}`} aria-hidden="true" />}
        <h3 className="dashboard-card__title">{title}</h3>
      </div>
      
      <div className="dashboard-card__content">
        {loading ? (
          <div className="dashboard-card__loading">
            <i className="fa fa-spinner fa-spin" />
          </div>
        ) : (
          <>
            <div className="dashboard-card__value">{formatValue(value)}</div>
            <div className="dashboard-card__label">{label}</div>
          </>
        )}
      </div>
      
      {trend && trendValue && !loading && (
        <div className={`dashboard-card__trend ${getTrendClass()}`}>
          <i className={getTrendIcon()} aria-hidden="true" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  icon: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info', 'secondary']),
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendValue: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default DashboardCard;
