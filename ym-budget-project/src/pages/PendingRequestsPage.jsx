import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingRequests, approveBudgetRequest, rejectBudgetRequest } from '../lib/api';

export default function PendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingRequests();
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(id) {
    setProcessingId(id);
    try {
      await approveBudgetRequest(id);
      await loadData(); // Refresh the list
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id) {
    setProcessingId(id);
    try {
      await rejectBudgetRequest(id);
      await loadData(); // Refresh the list
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  // Separate requests by status
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  if (loading) return <div className="p-4">Loading pending requests...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Pending Requests</h1>
        <Link
          to="/admin-dashboard"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      <p className="mb-4 text-gray-600">
        View all budget requests from cities that are pending approval or have been rejected and need to be resubmitted.
      </p>

      {/* Pending Requests Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-yellow-700">
          Pending Approval ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 italic">No pending requests at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">City</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requester</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{req.request_id}</td>
                    <td className="px-4 py-3 text-sm">{req.city_name}</td>
                    <td className="px-4 py-3 text-sm">{req.month || '—'}</td>
                    <td className="px-4 py-3 text-sm">{req.description || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{req.requester_name || '—'}</div>
                      {req.requester_email && (
                        <div className="text-xs text-gray-500">{req.requester_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          onClick={() => handleApprove(req.request_id)}
                          disabled={processingId === req.request_id}
                        >
                          {processingId === req.request_id ? 'Processing…' : 'Approve'}
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          onClick={() => handleReject(req.request_id)}
                          disabled={processingId === req.request_id}
                        >
                          {processingId === req.request_id ? 'Processing…' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejected Requests Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-red-700">
          Rejected / Needs Resubmission ({rejectedRequests.length})
        </h2>
        {rejectedRequests.length === 0 ? (
          <p className="text-gray-500 italic">No rejected requests at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">City</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requester</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rejected On</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rejectedRequests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{req.request_id}</td>
                    <td className="px-4 py-3 text-sm">{req.city_name}</td>
                    <td className="px-4 py-3 text-sm">{req.month || '—'}</td>
                    <td className="px-4 py-3 text-sm">{req.description || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{req.requester_name || '—'}</div>
                      {req.requester_email && (
                        <div className="text-xs text-gray-500">{req.requester_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {req.updated_at ? new Date(req.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        REJECTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

