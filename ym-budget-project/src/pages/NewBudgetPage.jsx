import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBudgetRequest } from "../lib/api";

const emptyLine = () => ({ description: "", amount: "" });

export default function NewBudgetPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [description, setDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLine(index, field, value) {
    setLines((prev) =>
      prev.map((line, idx) => (idx === index ? { ...line, [field]: value } : line))
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!month || !eventName || !eventDate) {
      setError("Month, event name, and event date are required.");
      return;
    }

    const breakdown = lines
      .filter((line) => line.description.trim() || line.amount)
      .map((line) => ({
        category_id: null,
        description: line.description.trim(),
        amount: line.amount ? parseFloat(line.amount) : null,
      }));

    const payload = {
      month,
      description,
      event: {
        name: eventName,
        event_date: eventDate,
        notes: eventNotes,
      },
      breakdown,
    };

    setSubmitting(true);
    try {
      await createBudgetRequest(payload);
      navigate("/budgets");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">New Budget Request</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="font-semibold mb-2">Request Details</h2>
          <label className="block text-sm font-medium">Month</label>
          <input
            type="date"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="border rounded w-full px-3 py-2 mb-3"
          />

          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded w-full px-3 py-2"
          />
        </section>

        <section>
          <h2 className="font-semibold mb-2">Event</h2>
          <label className="block text-sm font-medium">Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="border rounded w-full px-3 py-2 mb-3"
          />

          <label className="block text-sm font-medium">Event Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="border rounded w-full px-3 py-2 mb-3"
          />

          <label className="block text-sm font-medium">Event Notes</label>
          <textarea
            value={eventNotes}
            onChange={(e) => setEventNotes(e.target.value)}
            rows={3}
            className="border rounded w-full px-3 py-2"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Breakdown Lines</h2>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-indigo-600"
            >
              + Add line
            </button>
          </div>

          {lines.map((line, idx) => (
            <div key={idx} className="border rounded p-3 mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <strong>Line {idx + 1}</strong>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                className="border rounded w-full px-3 py-2"
              />
              <label className="block text-sm font-medium">Amount (CAD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onChange={(e) => updateLine(idx, "amount", e.target.value)}
                className="border rounded w-full px-3 py-2"
              />
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
          <button
            type="button"
            className="border px-4 py-2 rounded"
            onClick={() => navigate("/budgets")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
