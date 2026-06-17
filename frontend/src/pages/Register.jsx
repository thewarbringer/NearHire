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
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-8 md:p-10 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Create Account</h2>
            <p className="text-[#C21A4B] text-xs font-bold tracking-widest uppercase mt-2">Join NearHire Today</p>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-xl font-medium text-sm">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                  errors.fullName ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                  errors.email ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                  errors.phone ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                  errors.password ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                  errors.confirmPassword ? 'border-red-500' : 'border-zinc-300'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3.5 px-6 rounded-xl mt-6 transition duration-300 shadow-md uppercase tracking-[0.15em]"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm font-medium">
            Already have an account?{' '}
            <a
              href="/signinUser"
              className="text-[#C21A4B] hover:text-[#A1133C] font-semibold transition duration-200"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
