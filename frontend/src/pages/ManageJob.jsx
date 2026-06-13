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
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#5DCAA5] mx-auto mb-4"></div>
            <p>Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
        <Navbar />
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6">
          <div className="max-w-xl w-full space-y-4 rounded-3xl border border-white/10 bg-[#0d0d0d] p-8 text-center">
            <p className="text-red-400 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/userDashboard')}
              className="rounded-full bg-[#5DCAA5] px-5 py-3 text-sm font-semibold text-[#03261d] transition hover:bg-[#9FE1CB]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#5DCAA5]">Manage Job</p>
            <h1 className="mt-3 text-4xl font-[DMSerifDisplay] font-bold text-[#f0ede8]">{job.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#b9b6b0]">Review the job details and all requests made against this post.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/userDashboard"
              className="rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-[#d9d7d2] transition hover:border-[#d9d7d2] hover:text-white"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-8 shadow-xl">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="rounded-full bg-[#5DCAA526] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#5DCAA5]">{job.status?.toUpperCase() || 'PENDING'}</span>
                <span className="text-sm text-[#a8a49d]">Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="space-y-4 rounded-3xl bg-[#12151a] p-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#f0ede8]">Description</h2>
                  <p className="mt-3 text-sm leading-7 text-[#b9b6b0]">{job.description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#0d0d0d] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Category</p>
                    <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.category}</p>
                  </div>
                  <div className="rounded-3xl bg-[#0d0d0d] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">When</p>
                    <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.hostingTime || 'Anytime'}</p>
                  </div>
                  <div className="rounded-3xl bg-[#0d0d0d] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Address</p>
                    <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.address}</p>
                  </div>
                  <div className="rounded-3xl bg-[#0d0d0d] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Contact</p>
                    <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.contactNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
              <h2 className="text-xl font-semibold text-[#f0ede8]">Job Owner</h2>
              <div className="mt-4 space-y-2 text-sm text-[#b9b6b0]">
                <p><span className="font-semibold text-[#f0ede8]">Name:</span> {job.userName}</p>
                <p><span className="font-semibold text-[#f0ede8]">Recipient:</span> {job.recipientName || 'Not specified'}</p>
                <p><span className="font-semibold text-[#f0ede8]">Posted:</span> {formatDate(job.hostingDate)}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
              <h2 className="text-xl font-semibold text-[#f0ede8]">Job Metadata</h2>
              <div className="mt-4 space-y-2 text-sm text-[#b9b6b0]">
                <p><span className="font-semibold text-[#f0ede8]">Job ID:</span> {job._id}</p>
                <p><span className="font-semibold text-[#f0ede8]">Created:</span> {formatDate(job.createdAt)}</p>
                <p><span className="font-semibold text-[#f0ede8]">Updated:</span> {formatDate(job.updatedAt)}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8]">Worker Requests</h2>
            <span className="text-sm text-[#a8a49d]">{job.request?.length ?? 0} total</span>
          </div>

          {job.request?.length > 0 ? (
            <div className="space-y-6">
              {job.request.map((request, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-[#12151a] p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-[#a8a49d]">Worker</p>
                      <p className="mt-1 text-lg font-semibold text-[#f0ede8]">
                        {request.workerId ? request.workerId.toString() : 'Unknown worker'}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Date</p>
                        <p className="mt-1 text-sm font-semibold text-[#f0ede8]">{formatDate(request.date)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Time</p>
                        <p className="mt-1 text-sm font-semibold text-[#f0ede8]">{request.time || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Price</p>
                        <p className="mt-1 text-sm font-semibold text-[#f0ede8]">{typeof request.price === 'number' ? `₹${request.price}` : '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-[#0d0d0d] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[#f0ede8]">Messages</p>
                      <span className="text-sm text-[#a8a49d]">{request.messages?.length ?? 0}</span>
                    </div>
                    {request.messages?.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {request.messages.map((message, msgIndex) => (
                          <div key={msgIndex} className="rounded-2xl border border-white/10 bg-[#12151a] p-4">
                            <p className="text-sm font-semibold text-[#f0ede8]">{message.sender}</p>
                            <p className="mt-1 text-xs text-[#a8a49d]">{formatDate(message.time)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#a8a49d]">No messages added to this request yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[#12151a] p-8 text-center text-[#a8a49d]">
              No worker requests have been made for this job yet.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
