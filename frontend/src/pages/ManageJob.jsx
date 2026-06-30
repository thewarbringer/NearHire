import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function ManageJob() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messageInputs, setMessageInputs] = useState({})
  const [messageStatus, setMessageStatus] = useState({})
  const [acceptStatus, setAcceptStatus] = useState(null)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const navigate = useNavigate()

  const loadJob = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in first.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
      } else if (response.status === 401 || response.status === 403) {
        const data = await response.json()
        setError(data.message || 'You are not authorized to view this job.')
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('role')
        }
      } else {
        const data = await response.json()
        setError(data.message || 'Unable to load the job.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while loading the job.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadJob()
  }, [jobId])

  useEffect(() => {
    if (job?.request?.length && !selectedRequestId) {
      setSelectedRequestId(job.request[0]._id?.toString())
    }
  }, [job, selectedRequestId])

  const selectedRequest = job?.request?.find((request) => request._id?.toString() === selectedRequestId)

  const handleSendMessage = async (requestId) => {
    if (!requestId) return

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please sign in first.')
      return
    }

    const messageText = (messageInputs[requestId] || '').trim()
    if (!messageText) {
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
        body: JSON.stringify({ text: messageText }),
      })

      if (response.ok) {
        setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'success', text: 'Message sent.' } }))
        setMessageInputs((prev) => ({ ...prev, [requestId]: '' }))
        await loadJob()
      } else {
        const data = await response.json()
        setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: data.message || 'Failed to send message.' } }))
      }
    } catch (err) {
      console.error('Send message error:', err)
      setMessageStatus((prev) => ({ ...prev, [requestId]: { type: 'error', text: 'Failed to send message.' } }))
    }
  }

  const handleAcceptRequest = async (requestId) => {
    if (!requestId) return

    const token = localStorage.getItem('token')
    if (!token) {
      setAcceptStatus({ type: 'error', text: 'Please sign in first.' })
      return
    }

    setAcceptStatus({ type: 'loading', text: 'Accepting request...' })

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setAcceptStatus({ type: 'success', text: 'Request accepted successfully. Redirecting...' })
        setTimeout(() => navigate('/userDashboard'), 800)
      } else {
        const data = await response.json()
        setAcceptStatus({ type: 'error', text: data.message || 'Failed to accept request.' })
      }
    } catch (err) {
      console.error('Accept request error:', err)
      setAcceptStatus({ type: 'error', text: 'Failed to accept request.' })
    }
  }

  const handleMessageInputChange = (requestId, value) => {
    setMessageInputs((prev) => ({ ...prev, [requestId]: value }))
    setMessageStatus((prev) => ({ ...prev, [requestId]: null }))
  }

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString()
    } catch {
      return String(value)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C21A4B] mx-auto mb-4"></div>
          <p className="font-semibold text-zinc-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-xl font-medium text-sm">
            {error}
          </div>
          <button
            onClick={() => navigate('/userDashboard')}
            className="bg-[#C21A4B] hover:bg-[#A1133C] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-md text-sm uppercase tracking-wider w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-zinc-800 flex flex-col overflow-hidden">
      <div className="w-full px-6 py-8 flex-1 min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200 p-8 md:p-12 space-y-8 flex flex-col h-full w-full">
          
          {/* Header Panel */}
          <div className="bg-linear-to-r from-black to-white p-8 rounded-2xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-none shrink-0">
            <div>
              <p className="text-[#C21A4B] text-xs font-bold tracking-widest uppercase mb-2">Manage Job</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{job.title}</h1>
              <p className="mt-2 text-zinc-300 text-sm max-w-2xl leading-relaxed">Review the job details and all requests made against this post.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/userDashboard"
                className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3 px-6 rounded-xl transition duration-300 shadow-md text-sm uppercase tracking-wider"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Scrollable Content Container inside the Card */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-8">
            {/* Job Details Grid */}
            <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
            
            {/* Left Column: Description & Fields */}
            <section className="bg-zinc-50 rounded-2xl p-8 border border-zinc-200 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#C21A4B]/10 text-[#C21A4B] uppercase tracking-wide">
                  {job.status?.toUpperCase() || 'PENDING'}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Posted on {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Description</h3>
                  <p className="text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-zinc-200/60">
                  <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1 opacity-80">Category</p>
                    <p className="text-sm font-semibold text-zinc-900">{job.category}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1 opacity-80">When</p>
                    <p className="text-sm font-semibold text-zinc-900">{job.hostingTime || 'Anytime'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1 opacity-80">Address</p>
                    <p className="text-sm font-semibold text-[#C21A4B]">{job.address}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-2xs">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1 opacity-80">Contact</p>
                    <p className="text-sm font-semibold text-zinc-900">{job.contactNumber}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Metadata */}
            <aside className="space-y-6">
              
              {/* Job Owner Card */}
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-xs">
                <h3 className="text-lg font-bold text-zinc-950 mb-4 flex items-center gap-2 tracking-tight">
                  <span className="w-1 h-5 bg-[#C21A4B] rounded-full"></span>
                  Job Owner
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-medium">Name</span>
                    <span className="text-zinc-900 font-semibold">{job.userName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-medium">Recipient</span>
                    <span className="text-zinc-900 font-semibold">{job.recipientName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Posted</span>
                    <span className="text-zinc-900 font-semibold">{formatDate(job.hostingDate)}</span>
                  </div>
                </div>
              </div>

              {/* Job Metadata Card */}
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-xs">
                <h3 className="text-lg font-bold text-zinc-950 mb-4 flex items-center gap-2 tracking-tight">
                  <span className="w-1 h-5 bg-[#C21A4B] rounded-full"></span>
                  Job Metadata
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex flex-col border-b border-zinc-200/60 pb-2 gap-1">
                    <span className="text-zinc-500 font-medium">Job ID</span>
                    <span className="text-zinc-800 font-mono text-xs font-semibold select-all">{job._id}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-medium">Created</span>
                    <span className="text-zinc-900 font-semibold">{formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Updated</span>
                    <span className="text-zinc-900 font-semibold">{formatDate(job.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Worker Requests Section */}
          <section className="bg-zinc-50 rounded-2xl p-8 border border-zinc-200 shadow-xs">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <h2 className="text-2xl font-bold text-zinc-950 flex items-center gap-2 tracking-tight">
                <span className="w-1 h-7 bg-[#C21A4B] rounded-full"></span>
                Worker Requests
              </h2>
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                {job.request?.length ?? 0} total
              </span>
            </div>

            {job.request?.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_0.9fr]">
                <div className="space-y-4">
                  {job.request.map((request, index) => {
                    const requestId = request._id?.toString() ?? String(index)
                    const lastSender = request.messages?.length ? request.messages[request.messages.length - 1].sender : null
                    const hasNew = lastSender && lastSender !== 'Job Owner'
                    const isSelected = requestId === selectedRequestId

                    return (
                      <button
                        key={requestId}
                        type="button"
                        onClick={() => setSelectedRequestId(requestId)}
                        className={`w-full text-left rounded-2xl border p-5 shadow-sm transition ${
                          isSelected ? 'border-[#C21A4B]/40 bg-[#F8F3F0]' : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Worker</p>
                            <p className="mt-2 text-sm font-bold text-zinc-900">{request.workerName ?? request.workerId?.toString() ?? 'Unknown worker'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{request.messages?.length ?? 0} msgs</span>
                            {hasNew && <span className="text-xs font-semibold text-white bg-[#C21A4B] px-2 py-1 rounded-full">New</span>}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 text-sm text-zinc-600">
                          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200">
                            <p className="uppercase tracking-[0.18em] text-zinc-500 text-[10px] font-bold">Date</p>
                            <p className="mt-2 font-semibold text-zinc-900">{formatDate(request.date)}</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200">
                            <p className="uppercase tracking-[0.18em] text-zinc-500 text-[10px] font-bold">Time</p>
                            <p className="mt-2 font-semibold text-zinc-900">{request.time || '—'}</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200">
                            <p className="uppercase tracking-[0.18em] text-zinc-500 text-[10px] font-bold">Price</p>
                            <p className="mt-2 font-semibold text-[#C21A4B]">{typeof request.price === 'number' ? `₹${request.price}` : '—'}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  {selectedRequest ? (
                    <div className="space-y-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-bold mb-2">Selected worker</p>
                          <h3 className="text-xl font-bold text-zinc-950">{selectedRequest.workerName ?? selectedRequest.workerId?.toString() ?? 'Unknown worker'}</h3>
                          <p className="mt-1 text-sm text-zinc-600">Price: <span className="font-semibold text-[#C21A4B]">₹{selectedRequest.price}</span></p>
                        </div>
                        {job.status === 'pending' && (
                          <div className="flex flex-col items-start gap-3 sm:items-end">
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(selectedRequestId)}
                              className="rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition"
                            >
                              Accept Request
                            </button>
                            {acceptStatus && (
                              <p className={`text-sm ${acceptStatus.type === 'success' ? 'text-green-700' : acceptStatus.type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                                {acceptStatus.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-900">Chat</p>
                          <span className="text-xs font-semibold text-zinc-500 bg-white border border-zinc-200 px-2 py-1 rounded-full">{selectedRequest.messages?.length ?? 0} messages</span>
                        </div>
                        {selectedRequest.messages?.length > 0 ? (
                          <div className="space-y-3 mb-4">
                            {selectedRequest.messages.map((message, msgIndex) => (
                              <div key={msgIndex} className="rounded-2xl border border-zinc-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-700">{message.sender}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">{formatDate(message.time)}</p>
                                </div>
                                <p className="text-sm text-zinc-700">{message.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">No messages yet for this request.</div>
                        )}
                        <textarea
                          rows="4"
                          value={messageInputs[selectedRequestId] ?? ''}
                          onChange={(e) => handleMessageInputChange(selectedRequestId, e.target.value)}
                          placeholder="Send a message..."
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#C21A4B]"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleSendMessage(selectedRequestId)}
                            className="rounded-2xl bg-[#C21A4B] px-5 py-3 text-sm font-bold text-white hover:bg-[#A1133C] transition"
                          >
                            Send Message
                          </button>
                          {messageStatus[selectedRequestId] && (
                            <p className={`text-sm ${messageStatus[selectedRequestId].type === 'success' ? 'text-green-700' : messageStatus[selectedRequestId].type === 'error' ? 'text-red-700' : 'text-zinc-700'}`}>
                              {messageStatus[selectedRequestId].text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
                      Select a request to view chat and respond.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-2xs">
                <p className="text-zinc-500 text-sm font-medium">No worker requests have been made for this job yet.</p>
              </div>
            )}
          </section>
          </div>
        </div>
      </div>
    </div>
  )
}
