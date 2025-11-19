const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export async function fetchBudgetRequests() {
  const res = await fetch(`${API_URL}/api/budget-requests/`, {
    credentials: "include", // if using Django session auth
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}
