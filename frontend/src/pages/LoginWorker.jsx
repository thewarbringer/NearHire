import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function LoginWorker() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'worker');
        navigate('/workerDashboard');
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Login failed' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080a] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 border border-white/5">
          <h2 className="font-[DMSerifDisplay] text-3xl font-bold text-[#f0ede8] mb-6 text-center tracking-tight">Worker Login</h2>

          {errors.submit && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-400 rounded-lg">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.email ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="worker@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.password ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5DCAA5] hover:bg-[#4ab891] disabled:bg-[#5DCAA5]/50 text-[#03261d] font-bold py-3 px-4 rounded-lg mt-6 transition duration-200 uppercase tracking-[0.15em]"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-[#a8a49d] text-sm">
            Don't have an account?{' '}
            <a
              href="/registerWorker"
              className="text-[#5DCAA5] hover:text-[#4ab891] font-medium"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
