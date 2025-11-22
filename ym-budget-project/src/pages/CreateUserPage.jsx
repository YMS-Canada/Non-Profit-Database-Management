import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities, createUser } from '../lib/api';

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
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create User Account</h1>
        <p className="text-gray-600">Create a new user account for ADMIN or TREASURER role</p>
      </div>

      {citiesError && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
          {citiesError}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
          User account created successfully! Redirecting to admin dashboard...
        </div>
      )}

      {loadingCities && cities.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700">
          Loading cities...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp (Optional)
          </label>
          <input
            type="text"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TREASURER">TREASURER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div>
          <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
            required
            disabled={loadingCities}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{loadingCities ? 'Loading cities...' : '-- Select City --'}</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.name} ({city.province})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter secure password"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin-dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          ← Back to Admin Dashboard
        </button>
      </div>
    </div>
  );
}
