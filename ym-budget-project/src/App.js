import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import BudgetForm from './pages/BudgetForm';
import DashBoard from './pages/DashBoard';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import BudgetListPage from "./pages/BudgetListPage";
import NewBudgetPage from "./pages/NewBudgetPage";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<BudgetForm />} />
            <Route path="/dashboard" element={<DashBoard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/budgets" element={<BudgetListPage />} />
            <Route path="/budgets/new" element={<NewBudgetPage />} />
            <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
