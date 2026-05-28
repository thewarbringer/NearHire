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

module.exports = {
  getLocality,
  getLocationFromIp,
};
