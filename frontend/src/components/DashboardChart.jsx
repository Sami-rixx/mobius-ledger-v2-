/**
 * DashboardChart Component
 * Reusable chart component for dashboard visualizations
 * Uses simple CSS-based charts for better performance and no external dependencies
 */

import React from 'react';
import PropTypes from 'prop-types';
import './DashboardChart.scss';

/**
 * DashboardChart Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Chart title
 * @param {string} props.type - Chart type: 'bar', 'line', 'pie', 'doughnut'
 * @param {Array} props.data - Chart data
 * @param {Array} props.labels - Data labels
 * @param {Object} props.options - Chart options
 * @param {boolean} props.loading - Whether to show loading state
 * @param {string} props.className - Additional CSS classes
 */
function DashboardChart({
  title,
  type = 'bar',
  data,
  labels,
  options = {},
  loading = false,
  className = ''
}) {
  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Get max value for scaling
  const getMaxValue = () => {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.filter(d => typeof d === 'number' && !isNaN(d)));
  };

  // Calculate percentage for bar charts
  const calculatePercentage = (value) => {
    const max = getMaxValue();
    if (max === 0) return 0;
    return ((value || 0) / max) * 100;
  };

  // Render bar chart
  const renderBarChart = () => {
    if (!data || data.length === 0) {
      return <div className="dashboard-chart__empty">No data available</div>;
    }

    return (
      <div className="dashboard-chart__bars">
        {data.map((value, index) => {
          const percentage = calculatePercentage(value);
          const label = labels && labels[index] ? labels[index] : `Item ${index + 1}`;
          
          return (
            <div key={index} className="dashboard-chart__bar-container">
              <div className="dashboard-chart__bar-label">{label}</div>
              <div 
                className="dashboard-chart__bar"
                style={{ height: `${percentage}%` }}
              >
                <span className="dashboard-chart__bar-value">{formatCurrency(value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render line chart (simplified)
  const renderLineChart = () => {
    if (!data || data.length === 0) {
      return <div className="dashboard-chart__empty">No data available</div>;
    }

    const max = getMaxValue();
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value || 0) / max) * 100;
      const label = labels && labels[index] ? labels[index] : `Item ${index + 1}`;
      return { x, y, value, label };
    });

    return (
      <div className="dashboard-chart__line-container">
        <svg className="dashboard-chart__line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={options.color || '#007bff'}
            strokeWidth="2"
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
          />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={options.color || '#007bff'}
            />
          ))}
        </svg>
        <div className="dashboard-chart__line-labels">
          {points.map((point, index) => (
            <span key={index} style={{ left: `${point.x}%` }}>
              {point.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render pie/doughnut chart
  const renderPieChart = () => {
    if (!data || data.length === 0) {
      return <div className="dashboard-chart__empty">No data available</div>;
    }

    const total = data.reduce((sum, value) => sum + (value || 0), 0);
    if (total === 0) return <div className="dashboard-chart__empty">No data available</div>;

    let cumulativePercentage = 0;
    
    return (
      <div className="dashboard-chart__pie-container">
        <div className="dashboard-chart__pie">
          {data.map((value, index) => {
            const percentage = ((value || 0) / total) * 100;
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            cumulativePercentage += percentage;
            
            // Only show slice if percentage > 1% or it's the last item
            if (percentage > 1 || index === data.length - 1) {
              return (
                <div
                  key={index}
                  className="dashboard-chart__pie-slice"
                  style={{
                    '--start-angle': `${startAngle}deg`,
                    '--end-angle': `${endAngle}deg`,
                    '--color': options.colors && options.colors[index] ? options.colors[index] : getColor(index)
                  }}
                />
              );
            }
            return null;
          })}
        </div>
        <div className="dashboard-chart__pie-legend">
          {data.map((value, index) => {
            const percentage = ((value || 0) / total) * 100;
            const label = labels && labels[index] ? labels[index] : `Item ${index + 1}`;
            
            return (
              <div key={index} className="dashboard-chart__legend-item">
                <span 
                  className="dashboard-chart__legend-color"
                  style={{ backgroundColor: options.colors && options.colors[index] ? options.colors[index] : getColor(index) }}
                />
                <span className="dashboard-chart__legend-label">{label}</span>
                <span className="dashboard-chart__legend-value">{formatCurrency(value)} ({percentage.toFixed(1)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get color from palette
  const getColor = (index) => {
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6610f2', '#20c997', '#fd7e14', '#e83e8c'];
    return colors[index % colors.length];
  };

  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'pie':
      case 'doughnut':
        return renderPieChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={`dashboard-chart ${className}`}>
      <div className="dashboard-chart__header">
        <h3 className="dashboard-chart__title">{title}</h3>
      </div>
      <div className="dashboard-chart__content">
        {loading ? (
          <div className="dashboard-chart__loading">
            <i className="fa fa-spinner fa-spin" /> Loading...
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
}

DashboardChart.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['bar', 'line', 'pie', 'doughnut']),
  data: PropTypes.arrayOf(PropTypes.number),
  labels: PropTypes.arrayOf(PropTypes.string),
  options: PropTypes.shape({
    color: PropTypes.string,
    colors: PropTypes.arrayOf(PropTypes.string)
  }),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default DashboardChart;
