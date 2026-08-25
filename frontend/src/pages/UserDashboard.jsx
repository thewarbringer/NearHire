import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NotificationBell from '../components/NotificationBell';
import WorkerLiveMap from '../components/WorkerLiveMap';

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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
  const [upiStep, setUpiStep] = useState('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gpay');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userReviewInput, setUserReviewInput] = useState('');
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

  const fetchJobHistory = useCallback(async (isSilent = false) => {
    if (!isSilent) setJobsLoading(true);
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

      const completedResponse = await fetch(`${API_BASE}/api/jobs/my-completed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let allJobs = [];
      let progressJobs = [];
      let completedJobs = [];

      if (response.ok) {
        const data = await response.json();
        allJobs = data.jobs || [];
      }

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        progressJobs = progressData.progressJobs || [];
      }

      if (completedResponse.ok) {
        const completedData = await completedResponse.json();
        completedJobs = completedData.completedJobs || [];
      }

      const requests = allJobs.filter(job => job.status === 'pending');
      const inProgressFromJobs = allJobs.filter(job => job.status === 'in-progress');
      const cancelledFromJobs = allJobs.filter(job => job.status === 'cancelled');

      setRequestJobs(requests);
      setInProgressJobs([...progressJobs, ...inProgressFromJobs]);
      setActiveJobs([...requests, ...progressJobs, ...inProgressFromJobs]);
      setJobs([...completedJobs, ...cancelledFromJobs]);
      setSelectedInProgressJobId(prev => prev || ([...progressJobs, ...inProgressFromJobs][0]?._id ?? null));
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      if (!isSilent) setJobsLoading(false);
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

    if (selectedProgressJob?.paymentStatus !== 'paid') {
      setCompletionStatus({ type: 'error', text: 'Payment is required before confirming completion. Please complete the payment first.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setInProgressMessageStatus({ type: 'error', text: 'Please sign in first.' });
      return;
    }

    setRatingValue(5);
    setHoverRating(0);
    setUserReviewInput('');
    setShowRatingModal(true);
  };

  const handleConfirmCompletionWithRating = async (ratingVal, reviewTxt) => {
    if (!selectedInProgressJobId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setCompletionStatus({ type: 'loading', text: 'Confirming completion & submitting rating...' });
    setShowRatingModal(false);

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedInProgressJobId}/confirm-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: ratingVal, review: reviewTxt }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCompletionStatus({ type: 'error', text: data.message || 'Failed to confirm completion.' });
        return;
      }

      const updatedList = inProgressJobs.filter(job => job._id !== selectedInProgressJobId);
      setInProgressJobs(updatedList);
      setSelectedInProgressJobId(updatedList.length > 0 ? updatedList[0]._id : null);
      setCompletionStatus({ type: 'success', text: `Job completed! Rated ⭐ ${ratingVal}/5.` });
      setInProgressMessageInput('');
      setInProgressMessageStatus(null);
      setJobs(prev => [...prev, data.completedJob]);
      fetchJobHistory(true);
    } catch (err) {
      console.error('Confirm completion error:', err);
      setCompletionStatus({ type: 'error', text: 'Failed to confirm completion.' });
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayJob = async (jobToPay) => {
    if (!jobToPay || !jobToPay._id) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setPaymentMessage({ type: 'error', text: 'Please sign in first.' });
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage({ type: 'loading', text: 'Initializing Razorpay Checkout...' });

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${jobToPay._id}/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const orderData = await response.json();
      if (!response.ok) {
        setPaymentLoading(false);
        setPaymentMessage({ type: 'error', text: orderData.message || 'Failed to create payment order.' });
        return;
      }

      const isLoaded = await loadRazorpayScript();

      const verifyPayment = async (payload) => {
        try {
          const verifyRes = await fetch(`${API_BASE}/api/jobs/progress/${jobToPay._id}/verify-razorpay-payment`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setPaymentMessage({ type: 'error', text: verifyData.message || 'Payment verification failed.' });
            return;
          }

          console.log('Payment verified:', {
            amount: verifyData.grossAmount,
            transactionId: verifyData.transactionId,
            worker: verifyData.progressJob?.workerName,
            accountBalance: verifyData.accountBalance,
          });

          setUser(prev => ({
            ...prev,
            accountBalance: verifyData.accountBalance || ((prev?.accountBalance || 0) + (jobToPay.price || 0))
          }));

          setInProgressJobs(prev => prev.map(job => job._id === verifyData.progressJob._id ? verifyData.progressJob : job));
          setPaymentMessage({
            type: 'success',
            text: `Payment of ₹${verifyData.grossAmount} successful! Transferred directly to Worker (${verifyData.progressJob?.workerName || 'Worker'})!`
          });
        } catch (err) {
          console.error('Payment verification error:', err);
          setPaymentMessage({ type: 'error', text: 'Payment verification failed.' });
        } finally {
          setPaymentLoading(false);
        }
      };

      if (!isLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK not loaded, executing payment verification...');
        await verifyPayment({ mockPayment: true });
        return;
      }

      const options = {
        key: orderData.keyId || 'rzp_test_NearHireDummyKey',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'NearHire Direct Payment System',
        description: `Payment for "${jobToPay.title}" (Direct Worker Payout)`,
        order_id: orderData.orderId,
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI (GPay, PhonePe, Paytm, BHIM)",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi", "block.banks", "block.cards"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: function (razorpayRes) {
          void verifyPayment({
            razorpay_order_id: razorpayRes.razorpay_order_id,
            razorpay_payment_id: razorpayRes.razorpay_payment_id,
            razorpay_signature: razorpayRes.razorpay_signature,
          });
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.phone || '',
          method: 'upi',
          vpa: upiIdInput.trim() || undefined,
        },
        theme: {
          color: '#C21A4B',
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            setPaymentMessage({ type: 'error', text: 'Payment modal closed by user.' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Pay job error:', err);
      setPaymentLoading(false);
      setPaymentMessage({ type: 'error', text: 'An error occurred while initiating payment.' });
    }
  };

  const handleOpenUpiModal = (job, method) => {
    setSelectedJobForPayment(job);
    setSelectedPaymentMethod(method || 'gpay');
    setShowUpiModal(true);
    setUpiStep('select');
  };

  const handleConfirmUpiPayment = async () => {
    if (!selectedJobForPayment) return;
    setUpiStep('processing');
    setPaymentLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedJobForPayment._id}/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mockPayment: true,
          upiMethod: selectedPaymentMethod,
          upiVpa: upiIdInput.trim() || `${user?.phone || '9876543210'}@upi`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPaymentMessage({ type: 'error', text: data.message || 'UPI Payment verification failed.' });
        setUpiStep('select');
        return;
      }

      setUser(prev => ({
        ...prev,
        accountBalance: data.accountBalance || ((prev?.accountBalance || 0) + (selectedJobForPayment.price || 0))
      }));

      setInProgressJobs(prev => prev.map(job => job._id === data.progressJob._id ? data.progressJob : job));
      setPaymentMessage({
        type: 'success',
        text: `UPI Payment of ₹${data.grossAmount} successful! Transferred directly to Worker (${selectedJobForPayment.workerName || 'Worker'})!`
      });
      setUpiStep('success');
      setTimeout(() => {
        setShowUpiModal(false);
      }, 1500);
    } catch (err) {
      console.error('Confirm UPI Payment error:', err);
      setPaymentMessage({ type: 'error', text: 'UPI Payment failed.' });
      setUpiStep('select');
    } finally {
      setPaymentLoading(false);
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

      const cleanPhone = newJobForm.contactNumber.trim().replace(/[\s-]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setSettingsMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number (e.g., 9876543210).' });
        return;
      }

      if (newJobForm.title.trim().length < 3) {
        setSettingsMessage({ type: 'error', text: 'Job title must be at least 3 characters long.' });
        return;
      }

      if (newJobForm.description.trim().length < 10) {
        setSettingsMessage({ type: 'error', text: 'Job description must be at least 10 characters long.' });
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
      const interval = setInterval(() => {
        void fetchJobHistory(true);
      }, 3000);
      return () => clearInterval(interval);
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
              <div className="flex items-center gap-4">
                <div className="bg-zinc-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-zinc-800 text-right shadow-inner">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Balance</p>
                  <p className="text-xl font-black text-emerald-400">₹{(user?.accountBalance || 0).toLocaleString('en-IN')}</p>
                </div>
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-lg"
                >
                  Logout
                </button>
              </div>
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
                                    <div className="flex flex-col items-end gap-2">
                                       <span className="ml-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#C21A4B]/10 text-[#C21A4B] whitespace-nowrap uppercase tracking-wide">
                                         Accepted
                                       </span>
                                       <span className={`ml-4 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                                         job.paymentStatus === 'paid'
                                           ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                           : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                       }`}>
                                         {job.paymentStatus === 'paid' ? `Paid (₹${job.paidAmount || job.price})` : 'Unpaid'}
                                       </span>
                                     </div>
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
                                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-bold mb-2">In-Progress Job Details & Chat</p>
                                    <h3 className="text-xl font-bold text-zinc-950">{selectedProgressJob.workerName || 'Assigned Worker'}</h3>
                                    <p className="text-sm text-zinc-600">{selectedProgressJob.title}</p>
                                  </div>
                                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200 text-xs font-semibold uppercase tracking-[0.15em] text-[#C21A4B]">
                                    {selectedProgressJob.status?.replace('-', ' ') || 'In Progress'}
                                  </div>
                                </div>

                                <WorkerLiveMap
                                  key={selectedProgressJob._id}
                                  job={selectedProgressJob}
                                />

                                 {/* Payment & Escrow Dual-Transaction Card */}
                                 <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 space-y-4 shadow-xs">
                                   <div className="flex items-center justify-between gap-4">
                                     <div>
                                       <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Payment & Escrow Status</p>
                                       <p className="text-xl font-black text-zinc-950">Job Price: ₹{selectedProgressJob.price || 0}</p>
                                     </div>
                                     <div>
                                       {selectedProgressJob.paymentStatus === 'paid' ? (
                                         <span className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                                           <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                           </svg>
                                           Paid (₹{selectedProgressJob.paidAmount || selectedProgressJob.price})
                                         </span>
                                       ) : (
                                         <span className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500/10 text-amber-700 border border-amber-500/30 uppercase tracking-wider">
                                           Payment Pending
                                         </span>
                                       )}
                                     </div>
                                   </div>

                                   {selectedProgressJob.paymentStatus === 'paid' ? (
                                     <div className="rounded-xl bg-white border border-zinc-200 p-4 space-y-3 shadow-xs">
                                       <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                          <p className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">Direct Payment Audit Receipt</p>
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Direct Verified</span>
                                        </div>

                                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
                                          <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Txn Type: User → Worker Bank Acc</p>
                                            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/60 px-2 py-0.5 rounded">0% Commission</span>
                                          </div>
                                          <p className="font-extrabold text-emerald-700 text-base">Direct Worker Transfer (100%): ₹{selectedProgressJob.paidAmount || selectedProgressJob.price || 0}</p>
                                          <p className="text-[10px] text-zinc-500 font-mono break-all">Transaction ID: {selectedProgressJob.transactionId || 'TXN_DIRECT_...'}</p>
                                          <p className="text-[10px] text-emerald-600 font-bold">Recipient: {selectedProgressJob.workerName || 'Worker Bank Account'}</p>
                                        </div>
                                     </div>
                                   ) : (
                                     <div className="pt-1 space-y-3">
                                       <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                                         <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Select Payment Method</p>
                                         <div className="grid grid-cols-4 gap-2">
                                           {[
                                             { id: 'gpay', label: 'GPay UPI', icon: '🟢' },
                                             { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                                             { id: 'paytm', label: 'Paytm', icon: '🔵' },
                                             { id: 'upi_id', label: 'UPI ID', icon: '🆔' },
                                           ].map((method) => (
                                             <button
                                               key={method.id}
                                               type="button"
                                               onClick={() => setSelectedPaymentMethod(method.id)}
                                               className={`py-2 px-2 rounded-lg text-xs font-bold transition text-center border ${
                                                 selectedPaymentMethod === method.id
                                                   ? 'border-[#C21A4B] bg-[#C21A4B]/10 text-[#C21A4B]'
                                                   : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                                               }`}
                                             >
                                               <span className="mr-1">{method.icon}</span>
                                               {method.label}
                                             </button>
                                           ))}
                                         </div>

                                         {selectedPaymentMethod === 'upi_id' && (
                                           <div className="pt-2">
                                             <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Enter your UPI ID / VPA</label>
                                             <input
                                               type="text"
                                               value={upiIdInput}
                                               onChange={(e) => setUpiIdInput(e.target.value)}
                                               placeholder="e.g. yourname@okicici or 9876543210@paytm"
                                               className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#C21A4B]"
                                             />
                                           </div>
                                         )}
                                       </div>

                                       <button
                                         type="button"
                                         disabled={paymentLoading}
                                         onClick={() => handlePayJob(selectedProgressJob)}
                                         className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 shadow-md transition duration-300 flex items-center justify-center gap-2 tracking-wide disabled:opacity-50 cursor-pointer"
                                       >
                                         {paymentLoading ? (
                                           <>
                                             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                             Processing UPI Payment...
                                           </>
                                         ) : (
                                           <>
                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                             </svg>
                                             Pay ₹{selectedProgressJob.price || 0} via {selectedPaymentMethod === 'upi_id' ? (upiIdInput ? `UPI (${upiIdInput})` : 'UPI ID') : selectedPaymentMethod === 'gpay' ? 'GPay UPI' : selectedPaymentMethod === 'phonepe' ? 'PhonePe UPI' : 'Paytm UPI'}
                                           </>
                                         )}
                                       </button>
                                     </div>
                                   )}

                                   {paymentMessage && (
                                     <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                                       paymentMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' :
                                       paymentMessage.type === 'error' ? 'bg-red-500/10 text-red-700 border border-red-500/30' : 'bg-zinc-100 text-zinc-700'
                                     }`}>
                                       {paymentMessage.text}
                                     </div>
                                   )}
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
                                        selectedProgressJob?.paymentStatus === 'paid' ? (
                                          <button
                                            type="button"
                                            onClick={handleConfirmCompletion}
                                            className="rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition shadow-xs cursor-pointer"
                                          >
                                            Confirm Completion
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCompletionStatus({ type: 'error', text: 'Payment is required before confirming completion. Please complete payment above first.' });
                                            }}
                                            className="rounded-2xl border border-amber-500 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Payment Required Before Completion
                                          </button>
                                        )
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
                          type="tel"
                          maxLength={10}
                          value={newJobForm.contactNumber}
                          onChange={(e) => setNewJobForm({ ...newJobForm, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full px-5 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium focus:bg-white"
                          placeholder="10-digit mobile number (e.g. 9876543210)"
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
      {/* UPI Escrow Checkout Modal */}
      {showUpiModal && selectedJobForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shadow-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-950">UPI Instant Payment</h3>
                  <p className="text-xs text-zinc-500 font-medium">NearHire Escrow System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Job Title & Amount</p>
              <p className="text-base font-extrabold text-zinc-900 mt-0.5">{selectedJobForPayment.title}</p>
              <div className="mt-3 flex justify-between items-end border-t border-zinc-200/60 pt-3">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Escrow Transfer</p>
                  <p className="text-xs text-emerald-700 font-bold">100% Direct Worker Payout | 0% Commission</p>
                </div>
                <p className="text-2xl font-black text-emerald-600">₹{selectedJobForPayment.price || 0}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Select UPI App / Payment Option</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                  { id: 'paytm', name: 'Paytm UPI', icon: '🔵' },
                  { id: 'qr', name: 'Scan UPI QR', icon: '📷' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(app.id)}
                    className={`p-3 rounded-2xl border text-left font-bold text-xs transition flex items-center gap-2.5 cursor-pointer ${
                      selectedPaymentMethod === app.id
                        ? 'border-[#C21A4B] bg-[#C21A4B]/10 text-[#C21A4B] ring-2 ring-[#C21A4B]/20'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-lg">{app.icon}</span>
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>

              {selectedPaymentMethod === 'qr' ? (
                <div className="bg-zinc-900 text-white rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Scan QR with any UPI App</p>
                  <div className="w-40 h-40 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg">
                    <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M0,0 H40 V40 H0 Z M10,10 V30 H30 V10 Z M15,15 H25 V25 H15 Z" fill="#000" />
                      <path d="M60,0 H100 V40 H60 Z M70,10 V30 H90 V10 Z M75,15 H85 V25 H75 Z" fill="#000" />
                      <path d="M0,60 H40 V100 H0 Z M10,70 V90 H30 V70 Z M15,75 H25 V85 H15 Z" fill="#000" />
                      <rect x="45" y="10" width="10" height="20" fill="#000" />
                      <rect x="10" y="45" width="20" height="10" fill="#000" />
                      <rect x="45" y="45" width="15" height="15" fill="#C21A4B" />
                      <rect x="70" y="45" width="20" height="10" fill="#000" />
                      <rect x="45" y="70" width="20" height="25" fill="#000" />
                      <rect x="70" y="75" width="20" height="20" fill="#000" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-zinc-400">Scan using GPay, PhonePe, Paytm or BHIM to pay ₹{selectedJobForPayment.price || 0}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider">UPI ID / Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder={
                      selectedPaymentMethod === 'gpay' ? `${user?.phone || '9876543210'}@okicici` :
                      selectedPaymentMethod === 'phonepe' ? `${user?.phone || '9876543210'}@ybl` :
                      selectedPaymentMethod === 'paytm' ? `${user?.phone || '9876543210'}@paytm` : 'username@upi'
                    }
                    className="w-full px-4 py-3 text-sm font-semibold border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C21A4B]"
                  />
                </div>
              )}
            </div>

            {upiStep === 'processing' ? (
              <div className="bg-emerald-50 rounded-2xl p-4 text-center space-y-2 border border-emerald-200">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent mx-auto"></div>
                <p className="text-sm font-extrabold text-emerald-800">Verifying UPI PIN & Authorizing Transfer...</p>
                <p className="text-xs text-emerald-600">Executing Direct Instant Transfer to Worker Bank Account</p>
              </div>
            ) : upiStep === 'success' ? (
              <div className="bg-emerald-600 text-white rounded-2xl p-4 text-center space-y-1 shadow-lg">
                <p className="text-lg font-black">🎉 UPI Payment Successful!</p>
                <p className="text-xs font-semibold">₹{selectedJobForPayment.price} transferred via {selectedPaymentMethod.toUpperCase()}</p>
              </div>
            ) : (
              <button
                type="button"
                disabled={paymentLoading}
                onClick={handleConfirmUpiPayment}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-6 shadow-xl transition duration-300 flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer"
              >
                Authorize & Pay ₹{selectedJobForPayment.price || 0} via {selectedPaymentMethod === 'gpay' ? 'Google Pay UPI' : selectedPaymentMethod === 'phonepe' ? 'PhonePe UPI' : selectedPaymentMethod === 'paytm' ? 'Paytm UPI' : selectedPaymentMethod === 'qr' ? 'UPI QR Code' : 'UPI ID'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Worker Rating & Feedback Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-zinc-200 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl">
                ⭐
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                Rate Worker ({selectedProgressJob?.workerName || 'Worker'})
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                How was your experience for "{selectedProgressJob?.title || 'this job'}"?
              </p>
            </div>

            {/* Interactive Star Rating Selector */}
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || ratingValue) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingValue(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <svg
                        className={`w-9 h-9 transition-colors duration-150 ${
                          isFilled ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 fill-zinc-100'
                        }`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {ratingValue === 5 ? '5 Stars - Outstanding!' :
                 ratingValue === 4 ? '4 Stars - Very Good' :
                 ratingValue === 3 ? '3 Stars - Average' :
                 ratingValue === 2 ? '2 Stars - Poor' : '1 Star - Terribly Unsatisfied'}
              </p>
            </div>

            {/* Optional Review Text Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                Written Feedback (Optional)
              </label>
              <textarea
                value={userReviewInput}
                onChange={(e) => setUserReviewInput(e.target.value)}
                placeholder="Share your experience working with this worker..."
                rows={3}
                className="w-full px-4 py-3 text-xs font-medium border border-zinc-300 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C21A4B] resize-none"
              />
            </div>

            {/* Submit & Confirm Completion Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmCompletionWithRating(ratingValue, userReviewInput)}
                className="w-full rounded-2xl bg-[#C21A4B] hover:bg-[#A1133C] text-white font-extrabold py-3.5 px-6 shadow-xl transition duration-300 text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Complete Job & Submit ⭐ {ratingValue}/5 Rating</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="w-full rounded-2xl border border-zinc-300 hover:bg-zinc-100 text-zinc-600 font-bold py-2.5 px-4 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
