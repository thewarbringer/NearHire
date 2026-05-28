import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [jobs, setJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null, street: null, locality: null, postalCode: null, fullAddress: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [settingsMessage, setSettingsMessage] = useState(null);
  const navigate = useNavigate();

  
  const fetchUserLocation = async () => {
    setLocationLoading(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(prev => ({ ...prev, latitude, longitude }));

            // Get locality name from backend
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_BASE}/api/location/get-locality`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ latitude, longitude }),
              });

              if (response.ok) {
                const data = await response.json();
                setLocation(prev => ({
                  ...prev,
                  street: data.street || null,
                  locality: data.locality || null,
                  postalCode: data.postalCode || null,
                  fullAddress: data.fullAddress || data.displayName || null,
                }));
              }
            } catch (err) {
              console.error('Error fetching locality:', err);
            }
            setLocationLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationLoading(false);
          }
        );
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setLocationLoading(false);
    }
  };
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No token found. Please login first.');
        setLoading(false);
        setTimeout(() => navigate('/signinUser'), 2000);
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/user-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSettingsForm(prev => ({
          ...prev,
          email: data.user.email,
          phone: data.user.phone,
        }));
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/signinUser'), 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      setError('An error occurred while fetching profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobHistory = async () => {
    setJobsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/jobs/my-jobs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allJobs = data.jobs || [];
        const active = allJobs.filter(job => job.status === 'in-progress');
        const others = allJobs.filter(job => job.status !== 'in-progress');
        setActiveJobs(active);
        setJobs(others);
      } else {
        console.error('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleHostJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/jobs/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJobForm),
      });

      if (response.ok) {
        setSettingsMessage({ type: 'success', text: 'Job posted successfully!' });
        setNewJobForm({ title: '', description: '', budget: '', deadline: '', category: '' });
        fetchJobHistory();
        setTimeout(() => setSettingsMessage(null), 3000);
      } else {
        setSettingsMessage({ type: 'error', text: 'Failed to post job' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'An error occurred while posting job' });
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        email: settingsForm.email,
        phone: settingsForm.phone,
      };

      if (settingsForm.newPassword) {
        if (settingsForm.newPassword !== settingsForm.confirmPassword) {
          setSettingsMessage({ type: 'error', text: 'Passwords do not match' });
          return;
        }
        updateData.currentPassword = settingsForm.currentPassword;
        updateData.newPassword = settingsForm.newPassword;
      }

      const response = await fetch(`${API_BASE}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSettingsMessage({ type: 'success', text: 'Profile updated successfully!' });
        setSettingsForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        fetchUserProfile();
        setTimeout(() => setSettingsMessage(null), 3000);
      } else {
        const data = await response.json();
        setSettingsMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'An error occurred while updating profile' });
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserLocation();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobHistory();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-400 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/signinUser')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Welcome, {user?.fullName}!</h1>
                <p className="text-blue-100 text-sm mt-1">User Dashboard</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition duration-200"
              >
                Logout
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {['profile', 'jobs', 'host', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 font-medium transition duration-200 capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab === 'host' ? 'Host Job' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                  <div className="bg-[#0d0d0d] rounded-lg p-6 mb-6">
                    <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-2">Full Name</p>
                      <p className="text-xl font-semibold text-[#f0ede8]">{user?.fullName}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Email</p>
                        <p className="text-[#f0ede8] break-all">{user?.email}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Phone</p>
                        <p className="text-[#f0ede8]">{user?.phone}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Account Type</p>
                        <p className="text-[#f0ede8] capitalize">{user?.role}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Member Since</p>
                        <p className="text-[#f0ede8]">
                          {new Date(user?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-[#f0ede8] mb-4">Current Location</h3>
                      <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Street</p>
                        <p className="text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-500"></div>
                              Fetching...
                            </span>
                          ) : location.street ? (
                            location.street
                          ) : (
                            'Street not available'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Locality</p>
                        <p className="text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-500"></div>
                              Fetching...
                            </span>
                          ) : location.locality ? (
                            location.locality
                          ) : (
                            'Location not available'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Postal Code</p>
                        <p className="text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-500"></div>
                              Fetching...
                            </span>
                          ) : location.postalCode ? (
                            location.postalCode
                          ) : (
                            'Postal code not available'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Coordinates</p>
                        <p className="text-[#f0ede8] text-sm">
                          {location.latitude && location.longitude ? (
                            `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                          ) : (
                            'Not available'
                          )}
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Jobs History Tab */}
              {activeTab === 'jobs' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Job Management</h2>

                  {/* Currently Active Jobs */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-[#f0ede8] mb-4">Currently Active Jobs</h3>
                    {jobsLoading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-400">Loading...</p>
                      </div>
                    ) : activeJobs.length === 0 ? (
                      <div className="bg-[#0d0d0d] rounded-lg p-8 text-center">
                        <p className="text-gray-400">No active jobs at the moment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeJobs.map(job => (
                          <div key={job._id} className="bg-blue-600/10 border border-blue-600 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-xl font-semibold text-[#f0ede8]">{job.title}</h3>
                                <p className="text-gray-400 text-sm mt-1">{job.description}</p>
                              </div>
                              <span className="px-3 py-1 rounded text-sm font-medium bg-blue-600/20 text-blue-400">
                                In Progress
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-blue-600/30">
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Budget</p>
                                <p className="text-[#f0ede8] font-semibold">${job.budget}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Posted</p>
                                <p className="text-[#f0ede8]">{new Date(job.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Deadline</p>
                                <p className="text-[#f0ede8]">{new Date(job.deadline).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Assigned To</p>
                                <p className="text-[#f0ede8]">{job.assignedWorker?.name || 'Pending'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job History */}
                  <div>
                    <h3 className="text-xl font-semibold text-[#f0ede8] mb-4">Job History</h3>
                    {jobsLoading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-400">Loading jobs...</p>
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="bg-[#0d0d0d] rounded-lg p-8 text-center">
                        <p className="text-gray-400">No completed or pending jobs</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map(job => (
                          <div key={job._id} className="bg-[#0d0d0d] rounded-lg p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-xl font-semibold text-[#f0ede8]">{job.title}</h3>
                                <p className="text-gray-400 text-sm mt-1">{job.description}</p>
                              </div>
                              <span className={`px-3 py-1 rounded text-sm font-medium ${
                                job.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                'bg-yellow-600/20 text-yellow-400'
                              }`}>
                                {job.status || 'Pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-700">
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Budget</p>
                                <p className="text-[#f0ede8] font-semibold">${job.budget}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Posted</p>
                                <p className="text-[#f0ede8]">{new Date(job.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Deadline</p>
                                <p className="text-[#f0ede8]">{new Date(job.deadline).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Completed By</p>
                                <p className="text-[#f0ede8]">{job.completedBy?.name || 'Pending'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Host New Job Tab */}
              {activeTab === 'host' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Host a New Job</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-400'
                        : 'bg-red-500/10 border border-red-500 text-red-400'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleHostJob} className="bg-[#0d0d0d] rounded-lg p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={newJobForm.title}
                        onChange={(e) => setNewJobForm({...newJobForm, title: e.target.value})}
                        className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder="Enter job title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                        Description
                      </label>
                      <textarea
                        value={newJobForm.description}
                        onChange={(e) => setNewJobForm({...newJobForm, description: e.target.value})}
                        className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder="Enter job description"
                        rows="4"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                          Budget ($)
                        </label>
                        <input
                          type="number"
                          value={newJobForm.budget}
                          onChange={(e) => setNewJobForm({...newJobForm, budget: e.target.value})}
                          className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                          Deadline
                        </label>
                        <input
                          type="date"
                          value={newJobForm.deadline}
                          onChange={(e) => setNewJobForm({...newJobForm, deadline: e.target.value})}
                          className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newJobForm.category}
                          onChange={(e) => setNewJobForm({...newJobForm, category: e.target.value})}
                          className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          placeholder="e.g., Plumbing"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
                    >
                      Post Job
                    </button>
                  </form>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-400'
                        : 'bg-red-500/10 border border-red-500 text-red-400'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateSettings} className="bg-[#0d0d0d] rounded-lg p-6 space-y-4">
                    <div className="border-b border-gray-700 pb-6 mb-6">
                      <h3 className="text-lg font-semibold text-[#f0ede8] mb-4">Contact Information</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[#f0ede8] mb-4">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={settingsForm.currentPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={settingsForm.newPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#f0ede8] mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={settingsForm.confirmPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-[#f0ede8] placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
