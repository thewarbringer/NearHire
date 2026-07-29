const express = require('express');
const { getLocality, getLocationFromIp, updateWorkerLocation, getWorkerLocation } = require('../controllers/locationController');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.post('/get-locality', verifyToken, getLocality);
router.get('/get-location-from-ip', getLocationFromIp);
router.post('/update-worker-location', verifyToken, updateWorkerLocation);
router.get('/worker-location/:workerId', verifyToken, getWorkerLocation);

module.exports = router;


