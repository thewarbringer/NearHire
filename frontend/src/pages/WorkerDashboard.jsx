import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

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
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#5DCAA5] mx-auto mb-4"></div>
            <p>Loading worker dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07080a] text-[#f0ede8]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
          <div className="max-w-lg w-full bg-[#1a1a1a] rounded-3xl p-8 border border-white/10">
            <div className="text-red-300 mb-4">{error}</div>
            <button
              onClick={() => navigate('/signinWorker')}
              className="w-full bg-[#5DCAA5] text-[#03261d] py-3 rounded-lg font-semibold"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8] pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <section className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#5DCAA5]">Worker Overview</p>
                  <h1 className="text-3xl font-semibold mt-2">{worker.name}</h1>
                  <p className="text-sm text-[#a8a49d] mt-1">{worker.specialization} · {worker.preferredLocation}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-full bg-[#5DCAA5] px-5 py-3 font-semibold text-[#03261d] hover:bg-[#4ab891] transition"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => navigate('/workerJobs')}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-[#d9d7d2] hover:border-[#d9d7d2] hover:text-white transition"
                  >
                    See Nearby Jobs
                  </button>
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#a8a49d] mb-3">Location</p>
                  <p className="text-sm text-[#f0ede8]">{location.address || 'Retrieving your current location...'}</p>
                  <p className="text-sm text-[#a8a49d] mt-3">Lat: {location.latitude ?? '--'}, Lon: {location.longitude ?? '--'}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#a8a49d] mb-3">Earnings</p>
                  <p className="text-4xl font-bold text-[#5DCAA5]">${earnings}</p>
                  <p className="text-sm text-[#a8a49d] mt-2">Total earned from recent completed work</p>
                </div>
              </div>
            </section>

            <section className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Profile Details</h2>
                  <p className="text-sm text-[#a8a49d] mt-1">Your worker profile information</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-sm text-[#a8a49d]">Name</p>
                  <p className="mt-2 text-lg font-semibold">{worker.name}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-sm text-[#a8a49d]">Email</p>
                  <p className="mt-2 text-lg">{worker.email}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-sm text-[#a8a49d]">Phone</p>
                  <p className="mt-2 text-lg">{worker.phone || 'Not set'}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10">
                  <p className="text-sm text-[#a8a49d]">Rating</p>
                  <p className="mt-2 text-lg">{worker.rating?.toFixed(1) || '0.0'} / 5</p>
                </div>
              </div>
            </section>

            <section className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Previous Tasks</h2>
                  <p className="text-sm text-[#a8a49d] mt-1">Recent completed jobs and payouts</p>
                </div>
              </div>
              <div className="space-y-4">
                {previousTasks.map((task) => (
                  <div key={task.id} className="rounded-3xl bg-[#0f0f0f] p-6 border border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#a8a49d]">{task.title}</p>
                      <p className="mt-1 text-lg font-semibold">${task.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#a8a49d]">{task.date}</p>
                      <p className="mt-1 text-sm text-[#5DCAA5]">{task.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-3">Bank Details</h2>
              <p className="text-sm text-[#a8a49d] mb-6">
                Add or update your account information. These fields are optional and can be set later.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a8a49d] mb-2">Account Number</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={settingsForm.bankAccountNumber}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-[#f0ede8] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5]"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a8a49d] mb-2">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={settingsForm.ifscCode}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-[#f0ede8] focus:outline-none focus:border-[#5DCAA5] focus:ring-1 focus:ring-[#5DCAA5]"
                    placeholder="Enter IFSC code"
                  />
                </div>
                {settingsMessage && (
                  <p className={`text-sm ${settingsMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {settingsMessage.text}
                  </p>
                )}
                <button className="w-full rounded-3xl bg-[#5DCAA5] py-3 text-[#03261d] font-semibold hover:bg-[#4ab891] transition">
                  Save Bank Details
                </button>
              </form>
            </section>

            <section className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4">Quick Summary</h2>
              <div className="space-y-4">
                <div className="rounded-3xl bg-[#0f0f0f] p-5 border border-white/10">
                  <p className="text-sm uppercase tracking-[0.35em] text-[#a8a49d]">Specialization</p>
                  <p className="mt-2 text-lg font-semibold">{worker.specialization}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-5 border border-white/10">
                  <p className="text-sm uppercase tracking-[0.35em] text-[#a8a49d]">Preferred Location</p>
                  <p className="mt-2 text-lg font-semibold">{worker.preferredLocation}</p>
                </div>
                <div className="rounded-3xl bg-[#0f0f0f] p-5 border border-white/10">
                  <p className="text-sm uppercase tracking-[0.35em] text-[#a8a49d]">Bank Status</p>
                  <p className="mt-2 text-lg font-semibold">{worker.bankAccountNumber && worker.ifscCode ? 'Configured' : 'Not configured'}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
