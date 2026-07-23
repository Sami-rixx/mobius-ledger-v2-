import React from 'react';
import { Card, Button } from '../components/index.js';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <header className="header">
        <h1>Mobius Ledger v2</h1>
        <p>Financial Management for Schools</p>
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          {/* Quick Access Cards */}
          <Card title="Quick Access" className="quick-access-card">
            <div className="quick-access-buttons">
              <Button
                variant="primary"
                onClick={() => navigate('/students')}
                className="quick-access-button"
              >
                Manage Students
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/students/create')}
                className="quick-access-button"
              >
                Add New Student
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/classes')}
                className="quick-access-button"
              >
                Manage Classes
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/classes/create')}
                className="quick-access-button"
              >
                Add New Class
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/school-fees')}
                className="quick-access-button"
              >
                Manage School Fees
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/school-fees/create')}
                className="quick-access-button"
              >
                Record Fee Payment
              </Button>
            </div>
          </Card>

          {/* Welcome Card */}
          <Card title="Welcome" className="welcome-card">
            <p>Welcome to Mobius Ledger v2, your comprehensive financial management system for schools.</p>
            <p>
              This system helps you manage student records, track fees, manage lunch payments,
              record income and expenses, and generate comprehensive reports.
            </p>
            <div className="feature-list">
              <h3>Features:</h3>
              <ul>
                <li>Student Management</li>
                <li>Class Management</li>
                <li>School Fees Tracking</li>
                <li>Lunch Management</li>
                <li>Income & Expense Tracking</li>
                <li>Daily Ledger</li>
                <li>Reports & Analytics</li>
              </ul>
            </div>
          </Card>

          {/* System Info Card */}
          <Card title="System Information" className="info-card">
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">2.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value badge badge-success">Active</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
