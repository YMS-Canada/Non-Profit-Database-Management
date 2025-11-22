import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../lib/api';

function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const dashboardData = await getAdminDashboard();
        setData(dashboardData);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  const { stats, pending_requests, recent_activity, monthly_report } = data;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <div className="text-sm text-blue-600 font-medium">Total Requests</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="text-sm text-yellow-600 font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <div className="text-sm text-green-600 font-medium">Approved</div>
          <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-sm text-red-600 font-medium">Rejected</div>
          <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link
          to="/admin/pending-requests"
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          View Pending Requests
        </Link>
        <Link
          to="/admin/create-user"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Create User Account
        </Link>
        <Link
          to="/budgets"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          View All Budget Requests
        </Link>
        <Link
          to="/budgets/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Create New Request
        </Link>
      </div>

      {/* Pending Requests */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Pending Requests (Latest 10)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Requester</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending_requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                    No pending requests
                  </td>
                </tr>
              ) : (
                pending_requests.map((req) => (
                  <tr key={req.request_id}>
                    <td className="px-4 py-2 text-sm">{req.request_id}</td>
                    <td className="px-4 py-2 text-sm">{req.city_name}</td>
                    <td className="px-4 py-2 text-sm">{req.month}</td>
                    <td className="px-4 py-2 text-sm">{req.description || '—'}</td>
                    <td className="px-4 py-2 text-sm">{req.requester_name || '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      <Link
                        to={`/admin/requests/${req.request_id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Recent Activity (Latest 10)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Requester</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recent_activity.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                    No recent activity
                  </td>
                </tr>
              ) : (
                recent_activity.map((req) => (
                  <tr key={req.request_id}>
                    <td className="px-4 py-2 text-sm">{req.request_id}</td>
                    <td className="px-4 py-2 text-sm">{req.city_name}</td>
                    <td className="px-4 py-2 text-sm">{req.month}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{req.requester_name || '—'}</td>
                    <td className="px-4 py-2 text-sm">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Report */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Monthly Report (Approved Requests)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total Amount (CAD)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthly_report.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-gray-500">
                    No approved requests yet
                  </td>
                </tr>
              ) : (
                monthly_report.map((report, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm">{report.city}</td>
                    <td className="px-4 py-2 text-sm">{report.month}</td>
                    <td className="px-4 py-2 text-sm font-medium">${report.total_amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
