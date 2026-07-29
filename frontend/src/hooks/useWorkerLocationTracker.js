import { useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function useWorkerLocationTracker(intervalMs = 2000) {
  const latestCoordsRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.')
      return
    }

    // Watch position continuously to keep latestCoordsRef updated
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        latestCoordsRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
      },
      (error) => {
        console.error('Worker location tracker watch error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    )

    // Function to send current location to backend Redis
    const sendLocationUpdate = async (coords) => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        await fetch(`${API_BASE}/api/location/update-worker-location`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        })
      } catch (err) {
        console.error('Failed to send worker location update to Redis:', err)
      }
    }

    // Interval tick every intervalMs (2000ms by default)
    const intervalId = setInterval(() => {
      if (latestCoordsRef.current) {
        sendLocationUpdate(latestCoordsRef.current)
      } else {
        // Fallback: try getting position directly
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            latestCoordsRef.current = coords
            sendLocationUpdate(coords)
          },
          (err) => {
            console.error('Worker location tracker fallback error:', err)
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      }
    }, intervalMs)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(intervalId)
    }
  }, [intervalMs])
}
