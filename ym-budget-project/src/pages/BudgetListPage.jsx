import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBudgetRequests, approveBudgetRequest, rejectBudgetRequest, deleteBudgetRequest, getCurrentUser } from "../lib/api";
import './BudgetListPage.css';

// BudgetListPage: loads budget requests and shows approve/reject for admins, edit/delete for treasurers

export default function BudgetListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [user, setUser] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentAction, setCommentAction] = useState(null); // { type: 'approve'|'reject', requestId: number }
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
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

  function openCommentModal(type, requestId) {
    setCommentAction({ type, requestId });
    setComment('');
    setShowCommentModal(true);
  }

  function closeCommentModal() {
    setShowCommentModal(false);
    setCommentAction(null);
    setComment('');
  }

  async function handleApproveWithComment() {
    if (!commentAction) return;
    setProcessingId(commentAction.requestId);
    try {
      await approveBudgetRequest(commentAction.requestId, comment);
      closeCommentModal();
      await loadData();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectWithComment() {
    if (!commentAction) return;
    
    // Require comment for rejection
    if (!comment.trim()) {
      setError('Please provide a reason for rejection to help the requester.');
      return;
    }
    
    setProcessingId(commentAction.requestId);
    try {
      await rejectBudgetRequest(commentAction.requestId, comment);
      closeCommentModal();
      await loadData();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    setProcessingId(id);
    try {
      await deleteBudgetRequest(id);
      await loadData();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <p className="bl-page">Loading…</p>;
  if (error) return <p className="bl-page bl-error">Error: {error}</p>;

  const role = user?.role;
  const userId = user?.user_id;

  return (
    <div className="bl-page">
      <div className="bl-header">
        <div>
          <h1>Budget Requests</h1>
          <p className="muted">All recent requests. Approve or reject pending items.</p>
        </div>
        <div className="bl-controls">
          <Link to="/admin-dashboard" className="btn btn-back">← Dashboard</Link>
          <button className="btn ghost" onClick={loadData} disabled={loading}>Refresh</button>
          {role === 'TREASURER' && (
            <Link to="/budgets/new" className="btn primary">New Request</Link>
          )}
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
                {role === 'ADMIN' ? (
                  <div className="action-group">
                    <Link to={`/admin/requests/${r.request_id}`} state={{ from: '/budgets' }} className="view-link">View Details</Link>
                    {(r.status === 'PENDING' || r.status === 'REJECTED') && (
                      <button className="btn danger" onClick={() => handleDelete(r.request_id)} disabled={processingId===r.request_id}>{processingId===r.request_id ? '…' : 'Delete'}</button>
                    )}
                  </div>
                ) : role === 'TREASURER' && r.requester_id === userId ? (
                  r.status === 'REJECTED' ? (
                    <div className="action-group">
                      <button className="btn primary" onClick={() => navigate(`/budgets/${r.request_id}/edit`, { state: { from: '/budgets' } })} disabled={processingId===r.request_id}>Edit & Resubmit</button>
                      <button className="btn danger" onClick={() => handleDelete(r.request_id)} disabled={processingId===r.request_id}>{processingId===r.request_id ? '…' : 'Delete'}</button>
                    </div>
                  ) : r.status === 'PENDING' ? (
                    <div className="action-group">
                      <button className="btn danger" onClick={() => handleDelete(r.request_id)} disabled={processingId===r.request_id}>{processingId===r.request_id ? '…' : 'Delete'}</button>
                    </div>
                  ) : (
                    <span className="muted">{r.status}</span>
                  )
                ) : (
                  <span className="muted">{r.status}</span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay" onClick={closeCommentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{commentAction?.type === 'approve' ? 'Approve Budget Request' : 'Reject Budget Request'}</h2>
            <p>
              {commentAction?.type === 'approve' 
                ? 'Add an optional note for the requester:' 
                : 'Please explain why this request is being rejected (required):'}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                commentAction?.type === 'approve'
                  ? 'e.g., Approved with full budget allocation...'
                  : 'e.g., Please provide more detailed breakdown of expenses, or This exceeds the monthly budget limit...'
              }
              rows="5"
              className={commentAction?.type === 'reject' ? 'required-field' : ''}
              style={{ width: '100%', padding: '10px', marginTop: '10px', marginBottom: '15px' }}
            />
            {commentAction?.type === 'reject' && !comment.trim() && (
              <p className="error-hint" style={{ color: '#ef4444', fontSize: '13px', marginTop: '-10px', marginBottom: '10px' }}>
                * Comment is required for rejection to help the requester understand what needs to be changed.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn ghost" onClick={closeCommentModal}>Cancel</button>
              <button 
                className={`btn ${commentAction?.type === 'approve' ? 'success' : 'danger'}`}
                onClick={commentAction?.type === 'approve' ? handleApproveWithComment : handleRejectWithComment}
                disabled={processingId !== null}
              >
                {processingId !== null ? 'Processing...' : (commentAction?.type === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
