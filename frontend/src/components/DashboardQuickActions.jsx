/**
 * DashboardQuickActions Component
 * Quick action buttons for common dashboard actions
 */

import React from 'react';
import PropTypes from 'prop-types';
import './DashboardQuickActions.scss';

/**
 * DashboardQuickActions Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.actions - Array of action buttons
 * @param {string} props.title - Section title
 */
function DashboardQuickActions({ actions = [], title = 'Quick Actions' }) {
  // Default actions if none provided
  const defaultActions = [
    { 
      label: 'Add Income', 
      icon: 'fa fa-plus', 
      color: 'success',
      to: '/income/create'
    },
    { 
      label: 'Add Expense', 
      icon: 'fa fa-minus', 
      color: 'danger',
      to: '/expenses/create'
    },
    { 
      label: 'Record Fee', 
      icon: 'fa fa-graduation-cap', 
      color: 'primary',
      to: '/school-fees/create'
    },
    { 
      label: 'Add Charge', 
      icon: 'fa fa-tag', 
      color: 'info',
      to: '/charges/create'
    },
    { 
      label: 'View Reports', 
      icon: 'fa fa-chart-bar', 
      color: 'warning',
      to: '/reports'
    },
    { 
      label: 'Manage Students', 
      icon: 'fa fa-users', 
      color: 'secondary',
      to: '/students'
    }
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="dashboard-quick-actions">
      <h3 className="dashboard-quick-actions__title">{title}</h3>
      <div className="dashboard-quick-actions__grid">
        {displayActions.map((action, index) => (
          <a 
            key={index}
            href={action.to || '#'}
            className={`dashboard-quick-actions__button dashboard-quick-actions__button--${action.color || 'primary'}`}
          >
            {action.icon && <i className={action.icon} aria-hidden="true" />}
            <span>{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

DashboardQuickActions.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    to: PropTypes.string,
    onClick: PropTypes.func
  })),
  title: PropTypes.string
};

export default DashboardQuickActions;
