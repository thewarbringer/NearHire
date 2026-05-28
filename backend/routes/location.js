const express = require('express');
const { getLocality, getLocationFromIp } = require('../controllers/locationController');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.post('/get-locality', verifyToken, getLocality);
router.get('/get-location-from-ip', getLocationFromIp);

module.exports = router;
