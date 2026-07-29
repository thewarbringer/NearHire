const redisClient = require('../config/redis');

const WORKER_GEO_KEY = 'worker:locations';

const getLocality = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NearHire-App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    const address = data.address || {};

    const street = address.road || address.street || '';
    const houseNumber = address.house_number || '';
    const streetAddress = houseNumber ? `${houseNumber} ${street}` : street;
    const locality = address.city || address.town || address.village || address.county || 'Unknown';
    const postalCode = address.postcode || '';
    const state = address.state || address.province || '';
    const country = address.country || 'Unknown';

    const formattedAddress = [streetAddress, locality, postalCode, state, country]
      .filter(Boolean)
      .join(', ');

    return res.json({
      street: streetAddress,
      locality,
      postalCode,
      state,
      country,
      fullAddress: formattedAddress,
      displayName: data.display_name || locality,
      latitude,
      longitude,
    });
  } catch (error) {
    console.error('Location fetch error:', error);
    return res.status(500).json({
      message: 'Failed to fetch location information',
      locality: 'Location Unknown',
    });
  }
};

const getLocationFromIp = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    if (data.status === 'success') {
      return res.json({
        locality: data.city || 'Unknown',
        country: data.country || 'Unknown',
        latitude: data.lat,
        longitude: data.lon,
      });
    }

    return res.status(404).json({ message: 'Could not determine location from IP' });
  } catch (error) {
    console.error('IP location error:', error);
    return res.status(500).json({ message: 'Failed to fetch location from IP' });
  }
};

const updateWorkerLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await redisClient.sendCommand([
      'GEOADD',
      WORKER_GEO_KEY,
      longitude.toString(),
      latitude.toString(),
      req.userId.toString(),
    ]);

    return res.json({ message: 'Worker location updated in Redis successfully' });
  } catch (error) {
    console.error('Update worker location error:', error);
    return res.status(500).json({ message: 'Failed to update worker location in Redis' });
  }
};

const getWorkerLocation = async (req, res) => {
  try {
    const { workerId } = req.params;
    if (!workerId) {
      return res.status(400).json({ message: 'Worker ID is required' });
    }

    const result = await redisClient.sendCommand([
      'GEOPOS',
      WORKER_GEO_KEY,
      workerId.toString(),
    ]);

    if (Array.isArray(result) && result[0] && Array.isArray(result[0])) {
      const [lngStr, latStr] = result[0];
      if (lngStr !== null && latStr !== null) {
        const longitude = parseFloat(lngStr);
        const latitude = parseFloat(latStr);
        if (!isNaN(longitude) && !isNaN(latitude)) {
          return res.json({
            success: true,
            coordinates: { lat: latitude, lng: longitude },
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return res.status(404).json({ message: 'Worker location not found in Redis' });
  } catch (error) {
    console.error('Get worker location error:', error);
    return res.status(500).json({ message: 'Failed to fetch worker location from Redis' });
  }
};

module.exports = {
  getLocality,
  getLocationFromIp,
  updateWorkerLocation,
  getWorkerLocation,
};


