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
  const [progressJobs, setProgressJobs] = useState([])
  const [selectedProgressJobId, setSelectedProgressJobId] = useState(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [progressMessageStatus, setProgressMessageStatus] = useState(null)
  const [completionStatus, setCompletionStatus] = useState(null)
  const [activeSection, setActiveSection] = useState('profile')
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

  const fetchProgressJobs = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/jobs/worker-progress`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch progress jobs')
      }

      const data = await response.json()
      setProgressJobs(data.progressJobs ?? [])
    } catch (err) {
      console.error('Fetch progress jobs error:', err)
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

  const handleProgressMessageChange = (text) => {
    setProgressMessage(text)
    setProgressMessageStatus(null)
  }

  const handleSendProgressMessage = async () => {
    if (!selectedProgressJobId) {
      setProgressMessageStatus({ type: 'error', text: 'Select a job first.' })
      return
    }

    const trimmed = progressMessage.trim()
    if (!trimmed) {
      setProgressMessageStatus({ type: 'error', text: 'Enter a message.' })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in again.')
      navigate('/signinWorker')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedProgressJobId}/message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmed }),
      })

      const data = await response.json()
      if (response.ok) {
        setProgressMessage('')
        setProgressMessageStatus({ type: 'success', text: 'Message sent.' })
        setProgressJobs((prev) => prev.map((job) => (job._id === selectedProgressJobId ? data.progressJob : job)))
      } else {
        setProgressMessageStatus({ type: 'error', text: data.message || 'Failed to send message.' })
      }
    } catch (err) {
      console.error('Send progress message error:', err)
      setProgressMessageStatus({ type: 'error', text: 'Failed to send message.' })
    }
  }

  const handleRequestJobCompletion = async () => {
    if (!selectedProgressJobId) {
      return
    }

    const confirmed = window.confirm('Request job completion from the user?')
    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in again.')
      navigate('/signinWorker')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/progress/${selectedProgressJobId}/request-completion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (!response.ok) {
        setCompletionStatus({ type: 'error', text: data.message || 'Failed to request completion.' })
        return
      }

      setProgressJobs((prev) => prev.map((job) => (job._id === selectedProgressJobId ? data.progressJob : job)))
      setCompletionStatus({ type: 'success', text: 'Completion requested. Waiting for user confirmation.' })
      setProgressMessage('')
      setProgressMessageStatus(null)
    } catch (err) {
      console.error('Request completion error:', err)
      setCompletionStatus({ type: 'error', text: 'Failed to request completion.' })
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
    fetchProgressJobs()
  }, [])

  useEffect(() => {
    if (!selectedProgressJobId && progressJobs.length > 0) {
      setSelectedProgressJobId(progressJobs[0]._id)
    }
  }, [progressJobs, selectedProgressJobId])

  const selectedProgressJob = progressJobs.find((job) => job._id === selectedProgressJobId)

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
      <div className="w-full px-6 py-8 flex-1 min-h-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200 h-full flex flex-col">
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

          <div className="flex flex-1 min-h-0">
            <aside className="w-72 border-r border-zinc-200 bg-zinc-50 flex flex-col shrink-0">
              <nav className="flex-1 py-8 px-4 space-y-1">
                {[
                  {
                    id: 'profile',
                    label: 'Profile',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    ),
                  },
                  {
                    id: 'bank',
                    label: 'Bank',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5h18M5.25 10.5V5.25a.75.75 0 01.75-.75h12a.75.75 0 01.75.75V10.5M4.5 19.5h15M4.5 16.5h15"></path>
                      </svg>
                    ),
                  },
                  {
                    id: 'tasks',
                    label: 'Tasks',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"></path>
                      </svg>
                    ),
                  },
                  {
                    id: 'progress',
                    label: 'In Progress',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4h3V4h2v12h3l-4 4z"></path>
                      </svg>
                    ),
                  },
                ].map((tab) => {
                  const isActive = activeSection === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSection(tab.id)}
                      className={`w-full flex items-center gap-3.5 py-3 px-5 rounded-xl font-bold transition duration-300 text-xs tracking-wider uppercase ${
                        isActive
                          ? 'bg-[#C21A4B]/10 text-[#C21A4B] shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/50'
                      }`}
                    >
                      <span className={isActive ? 'text-[#C21A4B]' : 'text-zinc-400'}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  )
                })}
              </nav>

              <div className="px-4 pb-6 pt-4 border-t border-zinc-200 space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current location</p>
                <p className="text-sm font-semibold text-zinc-900">{location.address || 'Retrieving current location...'}</p>
                <p className="text-xs text-zinc-500">Lat: {location.latitude?.toFixed(4) ?? '--'}</p>
                <p className="text-xs text-zinc-500">Lng: {location.longitude?.toFixed(4) ?? '--'}</p>
              </div>
            </aside>

            <div className="p-12 overflow-y-auto flex-1 bg-zinc-50/50">
              <div className="grid gap-6 sm:grid-cols-2 mb-8">
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

              <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Worker Dashboard</h2>
                    <p className="text-xs font-bold text-[#C21A4B] tracking-widest uppercase mt-1">View and manage your profile, bank details, tasks and jobs</p>
                  </div>
                </div>

                <div className="mt-8">
                  {activeSection === 'profile' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-zinc-950">Profile Details</h3>
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
                  )}

                  {activeSection === 'bank' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-zinc-950">Bank Details</h3>
                      <p className="text-sm text-zinc-600">Update payout information for direct transfers.</p>
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
                        <button className="rounded-2xl bg-[#C21A4B] px-6 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition">Save Bank Details</button>
                      </form>
                    </div>
                  )}

                  {activeSection === 'tasks' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-zinc-950">Previous Tasks</h3>
                      <p className="text-sm text-zinc-600">Recent completed jobs and payouts.</p>
                      <div className="space-y-4">
                        {previousTasks.map((task) => (
                          <div key={task.id} className="rounded-2xl bg-zinc-50/50 p-5 border border-zinc-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  )}

                  {activeSection === 'progress' && (
                    <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-zinc-950">In Progress Jobs</h3>
                            <p className="text-sm text-zinc-600">Jobs you have already accepted.</p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700">{progressJobs.length} active</span>
                        </div>

                        {progressJobs.length > 0 ? (
                          <div className="space-y-3">
                            {progressJobs.map((job) => {
                              const isSelected = job._id === selectedProgressJobId
                              return (
                                <button
                                  key={job._id}
                                  type="button"
                                  onClick={() => setSelectedProgressJobId(job._id)}
                                  className={`w-full text-left rounded-2xl border p-5 transition ${
                                    isSelected ? 'border-[#C21A4B] bg-[#C21A4B]/10 shadow-sm' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                                      <p className="text-xs text-zinc-500 mt-1">{job.category} · {job.address}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-[#C21A4B]">₹{job.price ?? 'N/A'}</p>
                                      <span className="inline-block mt-1 text-xs text-green-700 uppercase tracking-[0.12em] font-semibold">{job.status?.replace('-', ' ')}</span>
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-zinc-600">
                                    <div>
                                      <p className="font-semibold text-zinc-900">Customer</p>
                                      <p>{job.userName}</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-zinc-900">Messages</p>
                                      <p>{job.messages?.length ?? 0}</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
                            You have not accepted any jobs yet.
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 shadow-xs">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-zinc-950">Job Chat</h4>
                          <p className="text-sm text-zinc-600">Message the customer for the selected in-progress job.</p>
                        </div>

                        {!selectedProgressJob ? (
                          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
                            Select a job to view its chat history.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="rounded-2xl bg-white border border-zinc-200 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">{selectedProgressJob.title}</p>
                                  <p className="text-xs text-zinc-500">{selectedProgressJob.userName} · {selectedProgressJob.category}</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-[#C21A4B]/10 px-3 py-1 text-xs font-semibold text-[#C21A4B]">{selectedProgressJob.messages?.length ?? 0} messages</span>
                              </div>
                            </div>

                            <div className="space-y-3 max-h-[340px] overflow-y-auto rounded-2xl bg-white border border-zinc-200 p-4">
                              {selectedProgressJob.messages?.length > 0 ? (
                                selectedProgressJob.messages.map((message, idx) => (
                                  <div key={idx} className="space-y-1 rounded-2xl px-4 py-3 bg-zinc-50">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700">{message.sender}</p>
                                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">{new Date(message.time).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-zinc-700">{message.text}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
                                  No chat messages yet for this job.
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <textarea
                                rows={3}
                                value={progressMessage}
                                onChange={(e) => handleProgressMessageChange(e.target.value)}
                                className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B]"
                                placeholder="Type a message to the customer"
                              />
                              {progressMessageStatus && (
                                <p className={`text-sm ${progressMessageStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                  {progressMessageStatus.text}
                                </p>
                              )}
                              {completionStatus && (
                                <p className={`text-sm ${completionStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                  {completionStatus.text}
                                </p>
                              )}
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  onClick={handleSendProgressMessage}
                                  className="inline-flex items-center justify-center rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition"
                                >
                                  Send Message
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRequestJobCompletion}
                                  disabled={selectedProgressJob?.completionRequested}
                                  className={`inline-flex items-center justify-center rounded-2xl border border-[#C21A4B] bg-white px-5 py-3 text-sm font-bold text-[#C21A4B] transition ${selectedProgressJob?.completionRequested ? 'cursor-not-allowed opacity-60' : 'hover:bg-[#C21A4B]/10'}`}
                                >
                                  {selectedProgressJob?.completionRequested ? 'Completion Requested' : 'Request Completion'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
