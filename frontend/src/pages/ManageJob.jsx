import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function ManageJob() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
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

    void loadJob()
  }, [jobId])

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
              <div className="space-y-6">
                {job.request.map((request, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition duration-300">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-200/60 pb-4">
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1">Worker ID</p>
                        <p className="text-base font-bold text-zinc-900 font-mono">
                          {request.workerId ? request.workerId.toString() : 'Unknown worker'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 md:gap-10">
                        <div>
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1">Date</p>
                          <p className="text-sm font-semibold text-zinc-900">{formatDate(request.date)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1">Time</p>
                          <p className="text-sm font-semibold text-zinc-900">{request.time || '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.15em] mb-1">Price</p>
                          <p className="text-sm font-bold text-[#C21A4B]">{typeof request.price === 'number' ? `₹${request.price}` : '—'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <p className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Messages</p>
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                          {request.messages?.length ?? 0}
                        </span>
                      </div>
                      {request.messages?.length > 0 ? (
                        <div className="space-y-3">
                          {request.messages.map((message, msgIndex) => (
                            <div key={msgIndex} className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                              <div className="flex justify-between items-start gap-4 mb-1">
                                <p className="text-xs font-bold text-zinc-900">{message.sender}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{formatDate(message.time)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 font-medium italic">No messages added to this request yet.</p>
                      )}
                    </div>
                  </div>
                ))}
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
