import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/api';
import './Dashboard.css';

function TreasurerDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    myRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'TREASURER') {
          navigate('/login');
          return;
        }
        setUser(currentUser);
        
        // You can fetch treasurer-specific stats here
        // For now, using placeholder data
      } catch (err) {
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Treasurer Dashboard</h1>
        <p className="welcome-text">Welcome, {user.name}</p>
        <p className="city-text">City: {user.city_name || 'N/A'}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>My Requests</h3>
            <p className="stat-number">{stats.myRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Approved</h3>
            <p className="stat-number">{stats.approvedRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-number">{stats.rejectedRequests}</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => navigate('/budgets/new')}>
            Submit New Budget Request
          </button>
          <button className="action-btn" onClick={() => navigate('/budgets')}>
            View My Requests
          </button>
        </div>
      </div>
    </div>
  );
}

export default TreasurerDashboard;
