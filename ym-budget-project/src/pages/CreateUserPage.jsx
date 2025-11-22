import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities, createUser } from '../lib/api';
import './CreateUserPage.css';

export default function CreateUserPage() {
  console.log('CreateUserPage component rendering');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [citiesError, setCitiesError] = useState(null);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'TREASURER',
    city_id: '',
    password: '',
  });

  useEffect(() => {
    async function loadCities() {
      setLoadingCities(true);
      setCitiesError(null);
      try {
        const data = await getCities();
        setCities(Array.isArray(data.cities) ? data.cities : []);
      } catch (err) {
        setCitiesError('Failed to load cities: ' + (err.message || String(err)));
        console.error('Error loading cities:', err);
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }
    if (!formData.city_id) {
      setError('City is required');
      return;
    }
    if (formData.role !== 'ADMIN' && formData.role !== 'TREASURER') {
      setError('Role must be ADMIN or TREASURER');
      return;
    }

    setLoading(true);
    try {
      await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim() || null,
        role: formData.role,
        city_id: parseInt(formData.city_id),
        password: formData.password,
      });
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        whatsapp: '',
        role: 'TREASURER',
        city_id: '',
        password: '',
      });
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-user-container">
      <div className="page-header">
        <h1>Create User Account</h1>
        <p className="muted">Create a new user account for ADMIN or TREASURER role</p>
      </div>

      {citiesError && <div className="notice warning">{citiesError}</div>}

      {error && <div className="notice error">{error}</div>}

      {success && <div className="notice success">User account created successfully! Redirecting...</div>}

      {loadingCities && cities.length === 0 && <div className="notice info">Loading cities...</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
          <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Full name"
          />
        </div>

        <div className="form-row">
          <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="user@example.com"
          />
        </div>

        <div className="form-row">
          <label htmlFor="whatsapp" className="form-label">WhatsApp (Optional)</label>
          <input
            type="text"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="form-input"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className="form-row"> 
          <label htmlFor="role" className="form-label">Role <span className="required">*</span></label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required className="form-input">
            <option value="TREASURER">TREASURER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="city_id" className="form-label">City <span className="required">*</span></label>
          <select id="city_id" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={loadingCities} className="form-input">
            <option value="">{loadingCities ? 'Loading cities...' : '-- Select City --'}</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>{city.name} ({city.province})</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="password" className="form-label">Password <span className="required">*</span></label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="form-input" placeholder="Enter secure password" />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn primary">{loading ? 'Creating...' : 'Create Account'}</button>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="btn secondary">Cancel</button>
        </div>
      </form>

      <div className="back-link">
        <button onClick={() => navigate('/admin-dashboard')} className="link">← Back to Admin Dashboard</button>
      </div>
    </div>
  );
}
