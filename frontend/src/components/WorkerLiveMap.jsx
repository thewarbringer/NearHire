import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(2)
}

export default function WorkerLiveMap({ job }) {
  const workerId = job?.workerId ? (typeof job.workerId === 'object' ? job.workerId._id : job.workerId) : job?.worker
  const workerName = job?.workerName || 'Worker'
  const jobCoordinates = job?.coordinates
  const jobAddress = job?.address

  const [workerPos, setWorkerPos] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [statusMessage, setStatusMessage] = useState('Initializing map...')
  const [isLive, setIsLive] = useState(false)

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const workerMarkerRef = useRef(null)
  const jobMarkerRef = useRef(null)

  // Fetch worker position from backend Redis
  const fetchWorkerPosition = async () => {
    if (!workerId) {
      setStatusMessage('Waiting for worker assignment...')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/location/worker-location/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.coordinates && typeof data.coordinates.lat === 'number' && typeof data.coordinates.lng === 'number') {
          setWorkerPos({ lat: data.coordinates.lat, lng: data.coordinates.lng })
          setLastUpdated(new Date().toLocaleTimeString())
          setIsLive(true)
          setStatusMessage('Live position active (updating every 2s)')
        }
      } else {
        const data = await response.json()
        setStatusMessage(data.message || 'Worker position not received in Redis yet')
      }
    } catch (err) {
      console.error('Fetch worker position error:', err)
      setStatusMessage('Connection error to location server')
    }
  }

  // Poll position every 2 seconds
  useEffect(() => {
    fetchWorkerPosition()
    const interval = setInterval(() => {
      fetchWorkerPosition()
    }, 2000)

    return () => clearInterval(interval)
  }, [workerId])

  // Initialize and scale Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    const L = window.L
    if (!L) {
      console.error('Leaflet JS is not loaded on window.L')
      return
    }

    // Clear stale DOM _leaflet_id if map instance was reset
    if (!mapInstanceRef.current && mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null
    }

    const defaultLat = workerPos?.lat ?? jobCoordinates?.lat ?? 20.5937
    const defaultLng = workerPos?.lng ?? jobCoordinates?.lng ?? 78.9629

    // Initialize Map if not created yet
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Trigger invalidateSize to ensure full height/width rendering
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 150)

    // Icons configuration
    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    // Render / Update Job Location Marker
    if (jobCoordinates && typeof jobCoordinates.lat === 'number' && typeof jobCoordinates.lng === 'number') {
      const jobLatLng = [jobCoordinates.lat, jobCoordinates.lng]
      if (!jobMarkerRef.current) {
        jobMarkerRef.current = L.marker(jobLatLng, { icon: blueIcon })
          .addTo(map)
          .bindPopup(`<b>Job Site</b><br/>${jobAddress || 'Job Location'}`)
      } else {
        jobMarkerRef.current.setLatLng(jobLatLng)
      }
    }

    // Render / Update Worker Location Marker
    if (workerPos && typeof workerPos.lat === 'number' && typeof workerPos.lng === 'number') {
      const workerLatLng = [workerPos.lat, workerPos.lng]

      if (!workerMarkerRef.current) {
        workerMarkerRef.current = L.marker(workerLatLng, { icon: redIcon })
          .addTo(map)
          .bindPopup(`<b>Worker: ${workerName}</b><br/>Live Location (Redis Stream)`)
          .openPopup()
      } else {
        workerMarkerRef.current.setLatLng(workerLatLng)
      }

      // Scale map to fit both worker and job site
      if (jobCoordinates && typeof jobCoordinates.lat === 'number' && typeof jobCoordinates.lng === 'number') {
        const bounds = L.latLngBounds([
          [workerPos.lat, workerPos.lng],
          [jobCoordinates.lat, jobCoordinates.lng],
        ])
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
      } else {
        map.setView(workerLatLng, 15)
      }
    } else if (jobCoordinates && typeof jobCoordinates.lat === 'number' && typeof jobCoordinates.lng === 'number') {
      map.setView([jobCoordinates.lat, jobCoordinates.lng], 14)
    }
  }, [workerPos, jobCoordinates, workerName, jobAddress])

  // Cleanup Map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off()
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        workerMarkerRef.current = null
        jobMarkerRef.current = null
      }
    }
  }, [])

  const distanceKm =
    workerPos && jobCoordinates
      ? calculateDistanceKm(workerPos.lat, workerPos.lng, jobCoordinates.lat, jobCoordinates.lng)
      : null

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <p className={`text-xs font-bold uppercase tracking-wider ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isLive ? 'Live Tracking Active (2s Refresh)' : 'Location Tracking'}
            </p>
          </div>
          <h4 className="text-base font-extrabold text-zinc-900 mt-1">
            {workerName}'s Live Map Location
          </h4>
        </div>
        {lastUpdated && (
          <span className="text-[11px] font-mono font-semibold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Refreshed: {lastUpdated}
          </span>
        )}
      </div>

      {/* Map Element */}
      <div className="relative w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100" style={{ height: '380px', minHeight: '380px' }}>
        <div
          ref={mapContainerRef}
          style={{ height: '380px', width: '100%', position: 'relative', zIndex: 1 }}
        />
      </div>

      {/* Info Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200">
          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Worker Coordinates</p>
          <p className="font-semibold text-zinc-900 mt-1 font-mono">
            {workerPos ? `${workerPos.lat.toFixed(4)}°, ${workerPos.lng.toFixed(4)}°` : 'Waiting for GPS...'}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200">
          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Distance to Job Site</p>
          <p className="font-bold text-[#C21A4B] mt-1 text-sm">
            {distanceKm !== null ? `${distanceKm} km` : 'Calculating...'}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200">
          <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Tracking Status</p>
          <p className="font-semibold text-zinc-800 mt-1 truncate">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
