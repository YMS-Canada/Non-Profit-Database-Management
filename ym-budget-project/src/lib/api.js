// src/lib/api.js
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export async function fetchBudgetRequests() {
  const res = await fetch(`${API_URL}/api/budget-requests/`, {
    method: "GET",
    credentials: "include", // send Django session cookie
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
