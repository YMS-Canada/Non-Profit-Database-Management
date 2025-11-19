// src/lib/api.js
const inferredHost =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : 'http://127.0.0.1:8000';
const API_BASE = process.env.REACT_APP_API_URL || inferredHost;

async function handleResponse(res) {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (res.ok) {
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
    return text;
  }

  const err = new Error(`Request failed (${res.status})`);
  err.status = res.status;
  err.body = text;
  throw err;
}

export async function getBudgetRequests() {
  const res = await fetch(`${API_BASE}/api/budget-requests/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function createBudgetRequest(data) {
  const res = await fetch(`${API_BASE}/api/budget-requests/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function approveBudgetRequest(id) {
  if (id === undefined || id === null) throw new Error('id is required');
  const res = await fetch(`${API_BASE}/api/budget-requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function rejectBudgetRequest(id) {
  if (id === undefined || id === null) throw new Error('id is required');
  const res = await fetch(`${API_BASE}/api/budget-requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}
