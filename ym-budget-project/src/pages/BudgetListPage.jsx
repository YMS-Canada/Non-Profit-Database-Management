import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBudgetRequests, approveBudgetRequest, rejectBudgetRequest } from "../lib/api";

// BudgetListPage: loads budget requests and shows approve/reject for admins

export default function BudgetListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Try to read role from localStorage; allow override via window.__USER_ROLE
  const roleFromStorage = typeof window !== 'undefined' && (localStorage.getItem('role') || window.__USER_ROLE);
  const role = roleFromStorage || null;

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBudgetRequests();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(id) {
    setProcessingId(id);
    try {
      await approveBudgetRequest(id);
      await loadData();
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
      await loadData();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Budget Requests</h1>
        <div className="flex gap-2">
          <button
            className="border px-3 py-1 rounded"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
          <Link
            to="/budgets/new"
            className="bg-indigo-600 text-white px-4 py-1 rounded"
          >
            New Request
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Requester</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                  No budget requests yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.request_id}>
                <td className="px-4 py-2 text-sm text-gray-800">{r.month}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{r.description}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{r.requester || '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  {r.status === 'PENDING' && role === 'ADMIN' ? (
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                        onClick={() => handleApprove(r.request_id)}
                        disabled={processingId === r.request_id}
                      >
                        {processingId === r.request_id ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                        onClick={() => handleReject(r.request_id)}
                        disabled={processingId === r.request_id}
                      >
                        {processingId === r.request_id ? 'Processing…' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
