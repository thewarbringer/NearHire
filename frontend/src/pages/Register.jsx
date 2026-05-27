import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        alert('Registration successful! Please sign in.');
        navigate('/signinUser');
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch {
      setErrors({ submit: 'An error occurred. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080a] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#f0ede8] mb-6 text-center">Create Account</h2>

          {errors.submit && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-400 rounded">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0d0d0d] border rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0d0d0d] border rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0d0d0d] border rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0d0d0d] border rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0d0d0d] border rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mt-6 transition duration-200"
            >
              Register
            </button>
          </form>

          <p className="mt-4 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <a
              href="/signinUser"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
