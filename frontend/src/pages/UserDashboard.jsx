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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#5DCAA5] mx-auto mb-4"></div>
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
            className="bg-[#5DCAA5] hover:bg-[#4ab891] text-[#03261d] font-medium py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8] flex flex-col overflow-hidden">
      <Navbar />

      <div className="w-full px-6 py-8 flex-1 min-h-0">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-white/5 h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5DCAA5] to-[#4ab891] p-8 flex justify-between items-center border-b border-white/10 flex-shrink-0">
              <div>
                <h1 className="font-[DMSerifDisplay] text-5xl font-bold text-[#03261d] tracking-tight">Welcome, {user?.fullName}!</h1>
                <p className="text-[#03261d]/70 text-sm mt-3 tracking-widest uppercase font-medium">User Dashboard</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-lg"
              >
                Logout
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-[#0d0d0d] flex-shrink-0 sticky top-0 z-10">
              {['profile', 'jobs', 'host', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 font-semibold transition duration-300 capitalize text-sm tracking-widest uppercase ${
                    activeTab === tab
                      ? 'bg-[#5DCAA5]/15 text-[#5DCAA5] border-b-2 border-[#5DCAA5]'
                      : 'text-[#a8a49d] hover:text-[#d9d7d2] hover:bg-white/5'
                  }`}
                >
                  {tab === 'host' ? 'Host Job' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-12 overflow-y-auto flex-1">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="max-w-full">
                  <h2 className="font-[DMSerifDisplay] text-4xl font-bold mb-10 text-[#f0ede8] tracking-tight">Profile Information</h2>
                  <div className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-10 mb-8 border border-white/5 shadow-lg">
                    <div className="mb-8 pb-8 border-b border-white/5">
                      <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Full Name</p>
                      <p className="text-3xl font-[DMSerifDisplay] font-bold text-[#5DCAA5]">{user?.fullName}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Email Address</p>
                        <p className="text-lg font-semibold text-[#f0ede8] break-all">{user?.email}</p>
                      </div>

                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Phone Number</p>
                        <p className="text-lg font-semibold text-[#f0ede8]">{user?.phone}</p>
                      </div>

                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Account Type</p>
                        <div className="inline-block">
                          <p className="text-lg font-semibold text-[#5DCAA5] capitalize px-4 py-2 bg-[#5DCAA5]/15 rounded-lg">{user?.role}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Member Since</p>
                        <p className="text-lg font-semibold text-[#f0ede8]">
                          {new Date(user?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-8">
                      <h3 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#5DCAA5] rounded-full"></span>
                        Current Location
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Street Address</p>
                        <p className="text-lg font-semibold text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#5DCAA5] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.street ? (
                            location.street
                          ) : (
                            <span className="text-[#a8a49d]">Not available</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Locality</p>
                        <p className="text-lg font-semibold text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#5DCAA5] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.locality ? (
                            location.locality
                          ) : (
                            <span className="text-[#a8a49d]">Not available</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Postal Code</p>
                        <p className="text-lg font-semibold text-[#f0ede8]">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#5DCAA5] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.postalCode ? (
                            location.postalCode
                          ) : (
                            <span className="text-[#a8a49d]">Not available</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">GPS Coordinates</p>
                        <p className="text-[#f0ede8] text-sm font-mono font-semibold">
                          {location.latitude && location.longitude ? (
                            `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                          ) : (
                            <span className="text-[#a8a49d]">Not available</span>
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
                <div className="max-w-full">
                  <h2 className="font-[DMSerifDisplay] text-4xl font-bold mb-10 text-[#f0ede8] tracking-tight">Job Management</h2>

                  {/* Currently Active Jobs */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-6 flex items-center gap-2 tracking-tight">
                      <span className="w-1 h-7 bg-[#5DCAA5] rounded-full"></span>
                      Currently Active Jobs
                    </h3>
                    {jobsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#5DCAA5] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-[#a8a49d]">Loading active jobs...</p>
                      </div>
                    ) : activeJobs.length === 0 ? (
                      <div className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-12 text-center border border-white/5">
                        <p className="text-[#a8a49d]">No active jobs at the moment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeJobs.map(job => (
                          <div key={job._id} className="bg-gradient-to-br from-[#5DCAA5]/10 to-transparent rounded-2xl p-6 border border-[#5DCAA5]/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-2">{job.title}</h3>
                                <p className="text-[#a8a49d] text-sm leading-relaxed">{job.description}</p>
                              </div>
                              <span className="ml-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#5DCAA5]/20 text-[#5DCAA5] whitespace-nowrap uppercase tracking-wide">
                                In Progress
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#5DCAA5]/20">
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Budget</p>
                                <p className="text-[#f0ede8] font-bold text-lg">${job.budget}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Posted</p>
                                <p className="text-[#f0ede8] text-sm font-semibold">{new Date(job.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Deadline</p>
                                <p className="text-[#f0ede8] text-sm font-semibold">{new Date(job.deadline).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Assigned To</p>
                                <p className="text-[#5DCAA5] text-sm font-bold">{job.assignedWorker?.name || 'Pending'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job History */}
                  <div>
                    <h3 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-6 flex items-center gap-2 tracking-tight">
                      <span className="w-1 h-7 bg-[#5DCAA5] rounded-full"></span>
                      Job History
                    </h3>
                    {jobsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#5DCAA5] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-[#a8a49d]">Loading job history...</p>
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-12 text-center border border-white/5">
                        <p className="text-[#a8a49d]">No completed or pending jobs</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map(job => (
                          <div key={job._id} className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-6 border border-white/5 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-2">{job.title}</h3>
                                <p className="text-[#a8a49d] text-sm leading-relaxed">{job.description}</p>
                              </div>
                              <span className={`ml-4 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wide ${
                                job.status === 'completed' ? 'bg-[#5DCAA5]/20 text-[#5DCAA5]' :
                                'bg-[#FFB74D]/20 text-[#FFB74D]'
                              }`}>
                                {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Budget</p>
                                <p className="text-[#f0ede8] font-bold text-lg">${job.budget}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Posted</p>
                                <p className="text-[#f0ede8] text-sm font-semibold">{new Date(job.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Deadline</p>
                                <p className="text-[#f0ede8] text-sm font-semibold">{new Date(job.deadline).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[#a8a49d] text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Completed By</p>
                                <p className="text-[#5DCAA5] text-sm font-bold">{job.completedBy?.name || 'Pending'}</p>
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
                <div className="max-w-full">
                  <h2 className="font-[DMSerifDisplay] text-4xl font-bold mb-10 text-[#f0ede8] tracking-tight">Host a New Job</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-400'
                        : 'bg-red-500/10 border border-red-500 text-red-400'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleHostJob} className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-10 space-y-6 border border-white/5 shadow-lg">
                    <div>
                      <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Job Title</label>
                      <input
                        type="text"
                        value={newJobForm.title}
                        onChange={(e) => setNewJobForm({...newJobForm, title: e.target.value})}
                        className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                        placeholder="e.g., Electrical Repair"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Description</label>
                      <textarea
                        value={newJobForm.description}
                        onChange={(e) => setNewJobForm({...newJobForm, description: e.target.value})}
                        className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 resize-none font-medium"
                        placeholder="Describe what needs to be done..."
                        rows="4"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      <div>
                        <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Budget ($)</label>
                        <input
                          type="number"
                          value={newJobForm.budget}
                          onChange={(e) => setNewJobForm({...newJobForm, budget: e.target.value})}
                          className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Deadline</label>
                        <input
                          type="date"
                          value={newJobForm.deadline}
                          onChange={(e) => setNewJobForm({...newJobForm, deadline: e.target.value})}
                          className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Category</label>
                        <input
                          type="text"
                          value={newJobForm.category}
                          onChange={(e) => setNewJobForm({...newJobForm, category: e.target.value})}
                          className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                          placeholder="e.g., Plumbing"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#5DCAA5] hover:bg-[#4ab891] text-[#03261d] font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl mt-6 uppercase tracking-[0.15em]"
                    >
                      Post Job
                    </button>
                  </form>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-full">
                  <h2 className="font-[DMSerifDisplay] text-4xl font-bold mb-10 text-[#f0ede8] tracking-tight">Account Settings</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-400'
                        : 'bg-red-500/10 border border-red-500 text-red-400'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateSettings} className="bg-gradient-to-br from-[#0f1f18] to-[#0d0d0d] rounded-2xl p-10 space-y-8 border border-white/5 shadow-lg">
                    <div className="border-b border-white/5 pb-8">
                      <h3 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#5DCAA5] rounded-full"></span>
                        Contact Information
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Email Address</label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Phone Number</label>
                          <input
                            type="tel"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8] mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#5DCAA5] rounded-full"></span>
                        Change Password
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Current Password</label>
                          <input
                            type="password"
                            value={settingsForm.currentPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">New Password</label>
                          <input
                            type="password"
                            value={settingsForm.newPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-[#f0ede8] mb-3 uppercase tracking-[0.15em]">Confirm New Password</label>
                          <input
                            type="password"
                            value={settingsForm.confirmPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#f0ede8] placeholder-[#a8a49d] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5] transition-all duration-300 font-medium"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#5DCAA5] hover:bg-[#4ab891] text-[#03261d] font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl mt-6 uppercase tracking-[0.15em]"
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
  );
}
