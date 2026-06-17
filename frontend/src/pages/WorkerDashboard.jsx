import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function WorkerDashboard() {
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: null })
  const [settingsForm, setSettingsForm] = useState({ bankAccountNumber: '', ifscCode: '' })
  const [settingsMessage, setSettingsMessage] = useState(null)
  const navigate = useNavigate()
  const [previousTasks] = useState([
    { id: 1, title: 'Kitchen Plumbing', date: '2026-05-15', amount: 120, status: 'Completed' },
    { id: 2, title: 'Electrical Repair', date: '2026-05-18', amount: 95, status: 'Completed' },
    { id: 3, title: 'House Help Visit', date: '2026-05-20', amount: 80, status: 'Completed' },
  ])

  const earnings = previousTasks.reduce((sum, task) => sum + task.amount, 0)

  const fetchWorkerProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No token found. Please sign in.')
      setLoading(false)
      setTimeout(() => navigate('/signinWorker'), 1500)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/worker-profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWorker(data.worker)
        setSettingsForm({
          bankAccountNumber: data.worker.bankAccountNumber || '',
          ifscCode: data.worker.ifscCode || '',
        })
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        setError('Session expired. Please sign in again.')
        setTimeout(() => navigate('/signinWorker'), 1500)
      } else {
        const data = await response.json()
        setError(data.message || 'Unable to load worker profile')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while loading your dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocation = async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation((prev) => ({ ...prev, latitude, longitude }))

        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`${API_BASE}/api/location/get-locality`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
          })

          if (response.ok) {
            const data = await response.json()
            setLocation((prev) => ({ ...prev, address: data.fullAddress || data.displayName || 'Location retrieved' }))
          }
        } catch (err) {
          console.error('Location fetch failed', err)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
      }
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettingsForm((prev) => ({ ...prev, [name]: value }))
    setSettingsMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in again.')
      navigate('/signinWorker')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/worker-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsForm),
      })

      if (response.ok) {
        setSettingsMessage({ type: 'success', text: 'Bank details updated successfully.' })
        fetchWorkerProfile()
      } else {
        const data = await response.json()
        setSettingsMessage({ type: 'error', text: data.message || 'Unable to update bank details' })
      }
    } catch (err) {
      console.error(err)
      setSettingsMessage({ type: 'error', text: 'An error occurred while saving settings' })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/')
  }

  useEffect(() => {
    fetchWorkerProfile()
    fetchLocation()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C21A4B] mx-auto mb-4"></div>
          <p className="font-semibold text-zinc-600">Loading worker dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-xl font-medium text-sm">
            {error}
          </div>
          <button
            onClick={() => navigate('/signinWorker')}
            className="bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 shadow-md text-sm uppercase tracking-wider w-full"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-zinc-800 flex flex-col overflow-hidden">
      <div className="w-full px-6 py-8 flex-1 min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200 flex flex-col h-full w-full">
          
          {/* Header Panel (Contrast Dark Element) */}
          <div className="bg-gradient-to-r from-black via-zinc-950 to-white p-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 shrink-0 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C21A4B]">Worker Dashboard</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">Welcome back, {worker.name}!</h1>
              <p className="text-sm text-zinc-400 mt-1">{worker.specialization} · {worker.preferredLocation}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/workerJobs')}
                className="inline-flex items-center justify-center rounded-xl bg-[#C21A4B] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#A1133C] transition shadow-md uppercase tracking-[0.1em]"
              >
                See Nearby Jobs
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-650 transition uppercase tracking-[0.1em]"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto min-h-0 p-8 bg-zinc-50/50">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] max-w-7xl mx-auto">
              
              {/* Left Column */}
              <div className="space-y-8">
                
                {/* Stats Section */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">Location</p>
                      <p className="text-sm font-semibold text-zinc-900">{location.address || 'Retrieving your current location...'}</p>
                    </div>
                    <p className="text-xs text-[#C21A4B] font-semibold mt-4">Lat: {location.latitude?.toFixed(4) ?? '--'}, Lon: {location.longitude?.toFixed(4) ?? '--'}</p>
                  </div>
                  
                  <div className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Earnings</p>
                      <p className="text-4xl font-extrabold text-[#C21A4B]">${earnings}</p>
                    </div>
                    <p className="text-xs text-zinc-500 font-semibold mt-4">Total earned from recent completed work</p>
                  </div>
                </div>

                {/* Profile Details Card */}
                <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Profile Details</h2>
                    <p className="text-xs font-bold text-[#C21A4B] tracking-widest uppercase mt-1">Your worker profile information</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">{worker.name}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">{worker.email}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">{worker.phone || 'Not set'}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rating</p>
                      <p className="mt-1 text-base font-bold text-[#C21A4B]">{worker.rating?.toFixed(1) || '0.0'} / 5.0 ⭐</p>
                    </div>
                  </div>
                </div>

                {/* Previous Tasks Card */}
                <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Previous Tasks</h2>
                    <p className="text-xs font-bold text-[#C21A4B] tracking-widest uppercase mt-1">Recent completed jobs and payouts</p>
                  </div>
                  <div className="space-y-4">
                    {previousTasks.map((task) => (
                      <div key={task.id} className="rounded-xl bg-zinc-50/30 p-5 border border-zinc-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{task.title}</p>
                          <p className="mt-1 text-lg font-bold text-[#C21A4B]">${task.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-zinc-500">{task.date}</p>
                          <span className="inline-block mt-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-750 font-bold text-xs rounded-lg uppercase tracking-wider">{task.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column / Sidebar */}
              <div className="space-y-8">
                
                {/* Bank Details Form */}
                <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Bank Details</h2>
                    <p className="text-xs font-bold text-[#C21A4B] tracking-widest uppercase mt-1">Configure payout details</p>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Add or update your bank account information. These fields are optional and can be updated at any time.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wider">Account Number</label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={settingsForm.bankAccountNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wider">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={settingsForm.ifscCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] transition-all duration-300 font-medium"
                        placeholder="Enter IFSC code"
                      />
                    </div>
                    {settingsMessage && (
                      <div className={`p-3 rounded-lg border text-xs font-semibold ${
                        settingsMessage.type === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {settingsMessage.text}
                      </div>
                    )}
                    <button className="w-full rounded-xl bg-[#C21A4B] py-3.5 text-white font-bold hover:bg-[#A1133C] transition shadow-md uppercase tracking-wider text-xs">
                      Save Bank Details
                    </button>
                  </form>
                </div>

                {/* Quick Summary */}
                <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Quick Summary</h2>
                    <p className="text-xs font-bold text-[#C21A4B] tracking-widest uppercase mt-1">Profile overview</p>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specialization</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">{worker.specialization}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preferred Location</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">{worker.preferredLocation}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50/50 p-5 border border-zinc-200/60">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bank Status</p>
                      <p className="mt-1 text-base font-bold text-zinc-900">
                        {worker.bankAccountNumber && worker.ifscCode ? (
                          <span className="text-green-750 font-bold">Configured ✓</span>
                        ) : (
                          <span className="text-zinc-500">Not configured</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
