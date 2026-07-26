import React, { useState } from 'react';
import { Card, Button, AnalyticsDashboard } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../../services/index.js';

/**
 * AnalyticsDashboardPage Component
 * Displays comprehensive financial analytics dashboard
 */
function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle refresh
  const handleRefresh = () => {
    // The dashboard component handles its own refresh
    // This is just a placeholder for page-level refresh
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  // Handle navigation
  const handleGoBack = () => {
    navigate('/');
  };

  // Handle date range selection
  const handleDateRangeChange = (range) => {
    // This is handled by the dashboard component itself
  };

  return (
    <div className="page analytics-dashboard-page">
      <header className="page-header">
        <h1>Financial Analytics Dashboard</h1>
        <p>Comprehensive financial insights and trends</p>
      </header>

      <main className="page-main">
        {/* Dashboard */}
        <AnalyticsDashboard
          autoRefresh={true}
          refreshInterval={300}
        />

        {/* Action Buttons */}
        <Card title="Actions" className="actions-card">
          <div className="action-buttons">
            <Button variant="outline" onClick={handleRefresh}>
              Refresh Dashboard
            </Button>
            <Button variant="outline" onClick={handleGoBack}>
              Back to Home
            </Button>
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <p>Refreshing data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnalyticsDashboardPage;
