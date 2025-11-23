import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBudgetRequestDetail, approveBudgetRequest, rejectBudgetRequest, deleteBudgetRequest, getCurrentUser } from '../lib/api';
import './RequestDetailPage.css';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = location.state?.from || '/admin/pending-requests';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentAction, setCommentAction] = useState(null); // 'approve' or 'reject'
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const currentUser = await getCurrentUser();
        const data = await getBudgetRequestDetail(id);
        if (mounted) {
          setUser(currentUser);
          setRequest(data);
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

  function openCommentModal(action) {
    setCommentAction(action);
    setComment('');
    setCommentError('');
    setShowCommentModal(true);
  }

  function closeCommentModal() {
    setShowCommentModal(false);
    setCommentAction(null);
    setComment('');
    setCommentError('');
  }

  async function handleSubmitWithComment() {
    setProcessing(true);
    try {
      if (commentAction === 'approve') {
        await approveBudgetRequest(id, comment.trim() || undefined);
      } else if (commentAction === 'reject') {
        await rejectBudgetRequest(id, comment.trim() || undefined);
      }
      navigate(fromPage);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessing(false);
      closeCommentModal();
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    setProcessing(true);
    try {
      await deleteBudgetRequest(id);
      navigate(fromPage);
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
            <button onClick={() => navigate(fromPage)} className="rd-btn rd-back">Back</button>
          </div>
        </header>

        <section className="rd-grid">
          <div className="rd-info">
            <dl>
              <dt>Status</dt>
              <dd><span className={`rd-status rd-status-${request.status?.toLowerCase()}`}>{request.status || '—'}</span></dd>

              <dt>Date</dt>
              <dd>{request.month || '—'}</dd>

              <dt>Amount Requested</dt>
              <dd className="rd-amount">${(request.event?.total_amount || request.breakdown_lines?.reduce((sum, line) => sum + (line.amount || 0), 0) || 0).toFixed(2)}</dd>

              <dt>Created</dt>
              <dd>{request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}</dd>
            </dl>
          </div>

          <div className="rd-description">
            <h3>Description</h3>
            <p>{request.description || 'No description provided.'}</p>
          </div>
        </section>

        {request.event_name && (
          <section className="rd-event">
            <h3>Event Details</h3>
            <dl>
              <dt>Event Name</dt>
              <dd>{request.event_name}</dd>

              {request.event_date && (
                <>
                  <dt>Event Date</dt>
                  <dd>{new Date(request.event_date).toLocaleDateString()}</dd>
                </>
              )}

              {request.event_notes && (
                <>
                  <dt>Event Notes</dt>
                  <dd>{request.event_notes}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        {request.breakdown_lines && request.breakdown_lines.length > 0 && (
          <section className="rd-breakdown">
            <h3>Budget Breakdown</h3>
            <table className="rd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th className="rd-amount-col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {request.breakdown_lines.map((line) => (
                  <tr key={line.line_number}>
                    <td>{line.line_number}</td>
                    <td>{line.description}</td>
                    <td className="rd-amount-col">${line.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><strong>Total</strong></td>
                  <td className="rd-amount-col"><strong>${(request.event?.total_amount || request.breakdown_lines?.reduce((sum, line) => sum + (line.amount || 0), 0) || 0).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        {request.status === 'PENDING' && user?.role === 'ADMIN' && (
          <footer className="rd-actions">
            <div className="rd-action-left">
              <button onClick={() => openCommentModal('approve')} disabled={processing} className="rd-btn rd-approve">{processing ? 'Processing…' : 'Approve'}</button>
              <button onClick={() => openCommentModal('reject')} disabled={processing} className="rd-btn rd-reject">{processing ? 'Processing…' : 'Reject'}</button>
              <button onClick={handleDelete} disabled={processing} className="rd-btn rd-delete">{processing ? 'Processing…' : 'Delete'}</button>
            </div>
          </footer>
        )}
        {request.status === 'REJECTED' && user?.role === 'ADMIN' && (
          <footer className="rd-actions">
            <div className="rd-action-left">
              <button onClick={handleDelete} disabled={processing} className="rd-btn rd-delete">{processing ? 'Processing…' : 'Delete'}</button>
            </div>
          </footer>
        )}
      </div>

      {showCommentModal && (
        <div className="rd-modal-overlay" onClick={closeCommentModal}>
          <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{commentAction === 'approve' ? 'Approve Request' : 'Reject Request'}</h2>
            <label className="rd-comment-label">Comment</label>
            <textarea
              className="rd-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder=""
              rows="4"
            />
            <div className="rd-modal-actions">
              <button onClick={closeCommentModal} className="rd-btn rd-secondary">Cancel</button>
              <button 
                onClick={handleSubmitWithComment} 
                className={`rd-btn ${commentAction === 'approve' ? 'rd-approve' : 'rd-reject'}`}
                disabled={processing}
              >
                {processing ? 'Processing…' : (commentAction === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
