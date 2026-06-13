const express = require('express')
const mongoose = require('mongoose')
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

router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { lat, lng } = req.query
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' })
    }

    const worker = await Worker.findById(req.userId)
    if (!worker) {
      return res.status(403).json({ message: 'Only workers can fetch nearby jobs' })
    }

    const geoResults = await redisClient.sendCommand([
      'GEORADIUS',
      GEO_JOB_KEY,
      lng.toString(),
      lat.toString(),
      '20',
      'km',
      'WITHDIST',
      'ASC',
    ])

    if (!Array.isArray(geoResults) || geoResults.length === 0) {
      return res.json({ jobs: [] })
    }

    const jobIds = geoResults
      .map((item) => (Array.isArray(item) ? item[0].toString() : item.toString()))
      .map((member) => member.replace(/^job:/, ''))

    const jobs = await Job.find({ _id: { $in: jobIds }, isActive: true }).sort({ createdAt: -1 })
    const jobsMap = new Map(jobs.map((job) => [job._id.toString(), job]))

    const nearbyJobs = geoResults
      .map((item) => {
        const [member, distance] = Array.isArray(item) ? item : [item, null]
        const id = member.toString().replace(/^job:/, '')
        const job = jobsMap.get(id)
        return job ? { ...job.toObject(), distance: distance ? parseFloat(distance) : null } : null
      })
      .filter(Boolean)

    return res.json({ jobs: nearbyJobs })
  } catch (error) {
    console.error('Fetch nearby jobs error:', error)
    return res.status(500).json({ message: 'Server error fetching nearby jobs' })
  }
})

router.post('/:id/request', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { price } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' })
    }

    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: 'A valid price is required' })
    }

    const worker = await Worker.findById(req.userId)
    if (!worker) {
      return res.status(403).json({ message: 'Only workers can submit requests' })
    }

    const job = await Job.findById(id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const existingRequest = job.request.find((request) => request.workerId?.toString() === worker._id.toString())
    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested this job' })
    }

    const requestEntry = {
      workerId: worker._id,
      date: new Date(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price,
      messages: [],
    }

    job.request.push(requestEntry)
    await job.save()

    return res.json({ message: 'Request submitted successfully', request: requestEntry })
  } catch (error) {
    console.error('Submit job request error:', error)
    return res.status(500).json({ message: 'Server error submitting request' })
  }
})

router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const worker = await Worker.findById(req.userId)
    if (!worker) {
      return res.status(403).json({ message: 'Only workers can view their requests' })
    }

    const jobs = await Job.find({ 'request.workerId': req.userId, isActive: true }).sort({ createdAt: -1 })

    const requests = jobs.map((job) => {
      const requestEntry = job.request.find((entry) => entry.workerId?.toString() === req.userId)
      return {
        jobId: job._id,
        title: job.title,
        category: job.category,
        address: job.address,
        userName: job.userName,
        contactNumber: job.contactNumber,
        status: job.status,
        request: requestEntry ? {
          price: requestEntry.price,
          date: requestEntry.date,
          time: requestEntry.time,
          messages: requestEntry.messages || [],
        } : null,
      }
    })

    return res.json({ requests })
  } catch (error) {
    console.error('Fetch worker requests error:', error)
    return res.status(500).json({ message: 'Server error fetching worker requests' })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' })
    }

    const job = await Job.findById(id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to view this job' })
    }

    return res.json({ job })
  } catch (error) {
    console.error('Fetch job by id error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
