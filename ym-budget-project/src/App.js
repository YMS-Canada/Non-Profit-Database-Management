import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import BudgetForm from './pages/BudgetForm';
import DashBoard from './pages/DashBoard';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import BudgetListPage from "./pages/BudgetListPage";
import NewBudgetPage from "./pages/NewBudgetPage";
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TreasurerDashboard from './pages/TreasurerDashboard';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            {/* Treasurer Routes */}
            <Route path="/treasurer-dashboard" element={
              <ProtectedRoute requiredRole="TREASURER">
                <TreasurerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Budget Routes - Protected */}
            <Route path="/budgets" element={
              <ProtectedRoute>
                <BudgetListPage />
              </ProtectedRoute>
            } />
            <Route path="/budgets/new" element={
              <ProtectedRoute requiredRole="TREASURER">
                <NewBudgetPage />
              </ProtectedRoute>
            } />
            
            {/* Legacy routes */}
            <Route path="/form" element={<BudgetForm />} />
            <Route path="/dashboard" element={<DashBoard />} />
            <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
