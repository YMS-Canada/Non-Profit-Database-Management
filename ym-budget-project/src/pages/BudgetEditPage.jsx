import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBudgetRequestDetail, updateBudgetRequest, getCurrentUser } from "../lib/api";
import "./BudgetListPage.css";

export default function BudgetEditPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Function to go back to budget list
  const goBack = () => {
    navigate('/budgets');
  };
  
  const [month, setMonth] = useState('');
  const [description, setDescription] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [breakdownLines, setBreakdownLines] = useState([
    { category_id: '', description: '', amount: '' }
  ]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'TREASURER') {
          navigate('/login');
          return;
        }
        setUser(currentUser);

        const detail = await getBudgetRequestDetail(requestId);
        
        console.log('Loaded detail:', detail);
        console.log('Breakdown lines:', detail.breakdown_lines);
        
        // Populate form with existing data
        setMonth(detail.month || '');
        setDescription(detail.description || '');
        setEventName(detail.event?.name || '');
        setEventDate(detail.event?.event_date || '');
        setEventNotes(detail.event?.notes || '');
        setAdminComment(detail.admin_comment || '');
        
        if (detail.breakdown_lines && detail.breakdown_lines.length > 0) {
          const populated = detail.breakdown_lines.map(line => {
            console.log('Processing line:', line);
            return {
              category_id: line.category_id || '',
              description: line.description || '',
              amount: (line.amount !== null && line.amount !== undefined) ? String(line.amount) : ''
            };
          });
          console.log('Populated breakdown lines:', populated);
          setBreakdownLines(populated);
        } else {
          console.log('No breakdown lines found, using default');
          setBreakdownLines([{ category_id: '', description: '', amount: '' }]);
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requestId, navigate]);

  function addLine() {
    setBreakdownLines([...breakdownLines, { category_id: '', description: '', amount: '' }]);
  }

  function removeLine(index) {
    if (breakdownLines.length === 1) return;
    setBreakdownLines(breakdownLines.filter((_, i) => i !== index));
  }

  function updateLine(index, field, value) {
    const updated = [...breakdownLines];
    updated[index][field] = value;
    setBreakdownLines(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!month || !eventName || !eventDate) {
      setError('Month, event name, and event date are required.');
      return;
    }

    setSubmitting(true);
    
    try {
      const validBreakdown = breakdownLines
        .filter(line => line.description || line.amount)
        .map(line => ({
          category_id: line.category_id || null,
          description: line.description || '',
          amount: parseFloat(line.amount) || 0
        }));

      if (validBreakdown.length === 0) {
        setError('At least one breakdown line is required.');
        setSubmitting(false);
        return;
      }

      console.log('Submitting update:', {
        month,
        description,
        event: {
          name: eventName,
          event_date: eventDate,
          notes: eventNotes
        },
        breakdown: validBreakdown
      });

      const response = await updateBudgetRequest(requestId, {
        month,
        description,
        event: {
          name: eventName,
          event_date: eventDate,
          notes: eventNotes
        },
        breakdown: validBreakdown
      });
      
      console.log('Update response:', response);
      
      // Success - show modal instead of navigating immediately
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || String(err));
      setSubmitting(false);
    }
  }
  
  function handleSuccessClose() {
    setShowSuccessModal(false);
    navigate('/budgets', { replace: true });
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px', textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '16px' }}>Loading request details...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px' }}>
        <div style={{ padding: '12px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', borderLeft: '4px solid #dc3545' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px', background: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #6a1b9a', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', color: '#6a1b9a', fontSize: '28px', fontWeight: '600' }}>Edit & Resubmit Budget Request</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>Update your request and resubmit for approval</p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #dc3545' }}>
          {error}
        </div>
      )}

      {adminComment && (
        <div style={{ padding: '16px', background: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #ffc107' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Admin Comment:</div>
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{adminComment}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Request Details */}
        <fieldset style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', background: '#fafafa' }}>
          <legend style={{ fontWeight: 'bold', color: '#6a1b9a', padding: '0 10px', fontSize: '16px' }}>Request Details</legend>
          
          <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
            Month <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="date"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of the budget request"
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit' }}
          />
        </fieldset>

        {/* Event Information */}
        <fieldset style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', background: '#fafafa' }}>
          <legend style={{ fontWeight: 'bold', color: '#6a1b9a', padding: '0 10px', fontSize: '16px' }}>Event Information</legend>
          
          <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
            Event Name <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            placeholder="e.g., Youth Conference 2025"
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
            Event Date <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
            Event Notes (Optional)
          </label>
          <textarea
            value={eventNotes}
            onChange={(e) => setEventNotes(e.target.value)}
            rows={3}
            placeholder="Additional information about the event"
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit' }}
          />
        </fieldset>

        {/* Budget Breakdown */}
        <fieldset style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', background: '#fafafa' }}>
          <legend style={{ fontWeight: 'bold', color: '#6a1b9a', padding: '0 10px', fontSize: '16px' }}>Budget Breakdown</legend>
          <p style={{ color: '#666', marginTop: '0', fontSize: '14px' }}>
            Update line items for your budget breakdown.
          </p>

          {breakdownLines.map((line, idx) => (
            <div key={idx} style={{ background: 'white', border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>Line Item {idx + 1}</div>
                {breakdownLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    style={{ padding: '4px 12px', border: 'none', background: '#dc3545', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500', fontSize: '14px' }}>
                Description
              </label>
              <input
                type="text"
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                placeholder="e.g., Food and beverages"
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
              />

              <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500', fontSize: '14px' }}>
                Amount (CAD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onChange={(e) => updateLine(idx, "amount", e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            style={{ padding: '8px 16px', border: '1px solid #6a1b9a', background: 'transparent', color: '#6a1b9a', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            + Add Line Item
          </button>
        </fieldset>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn primary"
            style={{ padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: submitting ? 'not-allowed' : 'pointer', background: '#6a1b9a', color: 'white', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Updating…" : "Update & Resubmit"}
          </button>
          <button
            type="button"
            className="btn btn-back"
            onClick={goBack}
            style={{ padding: '12px 24px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', background: 'transparent', color: '#333', fontWeight: 'bold' }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Back Links */}
      <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <button 
          onClick={goBack}
          className="btn btn-back"
          style={{ marginRight: '10px', textDecoration: 'none', color: '#6a1b9a', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Back
        </button>
        <span style={{ color: '#ddd' }}>|</span>
        <button 
          onClick={() => navigate("/treasurer-dashboard")}
          style={{ marginLeft: '10px', textDecoration: 'none', color: '#6a1b9a', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Dashboard
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', color: '#4caf50', marginBottom: '10px' }}>✓</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '24px' }}>Successfully Resubmitted!</h2>
              <p style={{ color: '#666', margin: 0 }}>Your budget request has been updated and is now pending approval.</p>
            </div>
            <button
              onClick={handleSuccessClose}
              style={{ width: '100%', padding: '12px', background: '#6a1b9a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Back to Budget Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
