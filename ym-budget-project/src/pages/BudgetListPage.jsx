import { useEffect, useState } from "react";
import { fetchBudgetRequests } from "../lib/api";

export default function BudgetListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBudgetRequests()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>My Budget Requests</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Month</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.request_id}>
              <td>{r.request_id}</td>
              <td>{r.month}</td>
              <td>{r.description}</td>
              <td>{r.status}</td>
              <td>{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
