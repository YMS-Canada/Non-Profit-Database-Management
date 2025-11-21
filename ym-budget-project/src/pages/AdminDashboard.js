import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/api';
import './Dashboard.css';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedAmount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'ADMIN') {
          navigate('/login');
          return;
        }
        setUser(currentUser);
        
        // You can fetch stats here from your backend
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
        <h1>Admin Dashboard</h1>
        <p className="welcome-text">Welcome, {user.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Total Requests</h3>
            <p className="stat-number">{stats.totalRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending Requests</h3>
            <p className="stat-number">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Approved Amount</h3>
            <p className="stat-number">${stats.approvedAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => navigate('/admin/requests')}>
            View Pending Requests
          </button>
          <button className="action-btn" onClick={() => navigate('/admin/reports')}>
            Monthly Reports
          </button>
          <button className="action-btn" onClick={() => navigate('/admin/create-account')}>
            Create User Account
          </button>
          <button className="action-btn" onClick={() => navigate('/budgets')}>
            All Budget Requests
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
