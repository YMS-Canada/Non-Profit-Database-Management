import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingRequests } from '../lib/api';
import './PendingRequestsPage.css';

export default function PendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);

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

  // Separate requests by status
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  if (loading) return <div className="pr-page p-4">Loading pending requests...</div>;
  if (error) return <div className="pr-page p-4 pr-error">Error: {error}</div>;

  return (
    <div className="pr-page">
      <div className="pr-header">
        <div>
          <h1>Pending Requests</h1>
          <p className="muted">Review and approve or reject budget requests from cities.</p>
        </div>
        <div className="pr-actions">
          <Link to="/admin-dashboard" className="btn btn-back">← Dashboard</Link>
        </div>
      </div>

      <section className="pr-section">
        <h2>Pending Approval <span className="count">{pendingRequests.length}</span></h2>
        {pendingRequests.length === 0 ? (
          <div className="empty">No pending requests at this time.</div>
        ) : (
          <div className="card-grid">
            {pendingRequests.map((req) => (
              <article key={req.request_id} className="req-card">
                <div className="req-top">
                  <div className="req-id">#{req.request_id}</div>
                  <div className="req-city">{req.city_name}</div>
                </div>
                <div className="req-body">
                  <div className="req-item"><strong>Date:</strong> {req.month || '—'}</div>
                  <div className="req-item"><strong>Amount:</strong> {req.amount ? `$${req.amount.toFixed(2)}` : '—'}</div>
                  <div className="req-desc">{req.description || 'No description provided.'}</div>
                </div>
                <div className="req-meta">
                  <div className="requester">{req.requester_name || '—'}</div>
                  <div className="small muted">{req.requester_email || ''}</div>
                  <div className="small muted">Submitted: {formatDate(req.created_at)}</div>
                </div>
                <div className="req-actions">
                  <Link to={`/admin/requests/${req.request_id}`} state={{ from: '/admin/pending-requests' }} className="view-link">View & Review</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pr-section">
        <h2>Rejected / Needs Resubmission <span className="count">{rejectedRequests.length}</span></h2>
        {rejectedRequests.length === 0 ? (
          <div className="empty">No rejected requests at this time.</div>
        ) : (
          <div className="card-grid">
            {rejectedRequests.map((req) => (
              <article key={req.request_id} className="req-card muted-card">
                <div className="req-top">
                  <div className="req-id">#{req.request_id}</div>
                  <div className="req-city">{req.city_name}</div>
                </div>
                <div className="req-body">
                  <div className="req-item"><strong>Date:</strong> {req.month || '—'}</div>
                  <div className="req-item"><strong>Amount:</strong> {req.amount ? `$${req.amount.toFixed(2)}` : '—'}</div>
                  <div className="req-desc">{req.description || 'No description provided.'}</div>
                </div>
                <div className="req-meta">
                  <div className="requester">{req.requester_name || '—'}</div>
                  <div className="small muted">Rejected: {formatDate(req.updated_at)}</div>
                </div>
                <div className="req-actions">
                  <span className="status rejected">REJECTED</span>
                  <Link to={`/admin/requests/${req.request_id}`} state={{ from: '/admin/pending-requests' }} className="view-link">View</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

