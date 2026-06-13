import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function SeeJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priceInput, setPriceInput] = useState({})
  const [requestStatus, setRequestStatus] = useState({})
  const [requests, setRequests] = useState([])
  const [location, setLocation] = useState({ lat: null, lng: null })
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

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8] pb-12">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pt-28">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#5DCAA5]">Worker Jobs</p>
            <h1 className="mt-3 text-4xl font-[DMSerifDisplay] font-bold text-[#f0ede8]">Available jobs within 20km</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#b9b6b0]">Browse jobs near you and send a request with your price.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#5DCAA5] mx-auto mb-4"></div>
            <p>Fetching nearby jobs...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-8 text-center text-red-300">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-8 text-center text-[#b9b6b0]">
            No active jobs found within 20km of your current location.
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <article key={job._id} className="rounded-3xl border border-white/10 bg-[#12151a] p-8 shadow-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#5DCAA5] mb-3">
                      <span>{job.category}</span>
                      <span>·</span>
                      <span>{job.distance ? `${job.distance.toFixed(1)} km away` : 'Distance unknown'}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-[#f0ede8]">{job.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#b9b6b0]">{job.description}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-[#0f0f0f] p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Address</p>
                        <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.address}</p>
                      </div>
                      <div className="rounded-3xl bg-[#0f0f0f] p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Contact</p>
                        <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{job.contactNumber}</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#a8a49d]">Request your price</p>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={priceInput[job._id] ?? ''}
                      onChange={(e) => handlePriceChange(job._id, e.target.value)}
                      className="mt-4 w-full rounded-3xl border border-white/10 bg-[#12151a] px-4 py-3 text-[#f0ede8] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5]"
                      placeholder="Enter price in ₹"
                    />
                    <button
                      type="button"
                      onClick={() => handleRequest(job._id)}
                      className="mt-4 w-full rounded-3xl bg-[#5DCAA5] py-3 text-[#03261d] font-semibold hover:bg-[#4ab891] transition"
                    >
                      Request Job
                    </button>
                    {requestStatus[job._id] && (
                      <p className={`mt-3 text-sm ${requestStatus[job._id].type === 'success' ? 'text-green-300' : requestStatus[job._id].type === 'error' ? 'text-red-300' : 'text-[#f0ede8]'}`}>
                        {requestStatus[job._id].text}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0d0d0d] p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[DMSerifDisplay] font-bold text-[#f0ede8]">My Requests</h2>
              <p className="text-sm text-[#a8a49d] mt-1">Jobs you have requested with price and status.</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#12151a] p-8 text-center text-[#b9b6b0]">
              You have not requested any jobs yet.
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((item) => (
                <div key={item.jobId} className="rounded-3xl border border-white/10 bg-[#12151a] p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-sm uppercase tracking-[0.25em] text-[#5DCAA5] mb-2">{item.category}</p>
                      <h3 className="text-xl font-semibold text-[#f0ede8]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#b9b6b0]">{item.address}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-3xl bg-[#0f0f0f] p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Request Price</p>
                        <p className="mt-2 text-sm font-semibold text-[#f0ede8]">₹{item.request?.price ?? '—'}</p>
                      </div>
                      <div className="rounded-3xl bg-[#0f0f0f] p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Requested</p>
                        <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{item.request?.date ? new Date(item.request.date).toLocaleDateString() : '—'}</p>
                      </div>
                      <div className="rounded-3xl bg-[#0f0f0f] p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#a8a49d]">Job Status</p>
                        <p className="mt-2 text-sm font-semibold text-[#f0ede8]">{item.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
