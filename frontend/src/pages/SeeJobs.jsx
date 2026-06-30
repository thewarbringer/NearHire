import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function SeeJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priceInput, setPriceInput] = useState({})
  const [requestStatus, setRequestStatus] = useState({})
  const [messageInputs, setMessageInputs] = useState({})
  const [messageStatus, setMessageStatus] = useState({})
  const [priceEditInputs, setPriceEditInputs] = useState({})
  const [priceEditStatus, setPriceEditStatus] = useState({})
  const [requests, setRequests] = useState([])
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [activeTab, setActiveTab] = useState('available')
  const navigate = useNavigate()

  const fetchNearbyJobs = async (latitude, longitude) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in first.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/nearby?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        setError('Session expired. Please sign in again.')
        setTimeout(() => navigate('/signinWorker'), 1500)
      } else {
        const data = await response.json()
        setError(data.message || 'Unable to fetch nearby jobs.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load nearby jobs.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRequests = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/jobs/my-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Failed to load my requests', err)
    }
  }

  useEffect(() => {
    const tryLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.')
        setLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(coords)
          fetchNearbyJobs(coords.lat, coords.lng)
        },
        (err) => {
          console.error('Geolocation error:', err)
          setError('Unable to retrieve current location. Please allow location access and refresh.')
          setLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }

    tryLocation()
  }, [])

  useEffect(() => {
    fetchMyRequests()
  }, [])

  const handlePriceChange = (jobId, value) => {
    setPriceInput((prev) => ({ ...prev, [jobId]: value }))
    setRequestStatus((prev) => ({ ...prev, [jobId]: null }))
  }

  const handleEditPriceChange = (requestId, value) => {
    setPriceEditInputs((prev) => ({ ...prev, [requestId]: value }))
    setPriceEditStatus((prev) => ({ ...prev, [requestId]: null }))
  }

  const handleMessageInputChange = (requestId, value) => {
    setMessageInputs((prev) => ({ ...prev, [requestId]: value }))
    setMessageStatus((prev) => ({ ...prev, [requestId]: null }))
  }

  const handleSendMessage = async (jobId, requestId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in to send a message.')
      navigate('/signinWorker')
      return
    }

    const text = (messageInputs[requestId] || '').trim()
    if (!text) {
      setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: 'Enter a message.' } }))
      return
    }

    setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'loading', text: 'Sending message...' } }))

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/request/${requestId}/message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'success', text: 'Message sent.' } }))
        setMessageInputs((prev) => ({ ...prev, [requestId]: '' }))
        await fetchMyRequests()
      } else {
        const data = await response.json()
        setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: data.message || 'Failed to send message.' } }))
      }
    } catch (err) {
      console.error(err)
      setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: 'Failed to send message.' } }))
    }
  }

  const handleRequest = async (jobId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in to send a request.')
      navigate('/signinWorker')
      return
    }

    const price = Number(priceInput[jobId])
    if (!price || price <= 0) {
      setRequestStatus((prev) => ({ ...prev, [jobId]: { type: 'error', text: 'Enter a valid price.' } }))
      return
    }

    setRequestStatus((prev) => ({ ...prev, [jobId]: { type: 'loading', text: 'Submitting request...' } }))

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequestStatus((prev) => ({ ...prev, [jobId]: { type: 'success', text: data.message || 'Request submitted.' } }))
        setPriceInput((prev) => ({ ...prev, [jobId]: '' }))
        fetchMyRequests()
      } else {
        const data = await response.json()
        setRequestStatus((prev) => ({ ...prev, [jobId]: { type: 'error', text: data.message || 'Request failed.' } }))
      }
    } catch (err) {
      console.error(err)
      setRequestStatus((prev) => ({ ...prev, [jobId]: { type: 'error', text: 'Request failed. Please try again.' } }))
    }
  }

  const handleUpdateRequestPrice = async (jobId, requestId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in to update the price.')
      navigate('/signinWorker')
      return
    }

    const priceValue = priceEditInputs[requestId]
    const price = Number(priceValue)
    if (!price || price <= 0) {
      setPriceEditStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: 'Enter a valid price.' } }))
      return
    }

    setPriceEditStatus((prev) => ({ ...prev, [requestId]: { type: 'loading', text: 'Updating price...' } }))

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/request/${requestId}/price`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      })

      if (response.ok) {
        const data = await response.json()
        setPriceEditStatus((prev) => ({ ...prev, [requestId]: { type: 'success', text: data.message || 'Price updated.' } }))
        fetchMyRequests()
      } else {
        const data = await response.json()
        setPriceEditStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: data.message || 'Price update failed.' } }))
      }
    } catch (err) {
      console.error(err)
      setPriceEditStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: 'Unable to update price.' } }))
    }
  }

  return (
    <div className="h-screen bg-black text-zinc-800 flex flex-col overflow-hidden">
      <div className="w-full px-6 py-8 flex-1 min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200 flex flex-col h-full w-full">
          
          {/* Header Panel (Contrast Dark Element) */}
          <div className="bg-gradient-to-r from-black via-zinc-950 to-white p-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 shrink-0 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C21A4B]">Worker Portal</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                {activeTab === 'available' ? 'Available jobs within 20km' : 'My Requests'}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {activeTab === 'available'
                  ? 'Browse jobs near you and send a request with your price.'
                  : 'Track status and pricing of your job requests.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/workerDashboard')}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-650 transition uppercase tracking-[0.1em]"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Sidebar & Content Container */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-full md:w-64 bg-zinc-50 border-r border-zinc-200 p-6 flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('available')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'available'
                    ? 'bg-[#C21A4B] text-white shadow-md'
                    : 'text-zinc-600 hover:bg-zinc-150/60 hover:text-zinc-900 border border-transparent'
                }`}
              >
                <span>Available Jobs</span>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === 'available' ? 'bg-white text-[#C21A4B]' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {jobs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'requests'
                    ? 'bg-[#C21A4B] text-white shadow-md'
                    : 'text-zinc-600 hover:bg-zinc-150/60 hover:text-zinc-900 border border-transparent'
                }`}
              >
                <span>My Requests</span>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === 'requests' ? 'bg-white text-[#C21A4B]' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {requests.length}
                </span>
              </button>
            </div>

            {/* Right Main Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-8 bg-zinc-50/20">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {activeTab === 'available' && (
                  <>
                    {loading ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-xs">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C21A4B] mx-auto mb-4"></div>
                        <p className="font-semibold text-zinc-600">Fetching nearby jobs...</p>
                      </div>
                    ) : error ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-red-650 font-bold shadow-xs">
                        {error}
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-medium shadow-xs">
                        No active jobs found within 20km of your current location.
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {jobs.map((job) => (
                          <article key={job._id} className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                              <div className="max-w-2xl flex-1">
                                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#C21A4B] mb-3 font-bold">
                                  <span>{job.category}</span>
                                  <span>·</span>
                                  <span>{job.distance ? `${job.distance.toFixed(1)} km away` : 'Distance unknown'}</span>
                                </div>
                                <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">{job.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-zinc-600">{job.description}</p>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                  <div className="rounded-xl bg-zinc-50/50 p-4 border border-zinc-200/60">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Address</p>
                                    <p className="mt-2 text-sm font-semibold text-zinc-900">{job.address}</p>
                                  </div>
                                  <div className="rounded-xl bg-zinc-50/50 p-4 border border-zinc-200/60">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Contact</p>
                                    <p className="mt-2 text-sm font-semibold text-zinc-900">{job.contactNumber}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50/30 p-6 shadow-xs shrink-0">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Request your price</p>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.5"
                                  value={priceInput[job._id] ?? ''}
                                  onChange={(e) => handlePriceChange(job._id, e.target.value)}
                                  className="mt-4 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B] font-medium"
                                  placeholder="Enter price in ₹"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRequest(job._id)}
                                  className="mt-4 w-full rounded-xl bg-[#C21A4B] py-3 text-white font-bold hover:bg-[#A1133C] transition shadow-md uppercase tracking-wider text-xs"
                                >
                                  Request Job
                                </button>
                                {requestStatus[job._id] && (
                                  <div className={`mt-3 p-3 rounded-lg border text-xs font-semibold ${
                                    requestStatus[job._id].type === 'success'
                                      ? 'bg-green-50 border-green-200 text-green-700'
                                      : requestStatus[job._id].type === 'error'
                                      ? 'bg-red-50 border-red-200 text-red-700'
                                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                                  }`}>
                                    {requestStatus[job._id].text}
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {requests.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-medium shadow-xs">
                        You have not requested any jobs yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((item) => {
                          const lastSender = item.request?.messages?.length ? item.request.messages[item.request.messages.length - 1].sender : null
                          const hasNew = lastSender === 'Job Owner'

                          return (
                            <div key={item.jobId} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-2xl flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C21A4B]">{item.category}</p>
                                    {hasNew && (
                                      <span className="inline-flex items-center rounded-full bg-[#C21A4B] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                        New message
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{item.title}</h3>
                                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{item.address}</p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 shrink-0">
                                  <div className="rounded-xl bg-zinc-50/50 p-4 border border-zinc-200 shadow-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Request Price</p>
                                    <p className="mt-2 text-sm font-bold text-[#C21A4B]">₹{item.request?.price ?? '—'}</p>
                                  </div>
                                  <div className="rounded-xl bg-zinc-50/50 p-4 border border-zinc-200 shadow-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Requested</p>
                                    <p className="mt-2 text-sm font-bold text-zinc-900">{item.request?.date ? new Date(item.request.date).toLocaleDateString() : '—'}</p>
                                  </div>
                                  <div className="rounded-xl bg-zinc-50/50 p-4 border border-zinc-200 shadow-xs flex flex-col justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Job Status</p>
                                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-center border ${
                                      item.status === 'pending'
                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                        : item.status === 'accepted' || item.status === 'completed'
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 border-t border-zinc-200 pt-6">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-900">Chat</p>
                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                                    {item.request?.messages?.length ?? 0} messages
                                  </span>
                                </div>

                                {item.request?.messages?.length > 0 ? (
                                  <div className="space-y-3 mb-4">
                                    {item.request.messages.map((message, idx) => (
                                      <div key={idx} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-700">{message.sender}</p>
                                          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">{new Date(message.time).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-zinc-700">{message.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-zinc-500 italic mb-4">No chat messages yet.</p>
                                )}

                                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                                  <div className="space-y-3">
                                    <textarea
                                      rows="3"
                                      value={messageInputs[item.request?.requestId] ?? ''}
                                      onChange={(e) => handleMessageInputChange(item.request?.requestId, e.target.value)}
                                      placeholder="Send a message to the job owner"
                                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#C21A4B]"
                                    />
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleSendMessage(item.jobId, item.request?.requestId)}
                                        className="inline-flex items-center justify-center rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition"
                                      >
                                        Send Message
                                      </button>
                                      {messageStatus[item.request?.requestId] && (
                                        <p className={`text-sm ${messageStatus[item.request?.requestId].type === 'success' ? 'text-green-700' : messageStatus[item.request?.requestId].type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                                          {messageStatus[item.request?.requestId].text}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Update Price</p>
                                    <input
                                      type="number"
                                      min="1"
                                      step="0.5"
                                      value={priceEditInputs[item.request?.requestId] ?? item.request?.price ?? ''}
                                      onChange={(e) => handleEditPriceChange(item.request?.requestId, e.target.value)}
                                      className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#C21A4B] focus:ring-1 focus:ring-[#C21A4B]"
                                      placeholder="₹ price"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRequestPrice(item.jobId, item.request?.requestId)}
                                      className="mt-3 w-full rounded-2xl bg-[#C21A4B] py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-[#A1133C] transition"
                                    >
                                      Update Price
                                    </button>
                                    {priceEditStatus[item.request?.requestId] && (
                                      <p className={`mt-3 text-xs ${priceEditStatus[item.request?.requestId].type === 'success' ? 'text-green-700' : priceEditStatus[item.request?.requestId].type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                                        {priceEditStatus[item.request?.requestId].text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
