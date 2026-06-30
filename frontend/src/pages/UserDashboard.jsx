import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [requestJobs, setRequestJobs] = useState([]);
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [selectedInProgressJobId, setSelectedInProgressJobId] = useState(null);
  const [inProgressMessageInput, setInProgressMessageInput] = useState('');
  const [inProgressMessageStatus, setInProgressMessageStatus] = useState(null);
  const [jobsSubTab, setJobsSubTab] = useState('requests');
  const [jobsLoading, setJobsLoading] = useState(false);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null, street: null, locality: null, postalCode: null, fullAddress: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [completionStatus, setCompletionStatus] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: null, lng: null });
  const [mapError, setMapError] = useState(null);
  const leafletLoader = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    description: '',
    category: '',
    recipientName: '',
    contactNumber: '',
    address: '',
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
  
  const jobCategories = ['Plumbing', 'Electricity', 'House Help', 'Carpentry', 'Painting'];

  useEffect(() => {
    if (!showMapPicker) return;

    const loadLeafletAssets = () => {
      if (window.L) {
        return Promise.resolve(window.L);
      }
      if (leafletLoader.current) {
        return leafletLoader.current;
      }

      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-sA+e2qNrA0y+1uSJk1HxZg7xXq/kxQ0kGQ1tF7yoa+I=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      leafletLoader.current = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-o9N1j7kA7+T0yED+L1a7xvGQ6+0z8H2e0HUxv4YGvKk=';
        script.crossOrigin = '';
        script.onload = () => {
          if (window.L) {
            resolve(window.L);
          } else {
            reject(new Error('Leaflet did not load correctly'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Leaflet assets'));
        document.body.appendChild(script);
      });

      return leafletLoader.current;
    };

    let active = true;
    const initializeMap = async () => {
      try {
        const L = await loadLeafletAssets();
        if (!active) return;

        const defaultLat = selectedCoords.lat ?? location.latitude ?? 20;
        const defaultLng = selectedCoords.lng ?? location.longitude ?? 0;

        if (!mapInstance.current) {
          mapInstance.current = L.map('job-map').setView([defaultLat, defaultLng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(mapInstance.current);
          mapInstance.current.on('click', (e) => {
            setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          });
        } else {
          mapInstance.current.setView([defaultLat, defaultLng], 13);
        }

        if (markerInstance.current) {
          markerInstance.current.setLatLng([defaultLat, defaultLng]);
        } else {
          markerInstance.current = L.marker([defaultLat, defaultLng]).addTo(mapInstance.current);
        }
      } catch (err) {
        console.error('Map load error:', err);
        setMapError('Unable to load map. Please use current location or try again later.');
      }
    };

    initializeMap();

    return () => {
      active = false;
      if (mapInstance.current) {
        mapInstance.current.off();
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [showMapPicker, location.latitude, location.longitude, selectedCoords.lat, selectedCoords.lng]);

  const fetchUserProfile = useCallback(async () => {
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
        localStorage.removeItem('role');
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
  }, [navigate]);

  const fetchJobHistory = useCallback(async () => {
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

      const progressResponse = await fetch(`${API_BASE}/api/jobs/my-progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let allJobs = [];
      let progressJobs = [];

      if (response.ok) {
        const data = await response.json();
        allJobs = data.jobs || [];
      } else {
        console.error('Failed to fetch jobs');
      }

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        progressJobs = progressData.progressJobs || [];
      } else {
        console.error('Failed to fetch progress jobs');
      }

      const requests = allJobs.filter(job => job.status === 'pending');
      const inProgressFromJobs = allJobs.filter(job => job.status === 'in-progress');
      const others = allJobs.filter(job => job.status === 'completed' || job.status === 'cancelled');

      setRequestJobs(requests);
      setInProgressJobs([...progressJobs, ...inProgressFromJobs]);
      setActiveJobs([...requests, ...progressJobs, ...inProgressFromJobs]);
      setJobs(others);
      if (!selectedInProgressJobId && [...progressJobs, ...inProgressFromJobs].length > 0) {
        setSelectedInProgressJobId([...progressJobs, ...inProgressFromJobs][0]._id);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const selectedProgressJob = inProgressJobs.find(job => job._id === selectedInProgressJobId);

  const handleProgressJobMessageSend = async () => {
    if (!selectedInProgressJobId) return;

    const messageText = inProgressMessageInput.trim();
    if (!messageText) {
      setInProgressMessageStatus({ type: 'error', text: 'Enter a message.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setInProgressMessageStatus({ type: 'error', text: 'Please sign in first.' });
      return;
    }

    setInProgressMessageStatus({ type: 'loading', text: 'Sending message...' });

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedInProgressJobId}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: messageText }),
      });

      const data = await response.json();
      if (!response.ok) {
        setInProgressMessageStatus({ type: 'error', text: data.message || 'Failed to send message.' });
        return;
      }

      const updatedJob = data.progressJob;
      setInProgressJobs(prev => prev.map(job => job._id === updatedJob._id ? updatedJob : job));
      setInProgressMessageInput('');
      setInProgressMessageStatus({ type: 'success', text: 'Message sent.' });
    } catch (err) {
      console.error('Progress message send error:', err);
      setInProgressMessageStatus({ type: 'error', text: 'Failed to send message.' });
    }
  };

  const handleConfirmCompletion = async () => {
    if (!selectedInProgressJobId || !selectedProgressJob?.completionRequested) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setInProgressMessageStatus({ type: 'error', text: 'Please sign in first.' });
      return;
    }

    setCompletionStatus({ type: 'loading', text: 'Confirming completion...' });

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedInProgressJobId}/confirm-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        setCompletionStatus({ type: 'error', text: data.message || 'Failed to confirm completion.' });
        return;
      }

      const updatedList = inProgressJobs.filter(job => job._id !== selectedInProgressJobId);
      setInProgressJobs(updatedList);
      setSelectedInProgressJobId(updatedList.length > 0 ? updatedList[0]._id : null);
      setCompletionStatus({ type: 'success', text: 'Job marked as completed.' });
      setInProgressMessageInput('');
      setInProgressMessageStatus(null);
      setJobs(prev => [...prev, data.completedJob]);
    } catch (err) {
      console.error('Confirm completion error:', err);
      setCompletionStatus({ type: 'error', text: 'Failed to confirm completion.' });
    }
  };

  const handleHostJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const lat = selectedCoords.lat !== null ? selectedCoords.lat : location.latitude;
      const lng = selectedCoords.lng !== null ? selectedCoords.lng : location.longitude;

      if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
        setSettingsMessage({ type: 'error', text: 'Please pick a location on the map or allow current location.' });
        return;
      }

      if (!newJobForm.category || !newJobForm.contactNumber || !newJobForm.address || !newJobForm.title || !newJobForm.description) {
        setSettingsMessage({ type: 'error', text: 'Please fill in all required job fields.' });
        return;
      }

      const now = new Date();
      const response = await fetch(`${API_BASE}/api/jobs/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: { lat, lng },
          category: newJobForm.category,
          hostingDate: now.toISOString(),
          hostingTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          contactNumber: newJobForm.contactNumber,
          address: newJobForm.address || location.fullAddress || '',
          recipientName: newJobForm.recipientName,
          title: newJobForm.title,
          description: newJobForm.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettingsMessage({ type: 'success', text: 'Job posted successfully!' });
        setNewJobForm({
          title: '',
          description: '',
          category: '',
          recipientName: '',
          contactNumber: '',
          address: '',
        });
        setSelectedCoords({ lat: null, lng: null });
        setShowMapPicker(false);
        setNearbyWorkers(data.nearbyWorkers || []);
        fetchJobHistory();
        setTimeout(() => setSettingsMessage(null), 3000);
      } else {
        setNearbyWorkers([]);
        const data = await response.json();
        setSettingsMessage({ type: 'error', text: data.message || 'Failed to post job' });
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
    const loadProfile = async () => {
      await fetchUserProfile();
    };
    const loadLocation = async () => {
      await fetchUserLocation();
    };
    void loadProfile();
    void loadLocation();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      const loadJobs = async () => {
        await fetchJobHistory();
      };
      void loadJobs();
    }
  }, [activeTab, fetchJobHistory]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C21A4B] mx-auto mb-4"></div>
          <p className="font-semibold text-zinc-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-600 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/signinUser')}
            className="bg-[#C21A4B] hover:bg-[#A1133C] text-white font-medium py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-zinc-800 flex flex-col overflow-hidden">

      <div className="w-full px-6 py-8 flex-1 min-h-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200 h-full flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-black to-zinc-50 p-8 flex justify-between items-center border-b border-zinc-200 shrink-0">
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome, {user?.fullName}!</h1>
                <p className="text-[#C21A4B] text-xs font-bold tracking-widest uppercase mt-2">User Dashboard</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-lg"
              >
                Logout
              </button>
            </div>
            {/* Sidebar + Main Content Wrapper */}
            <div className="flex flex-1 min-h-0">
              
              {/* Left Sidebar */}
              <aside className="w-64 border-r border-zinc-200 bg-zinc-50 flex flex-col shrink-0">
                <nav className="flex-1 py-8 px-4 space-y-1">
                  {[
                    { id: 'profile', label: 'Profile', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    )},
                    { id: 'jobs', label: 'Jobs', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                    )},
                    { id: 'host', label: 'Host Job', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                      </svg>
                    )},
                    { id: 'settings', label: 'Settings', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    )}
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3.5 py-3 px-5 rounded-xl font-bold transition duration-300 text-xs tracking-wider uppercase ${
                          isActive
                            ? 'bg-[#C21A4B]/10 text-[#C21A4B] shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/50'
                        }`}
                      >
                        <span className={`transition-colors duration-300 ${isActive ? 'text-[#C21A4B]' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
                          {tab.icon}
                        </span>
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
                {activeTab === 'jobs' && (
                  <div className="px-4 pb-6 pt-4 border-t border-zinc-200 space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Job sections</p>
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('requests')}
                      className={`w-full rounded-xl py-3 text-left text-sm font-semibold transition ${
                        jobsSubTab === 'requests'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      In Request Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('inProgress')}
                      className={`w-full rounded-xl py-3 text-left text-sm font-semibold transition ${
                        jobsSubTab === 'inProgress'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      In Progress Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('history')}
                      className={`w-full rounded-xl py-3 text-left text-sm font-semibold transition ${
                        jobsSubTab === 'history'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Jobs History
                    </button>
                  </div>
                )}
              </aside>

              {/* Tab Content */}
              <div className="p-12 overflow-y-auto flex-1 bg-white">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="max-w-full">
                  <h2 className="text-3xl font-extrabold mb-10 text-zinc-950 tracking-tight">Profile Information</h2>
                  <div className="bg-zinc-50/50 rounded-2xl p-10 mb-8 border border-zinc-200 shadow-xs">
                    <div className="mb-8 pb-8 border-b border-zinc-200">
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Full Name</p>
                      <p className="text-3xl font-bold text-[#C21A4B]">{user?.fullName}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Email Address</p>
                        <p className="text-lg font-semibold text-zinc-900 break-all">{user?.email}</p>
                      </div>

                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Phone Number</p>
                        <p className="text-lg font-semibold text-zinc-900">{user?.phone}</p>
                      </div>

                      <div className="pb-6 border-b md:border-b-0 md:pb-0">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Account Type</p>
                        <div className="inline-block">
                          <p className="text-lg font-semibold text-[#C21A4B] capitalize px-4 py-2 bg-[#C21A4B]/10 rounded-lg font-semibold">{user?.role}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Member Since</p>
                        <p className="text-lg font-semibold text-zinc-900">
                          {new Date(user?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200 pt-8">
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        Current Location
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Street Address</p>
                        <p className="text-lg font-semibold text-zinc-900">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#C21A4B] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.street ? (
                            location.street
                          ) : (
                            <span className="text-zinc-400">Not available</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Locality</p>
                        <p className="text-lg font-semibold text-zinc-900">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#C21A4B] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.locality ? (
                            location.locality
                          ) : (
                            <span className="text-zinc-400">Not available</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Postal Code</p>
                        <p className="text-lg font-semibold text-zinc-900">
                          {locationLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#C21A4B] border-t-transparent"></div>
                              Fetching...
                            </span>
                          ) : location.postalCode ? (
                            location.postalCode
                          ) : (
                            <span className="text-zinc-400">Not available</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-zinc-100 rounded-xl p-4 border border-zinc-200">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">GPS Coordinates</p>
                        <p className="text-zinc-900 text-sm font-mono font-semibold">
                          {location.latitude && location.longitude ? (
                            `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                          ) : (
                            <span className="text-zinc-400">Not available</span>
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
                  <h2 className="text-3xl font-extrabold mb-10 text-zinc-950 tracking-tight">Job Management</h2>

                  <div className="mb-10 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('requests')}
                      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                        jobsSubTab === 'requests'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      In Request Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('inProgress')}
                      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                        jobsSubTab === 'inProgress'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      In Progress Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsSubTab('history')}
                      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                        jobsSubTab === 'history'
                          ? 'bg-[#C21A4B] text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      Jobs History
                    </button>
                  </div>

                  {jobsSubTab === 'requests' ? (
                    <div className="mb-12">
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        In Request Jobs
                      </h3>
                      {jobsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#C21A4B] border-t-transparent mx-auto mb-4"></div>
                          <p className="text-zinc-500">Loading request jobs...</p>
                        </div>
                      ) : requestJobs.length === 0 ? (
                        <div className="bg-zinc-50 rounded-2xl p-12 text-center border border-zinc-200">
                          <p className="text-zinc-500">No request jobs at the moment</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {requestJobs.map(job => (
                            <div key={job._id} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-zinc-950 mb-2">{job.title}</h3>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{job.description}</p>
                                  <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-zinc-500">
                                    <div>
                                      <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Category</p>
                                      <p className="text-zinc-800 font-semibold">{job.category}</p>
                                    </div>
                                    <div>
                                      <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Recipient</p>
                                      <p className="text-zinc-800 font-semibold">{job.recipientName || 'Not set'}</p>
                                    </div>
                                    <div>
                                      <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Requests</p>
                                      <p className="text-zinc-800 font-semibold">{(job.request?.length ?? 0).toString()}</p>
                                    </div>
                                  </div>
                                </div>
                                <span className="ml-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#64748B]/10 text-[#64748B] whitespace-nowrap uppercase tracking-wide">
                                  Request Pending
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200">
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Hosted</p>
                                  <p className="text-zinc-800 text-sm font-semibold">{new Date(job.hostingDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">When</p>
                                  <p className="text-zinc-800 text-sm font-semibold">{job.hostingTime || 'Anytime'}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Address</p>
                                  <p className="text-[#C21A4B] text-sm font-bold">{job.address}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/manageJob/${job._id}`)}
                                  className="rounded-full bg-[#C21A4B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A1133C]"
                                >
                                  Manage
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : jobsSubTab === 'inProgress' ? (
                    <div className="mb-12">
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        In Progress Jobs
                      </h3>
                      {jobsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#C21A4B] border-t-transparent mx-auto mb-4"></div>
                          <p className="text-zinc-500">Loading in-progress jobs...</p>
                        </div>
                      ) : inProgressJobs.length === 0 ? (
                        <div className="bg-zinc-50 rounded-2xl p-12 text-center border border-zinc-200">
                          <p className="text-zinc-500">No in-progress jobs at the moment</p>
                        </div>
                      ) : (
                        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                          <div className="space-y-4">
                            {inProgressJobs.map(job => {
                              const isSelected = job._id === selectedInProgressJobId;
                              return (
                                <button
                                  key={job._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInProgressJobId(job._id);
                                    setInProgressMessageStatus(null);
                                  }}
                                  className={`w-full text-left rounded-2xl border p-6 shadow-sm transition ${isSelected ? 'border-[#C21A4B]/40 bg-[#F8F3F0]' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                                >
                                  <div className="flex justify-between items-start mb-4 gap-4">
                                    <div className="flex-1">
                                      <h3 className="text-lg font-bold text-zinc-950 mb-2">{job.title}</h3>
                                      <p className="text-zinc-500 text-sm leading-relaxed">{job.description}</p>
                                      <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-zinc-500">
                                        <div>
                                          <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Category</p>
                                          <p className="text-zinc-800 font-semibold">{job.category}</p>
                                        </div>
                                        <div>
                                          <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Worker</p>
                                          <p className="text-zinc-800 font-semibold">{job.workerName || 'Assigned worker'}</p>
                                        </div>
                                        <div>
                                          <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Price</p>
                                          <p className="text-zinc-800 font-semibold">{typeof job.price === 'number' ? `₹${job.price}` : 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <span className="ml-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#C21A4B]/10 text-[#C21A4B] whitespace-nowrap uppercase tracking-wide">
                                      Accepted
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200">
                                    <div>
                                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Hosted</p>
                                      <p className="text-zinc-800 text-sm font-semibold">{new Date(job.hostingDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">When</p>
                                      <p className="text-zinc-800 text-sm font-semibold">{job.hostingTime || 'Anytime'}</p>
                                    </div>
                                    <div>
                                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Address</p>
                                      <p className="text-[#C21A4B] text-sm font-bold">{job.address}</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>

                          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            {selectedProgressJob ? (
                              <div className="space-y-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-bold mb-2">Chat with worker</p>
                                    <h3 className="text-xl font-bold text-zinc-950">{selectedProgressJob.workerName || 'Assigned Worker'}</h3>
                                    <p className="text-sm text-zinc-600">{selectedProgressJob.title}</p>
                                  </div>
                                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200 text-xs font-semibold uppercase tracking-[0.15em] text-[#C21A4B]">
                                    {selectedProgressJob.status?.replace('-', ' ') || 'In Progress'}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 max-h-[420px] overflow-y-auto space-y-4">
                                  {selectedProgressJob.messages?.length > 0 ? (
                                    selectedProgressJob.messages.map((message, index) => (
                                      <div key={index} className="rounded-2xl bg-white p-4 border border-zinc-200">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700">{message.sender}</p>
                                          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">{new Date(message.time).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{message.text}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">No chat messages yet. Start the conversation with your worker.</div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <textarea
                                    rows="4"
                                    value={inProgressMessageInput}
                                    onChange={(e) => {
                                      setInProgressMessageInput(e.target.value);
                                      setInProgressMessageStatus(null);
                                    }}
                                    placeholder="Type your message to the worker..."
                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#C21A4B]"
                                  />
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                      <button
                                        type="button"
                                        onClick={handleProgressJobMessageSend}
                                        className="rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition"
                                      >
                                        Send Message
                                      </button>
                                      {selectedProgressJob?.completionRequested && (
                                        <button
                                          type="button"
                                          onClick={handleConfirmCompletion}
                                          className="rounded-2xl border border-[#C21A4B] bg-white px-5 py-3 text-sm font-bold text-[#C21A4B] hover:bg-[#C21A4B]/10 transition"
                                        >
                                          Confirm Completion
                                        </button>
                                      )}
                                    </div>

                                    <div className="space-y-2 text-right">
                                      {inProgressMessageStatus && (
                                        <p className={`text-sm ${inProgressMessageStatus.type === 'success' ? 'text-green-700' : inProgressMessageStatus.type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                                          {inProgressMessageStatus.text}
                                        </p>
                                      )}
                                      {completionStatus && (
                                        <p className={`text-sm ${completionStatus.type === 'success' ? 'text-green-700' : completionStatus.type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                                          {completionStatus.text}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
                                Select an accepted job to open the chat pane.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        Job History
                      </h3>
                      {jobsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#C21A4B] border-t-transparent mx-auto mb-4"></div>
                          <p className="text-zinc-500">Loading job history...</p>
                        </div>
                      ) : jobs.length === 0 ? (
                        <div className="bg-zinc-50 rounded-2xl p-12 text-center border border-zinc-200">
                          <p className="text-zinc-500">No completed or cancelled jobs</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {jobs.map(job => (
                            <div key={job._id} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-zinc-950 mb-2">{job.title}</h3>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{job.description}</p>
                                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-zinc-500">
                                    <div>
                                      <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Category</p>
                                      <p className="text-zinc-800 font-semibold">{job.category}</p>
                                    </div>
                                    <div>
                                      <p className="uppercase tracking-[0.2em] mb-1 opacity-80">Recipient</p>
                                      <p className="text-zinc-800 font-semibold">{job.recipientName || 'Not set'}</p>
                                    </div>
                                  </div>
                                </div>
                                <span className={`ml-4 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wide ${
                                  job.status === 'completed' ? 'bg-[#C21A4B]/10 text-[#C21A4B]' :
                                  'bg-[#FFB74D]/20 text-[#FFB74D]'
                                }`}>
                                  {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Pending'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200">
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Hosted</p>
                                  <p className="text-zinc-800 text-sm font-semibold">{new Date(job.hostingDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">When</p>
                                  <p className="text-zinc-800 text-sm font-semibold">{job.hostingTime || 'Anytime'}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Address</p>
                                  <p className="text-[#C21A4B] text-sm font-bold">{job.address}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/manageJob/${job._id}`)}
                                  className="rounded-full bg-[#C21A4B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A1133C]"
                                >
                                  Manage
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Host New Job Tab */}
              {activeTab === 'host' && (
                <div className="max-w-full">
                  <h2 className="text-3xl font-extrabold mb-10 text-zinc-950 tracking-tight">Host a New Job</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-600'
                        : 'bg-red-500/10 border border-red-500 text-red-600'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  {nearbyWorkers.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                      <h3 className="text-xl font-bold text-zinc-900 mb-4">Available workers nearby</h3>
                      <div className="space-y-4">
                        {nearbyWorkers.map((worker) => (
                          <div key={worker.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-zinc-900 font-semibold">{worker.name}</p>
                                <p className="text-zinc-500 text-sm">{worker.specialization}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#C21A4B] text-sm font-semibold">{worker.distance ? `${worker.distance.toFixed(2)} km` : 'Within 10 km'}</p>
                                {worker.rating !== undefined && (
                                  <p className="text-zinc-500 text-sm">Rating: {worker.rating.toFixed(1)}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <p className="text-zinc-500 text-sm">Phone: <span className="text-zinc-900 font-medium">{worker.phone || 'N/A'}</span></p>
                              <p className="text-zinc-500 text-sm">Email: <span className="text-zinc-900 font-medium">{worker.email}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleHostJob} className="bg-zinc-50/30 rounded-2xl p-10 space-y-6 border border-zinc-200 shadow-sm">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Job Title</label>
                      <input
                        type="text"
                        value={newJobForm.title}
                        onChange={(e) => setNewJobForm({...newJobForm, title: e.target.value})}
                        className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                        placeholder="e.g., Electrical Repair"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Description</label>
                      <textarea
                        value={newJobForm.description}
                        onChange={(e) => setNewJobForm({...newJobForm, description: e.target.value})}
                        className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 resize-none font-medium focus:bg-white"
                        placeholder="Describe what needs to be done..."
                        rows="4"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Category</label>
                        <select
                          value={newJobForm.category}
                          onChange={(e) => setNewJobForm({ ...newJobForm, category: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          required
                        >
                          <option value="">Select a category</option>
                          {jobCategories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Recipient Name</label>
                        <input
                          type="text"
                          value={newJobForm.recipientName}
                          onChange={(e) => setNewJobForm({ ...newJobForm, recipientName: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          placeholder="Receiver name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Contact Number</label>
                        <input
                          type="text"
                          value={newJobForm.contactNumber}
                          onChange={(e) => setNewJobForm({ ...newJobForm, contactNumber: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          placeholder="Phone or mobile"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Address</label>
                        <textarea
                          value={newJobForm.address}
                          onChange={(e) => setNewJobForm({ ...newJobForm, address: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 resize-none font-medium focus:bg-white"
                          placeholder={location.fullAddress || 'Enter service address'}
                          rows="3"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMapPicker(false);
                          setSelectedCoords({ lat: null, lng: null });
                        }}
                        className={`w-full px-5 py-3 rounded-xl transition duration-300 text-sm font-bold ${
                          !showMapPicker ? 'bg-[#C21A4B] text-white shadow-md' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                        }`}
                      >
                        Use Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className={`w-full px-5 py-3 rounded-xl transition duration-300 text-sm font-bold ${
                          showMapPicker ? 'bg-[#C21A4B] text-white shadow-md' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                        }`}
                      >
                        Pick Location on Map
                      </button>
                    </div>

                    <div className="pt-4">
                      {showMapPicker ? (
                        <div className="space-y-4">
                          <div className="h-72 rounded-2xl overflow-hidden border border-zinc-200">
                            <div id="job-map" className="w-full h-full"></div>
                          </div>
                          {mapError && <p className="text-sm text-red-500 font-semibold">{mapError}</p>}
                          <p className="text-sm text-zinc-500">Click anywhere on the map to set the job location.</p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
                          <p className="text-sm text-zinc-500 mb-2 font-medium">Current browser location will be used.</p>
                          <p className="text-sm text-zinc-900 font-semibold">{location.fullAddress || 'Current location not yet available'}</p>
                          <p className="text-xs text-[#C21A4B] font-bold mt-3">
                            {location.latitude && location.longitude
                              ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
                              : 'Allow location access to use current position.'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-sm text-zinc-500 font-medium">
                      {selectedCoords.lat !== null && selectedCoords.lng !== null && (
                        <span>Selected Coordinates: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl mt-6 uppercase tracking-[0.15em]"
                    >
                      Post Job
                    </button>
                  </form>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-full">
                  <h2 className="text-3xl font-extrabold mb-10 text-zinc-950 tracking-tight">Account Settings</h2>
                  {settingsMessage && (
                    <div className={`mb-4 p-4 rounded ${
                      settingsMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500 text-green-600'
                        : 'bg-red-500/10 border border-red-500 text-red-600'
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateSettings} className="bg-zinc-50/30 rounded-2xl p-10 space-y-8 border border-zinc-200 shadow-sm">
                    <div className="border-b border-zinc-200 pb-8">
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        Contact Information
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Email Address</label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Phone Number</label>
                          <input
                            type="text"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-zinc-950 mb-6 flex items-center gap-2 tracking-tight">
                        <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                        Change Password
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Current Password</label>
                          <input
                            type="password"
                            value={settingsForm.currentPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">New Password</label>
                          <input
                            type="password"
                            value={settingsForm.newPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-[0.15em]">Confirm New Password</label>
                          <input
                            type="password"
                            value={settingsForm.confirmPassword}
                            onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                            className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl mt-6 uppercase tracking-[0.15em]"
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
