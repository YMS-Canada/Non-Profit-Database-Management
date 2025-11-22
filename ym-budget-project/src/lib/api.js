// src/lib/api.js

// Detect if we're in GitHub Codespaces and construct proper API URL
function getApiBaseUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use empty string to leverage proxy in package.json
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Check if we're in GitHub Codespaces (hostname pattern: xxx-3000.app.github.dev)
    if (hostname.includes('app.github.dev') || hostname.includes('github.dev')) {
      // Replace port 3000 with 8000 in the hostname
      const backendHost = hostname.replace('-3000', '-8000');
      return `${protocol}//${backendHost}`;
    }
    
    // Local development
    return `${protocol}//${hostname}:8000`;
  }
  
  return 'http://127.0.0.1:8000';
}

const API_BASE = getApiBaseUrl();
console.log('API_BASE URL:', API_BASE);

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

// ---------- Auth API ----------

export async function login(email, password) {
  console.log('Attempting login to:', `${API_BASE}/api/login/`);
  
  try {
    const res = await fetch(`${API_BASE}/api/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', res.status);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Invalid email or password');
    }

    const data = await handleResponse(res);
    const user = data.user || data;
    localStorage.setItem('user', JSON.stringify(user));
    return { user };
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

export async function logout() {
  const res = await fetch(`${API_BASE}/logout/`, {
    method: 'GET',
    credentials: 'include',
  });
  
  localStorage.removeItem('user');
  return res.ok;
}

export async function getCurrentUser() {
  // Check localStorage first
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem('user');
    }
  }

  // If not in localStorage, verify session with backend
  const res = await fetch(`${API_BASE}/api/current-user/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  if (res.ok) {
    const data = await handleResponse(res);
    const user = data.user || data; // Handle both nested and flat response
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  throw new Error('Not authenticated');
}

// ---------- Budget API ----------

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
  const res = await fetch(`${API_BASE}/api/budget-requests/${encodeURIComponent(id)}/approve/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function rejectBudgetRequest(id) {
  if (id === undefined || id === null) throw new Error('id is required');
  const res = await fetch(`${API_BASE}/api/budget-requests/${encodeURIComponent(id)}/reject/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

// ---------- Dashboard API ----------

export async function getAdminDashboard() {
  const res = await fetch(`${API_BASE}/api/admin/dashboard/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function getTreasurerDashboard() {
  const res = await fetch(`${API_BASE}/api/treasurer/dashboard/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function getPendingRequests() {
  const res = await fetch(`${API_BASE}/api/admin/pending-requests/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

// ---------- User Management API ----------

export async function getCities() {
  const res = await fetch(`${API_BASE}/api/cities/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(res);
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/api/admin/users/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}
