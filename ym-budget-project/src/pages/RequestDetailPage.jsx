import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPendingRequests, approveBudgetRequest, rejectBudgetRequest } from '../lib/api';
import './RequestDetailPage.css';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPendingRequests();
        const list = Array.isArray(data.requests) ? data.requests : (data || []);
        const found = list.find((r) => String(r.request_id) === String(id));
        if (!found) {
          setError('Request not found');
        } else if (mounted) {
          setRequest(found);
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function handleApprove() {
    setProcessing(true);
    try {
      await approveBudgetRequest(id);
      navigate('/admin/pending-requests');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    setProcessing(true);
    try {
      await rejectBudgetRequest(id);
      navigate('/admin/pending-requests');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div className="rd-page rd-loading">Loading request…</div>;
  if (error) return <div className="rd-page rd-error">Error: {error}</div>;
  if (!request) return <div className="rd-page rd-empty">No request found</div>;

  return (
    <div className="rd-page">
      <div className="rd-card">
        <header className="rd-header">
          <div>
            <h1>Review Request <span className="rd-hash">#{request.request_id}</span></h1>
            <p className="rd-sub">Submitted: {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}</p>
          </div>
          <div className="rd-header-actions">
            <button onClick={() => navigate('/admin/pending-requests')} className="rd-btn rd-back">Back</button>
          </div>
        </header>

        <section className="rd-grid">
          <div className="rd-info">
            <dl>
              <dt>City</dt>
              <dd>{request.city_name || '—'}</dd>

              <dt>Month</dt>
              <dd>{request.month || '—'}</dd>

              <dt>Requester</dt>
              <dd>{request.requester_name || '—'} {request.requester_email ? <span className="rd-email">({request.requester_email})</span> : null}</dd>
            </dl>
          </div>

          <div className="rd-description">
            <h3>Description</h3>
            <p>{request.description || 'No description provided.'}</p>
          </div>
        </section>

        <footer className="rd-actions">
          <div className="rd-action-left">
            <button onClick={handleApprove} disabled={processing} className="rd-btn rd-approve">{processing ? 'Processing…' : 'Approve'}</button>
            <button onClick={handleReject} disabled={processing} className="rd-btn rd-reject">{processing ? 'Processing…' : 'Reject'}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
