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
    <div className="h-screen bg-black flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-4xl h-[93vh] flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-8 md:p-10 flex flex-col h-full min-h-0 space-y-5">
          <div className="text-center shrink-0">
            <h2 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Worker Registration</h2>
            <p className="text-[#C21A4B] text-xs font-bold tracking-widest uppercase mt-2">Become a provider on NearHire</p>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-xl font-medium text-sm shrink-0">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-5 min-h-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                    errors.name ? 'border-red-500' : 'border-zinc-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                    errors.age ? 'border-red-500' : 'border-zinc-300'
                  }`}
                  placeholder="25"
                />
                {errors.age && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                  Email Address
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
                  Specialization
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                    errors.specialization ? 'border-red-500' : 'border-zinc-300'
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
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.specialization}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-[0.15em]">
                  Preferred Location
                </label>
                <input
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 bg-white border rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium ${
                    errors.preferredLocation ? 'border-red-500' : 'border-zinc-300'
                  }`}
                  placeholder="e.g., New York, Downtown Area"
                />
                {errors.preferredLocation && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.preferredLocation}</p>
                )}
              </div>

              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-[0.15em]">
                    Current Location Coordinates
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-xs font-bold text-[#C21A4B] hover:text-[#A1133C] transition-colors duration-200 uppercase tracking-wider"
                  >
                    Use current location
                  </button>
                </div>
                <div className={`rounded-xl border p-4 text-xs transition-all duration-300 ${
                  coordinates.lat !== null && coordinates.lng !== null
                    ? 'border-green-200 bg-green-50/50 text-black font-semibold'
                    : locationError
                    ? 'border-red-200 bg-red-50/50 text-red-750 font-semibold'
                    : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 font-medium'
                }`}>
                  {locationStatus || locationError || 'Click the button to capture your current coordinates.'}
                </div>
                {errors.coordinates && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.coordinates}</p>
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
            </div>

            <button
              type="submit"
              className="w-full bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3.5 px-6 rounded-xl mt-3 transition duration-300 shadow-md uppercase tracking-[0.15em]"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm font-medium shrink-0">
            Already have an account?{' '}
            <a
              href="/signinWorker"
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
