import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPendingRequests, approveBudgetRequest, rejectBudgetRequest } from '../lib/api';

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

  if (loading) return <div className="p-4">Loading request…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!request) return <div className="p-4">No request found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Review Request #{request.request_id}</h1>
      <div className="mb-4">
        <div><strong>City:</strong> {request.city_name}</div>
        <div><strong>Month:</strong> {request.month}</div>
        <div><strong>Description:</strong> {request.description}</div>
        <div><strong>Requester:</strong> {request.requester_name} {request.requester_email ? `(${request.requester_email})` : ''}</div>
        <div><strong>Submitted:</strong> {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}</div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleApprove} disabled={processing} className="bg-green-600 text-white px-4 py-2 rounded">
          {processing ? 'Processing…' : 'Approve'}
        </button>
        <button onClick={handleReject} disabled={processing} className="bg-red-600 text-white px-4 py-2 rounded">
          {processing ? 'Processing…' : 'Reject'}
        </button>
        <button onClick={() => navigate('/admin/pending-requests')} className="px-4 py-2 border rounded">
          Back
        </button>
      </div>
    </div>
  );
}
