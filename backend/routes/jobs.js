const express = require('express')
const Job = require('../models/Job')
const RegisterUser = require('../models/RegisterUser')
const Worker = require('../models/Worker')
const verifyToken = require('../middleware/auth')
const redisClient = require('../config/redis')

const GEO_JOB_KEY = 'job:locations'
const WORKER_GEO_KEY = 'worker:locations'

const router = express.Router()

router.post('/create', verifyToken, async (req, res) => {
  try {
    const {
      coordinates,
      category,
      contactNumber,
      address,
      recipientName,
      title,
      description,
      hostingDate,
      hostingTime,
    } = req.body

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Valid coordinates are required' })
    }

    if (!category || !contactNumber || !address || !title || !description) {
      return res.status(400).json({ message: 'All required job fields must be provided' })
    }

    const user = await RegisterUser.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const now = new Date()
    const job = new Job({
      coordinates,
      isActive: true,
      category: category.trim(),
      hostingDate: hostingDate ? new Date(hostingDate) : now,
      hostingTime: hostingTime ? hostingTime.trim() : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userName: user.name,
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      recipientName: recipientName ? recipientName.trim() : '',
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
      userId: user._id,
    })

    await job.save()

    try {
      await redisClient.sendCommand([
        'GEOADD',
        GEO_JOB_KEY,
        coordinates.lng.toString(),
        coordinates.lat.toString(),
        `job:${job._id}`,
      ])
    } catch (redisError) {
      console.error('Redis GEOADD error:', redisError)
      await Job.findByIdAndDelete(job._id)
      return res.status(500).json({ message: 'Server error saving job location' })
    }

    let nearbyWorkers = []
    try {
      const geoResults = await redisClient.sendCommand([
        'GEORADIUS',
        WORKER_GEO_KEY,
        coordinates.lng.toString(),
        coordinates.lat.toString(),
        '10',
        'km',
        'WITHDIST',
        'ASC',
      ])

      if (Array.isArray(geoResults) && geoResults.length > 0) {
        const workerIds = geoResults.map(item => Array.isArray(item) ? item[0].toString() : item.toString())
        const workers = await Worker.find({
          _id: { $in: workerIds },
          specialization: category.trim(),
        }).select('name email phone specialization rating preferredLocation')

        const workerMap = new Map(workers.map(worker => [worker._id.toString(), worker]))
        nearbyWorkers = geoResults
          .map(item => {
            const [id, distance] = Array.isArray(item) ? item : [item, null]
            const worker = workerMap.get(id.toString())
            return worker ? {
              id: worker._id,
              name: worker.name,
              email: worker.email,
              phone: worker.phone,
              specialization: worker.specialization,
              rating: worker.rating,
              preferredLocation: worker.preferredLocation,
              distance: distance ? parseFloat(distance) : null,
            } : null
          })
          .filter(Boolean)
      }
    } catch (redisSearchError) {
      console.error('Redis worker search error:', redisSearchError)
      nearbyWorkers = []
    }

    return res.status(201).json({ message: 'Job created successfully', job, nearbyWorkers })
  } catch (error) {
    console.error('Job creation error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/my-jobs', verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId }).sort({ createdAt: -1 })
    return res.json({ jobs })
  } catch (error) {
    console.error('Fetch user jobs error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
