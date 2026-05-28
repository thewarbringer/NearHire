import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function RegisterWorker() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '',
    preferredLocation: '',
  });

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationStatus('');
      return;
    }

    setLocationError('');
    setLocationStatus('Requesting current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('Location captured successfully.');
      },
      () => {
        setLocationError('Unable to retrieve location. Please allow access and try again.');
        setLocationStatus('');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
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

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    if (!formData.preferredLocation.trim()) {
      newErrors.preferredLocation = 'Preferred location is required';
    }

    if (coordinates.lat == null || coordinates.lng == null) {
      newErrors.coordinates = 'Current location is required';
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
      const response = await fetch(`${API_BASE}/api/auth/register-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          specialization: formData.specialization,
          preferredLocation: formData.preferredLocation,
          coordinates,
        }),
      });

      if (response.ok) {
        alert('Registration successful! Please sign in.');
        navigate('/signinWorker');
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Worker registration submit error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080a] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 border border-white/5">
          <h2 className="font-[DMSerifDisplay] text-3xl font-bold text-[#f0ede8] mb-6 text-center tracking-tight">Register as Worker</h2>

          {errors.submit && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-400 rounded">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.name ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.age ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="25"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-400">{errors.age}</p>
              )}
            </div>

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
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.phone ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.specialization ? 'border-red-500' : 'border-white/10'
                }`}
              >
                <option value="">Select your specialization</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electricity">Electricity</option>
                <option value="House Help">House Help</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Painting">Painting</option>
              </select>
              {errors.specialization && (
                <p className="mt-1 text-sm text-red-400">{errors.specialization}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Preferred Location
              </label>
              <input
                type="text"
                name="preferredLocation"
                value={formData.preferredLocation}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.preferredLocation ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="e.g., New York, Downtown Area"
              />
              {errors.preferredLocation && (
                <p className="mt-1 text-sm text-red-400">{errors.preferredLocation}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-[#f0ede8] uppercase tracking-[0.15em]">
                  Current Location
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm text-[#5DCAA5] hover:text-[#4ab891]"
                >
                  Use current location
                </button>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-sm text-[#a8a49d]">
                {locationStatus || locationError || 'Click the button to capture your current coordinates.'}
              </div>
              {errors.coordinates && (
                <p className="mt-1 text-sm text-red-400">{errors.coordinates}</p>
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

            <div>
              <label className="block text-sm font-bold text-[#f0ede8] mb-2 uppercase tracking-[0.15em]">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0d0d0d] border rounded-lg text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#5DCAA5] hover:bg-[#4ab891] text-[#03261d] font-bold py-3 px-4 rounded-lg mt-6 transition duration-200 uppercase tracking-[0.15em]"
            >
              Register
            </button>
          </form>

          <p className="mt-4 text-center text-[#a8a49d] text-sm">
            Already have an account?{' '}
            <a
              href="/signinWorker"
              className="text-[#5DCAA5] hover:text-[#4ab891] font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
