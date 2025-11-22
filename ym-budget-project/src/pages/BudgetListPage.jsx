import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBudgetRequests, approveBudgetRequest, rejectBudgetRequest } from "../lib/api";
import './BudgetListPage.css';

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

  if (loading) return <p className="bl-page">Loading…</p>;
  if (error) return <p className="bl-page bl-error">Error: {error}</p>;

  return (
    <div className="bl-page">
      <div className="bl-header">
        <div>
          <h1>Budget Requests</h1>
          <p className="muted">All recent requests. Approve or reject pending items.</p>
        </div>
        <div className="bl-controls">
          <button className="btn ghost" onClick={loadData} disabled={loading}>Refresh</button>
          <Link to="/budgets/new" className="btn primary">New Request</Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No budget requests yet.</div>
      ) : (
        <div className="bl-grid">
          {rows.map((r) => (
            <article key={r.request_id} className="bl-card">
              <header className="bl-card-header">
                <div className="bl-month">{r.month || '—'}</div>
                <div className={`bl-status ${r.status.toLowerCase()}`}>{r.status}</div>
              </header>
              <div className="bl-card-body">
                <h3 className="bl-desc">{r.description || 'No description'}</h3>
                <div className="bl-meta">Requester: <span className="muted">{r.requester || '—'}</span></div>
              </div>
              <footer className="bl-card-actions">
                {r.status === 'PENDING' && role === 'ADMIN' ? (
                  <div className="action-group">
                    <button className="btn success" onClick={() => handleApprove(r.request_id)} disabled={processingId===r.request_id}>{processingId===r.request_id ? '…' : 'Approve'}</button>
                    <button className="btn danger" onClick={() => handleReject(r.request_id)} disabled={processingId===r.request_id}>{processingId===r.request_id ? '…' : 'Reject'}</button>
                  </div>
                ) : (
                  <span className="muted">{r.status}</span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
