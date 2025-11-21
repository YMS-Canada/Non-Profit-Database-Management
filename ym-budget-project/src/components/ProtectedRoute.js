import React from 'react';
import { Navigate } from 'react-router-dom';

// Component to protect routes that require authentication
export function ProtectedRoute({ children, requiredRole = null }) {
  const storedUser = localStorage.getItem('user');
  
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    
    // If a specific role is required, check it
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      if (user.role === 'ADMIN') {
        return <Navigate to="/admin-dashboard" replace />;
      } else if (user.role === 'TREASURER') {
        return <Navigate to="/treasurer-dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
    
    return children;
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}

// Component to redirect authenticated users away from login page
export function PublicRoute({ children }) {
  const storedUser = localStorage.getItem('user');
  
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      
      // Redirect to appropriate dashboard based on role
      if (user.role === 'ADMIN') {
        return <Navigate to="/admin-dashboard" replace />;
      } else if (user.role === 'TREASURER') {
        return <Navigate to="/treasurer-dashboard" replace />;
      }
    } catch (e) {
      localStorage.removeItem('user');
    }
  }
  
  return children;
}
