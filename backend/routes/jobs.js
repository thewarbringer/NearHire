const express = require('express')
const mongoose = require('mongoose')
const Job = require('../models/Job')
const ProgressJob = require('../models/ProgressJob')
const CompletedJob = require('../models/CompletedJob')
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

router.get('/my-progress', verifyToken, async (req, res) => {
  try {
    const progressJobs = await ProgressJob.find({ userId: req.userId }).sort({ createdAt: -1 })
    return res.json({ progressJobs })
  } catch (error) {
    console.error('Fetch user progress jobs error:', error)
    return res.status(500).json({ message: 'Server error fetching progress jobs' })
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
          requestId: requestEntry._id.toString(),
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

router.post('/:id/request/:requestId/message', verifyToken, async (req, res) => {
  try {
    const { id, requestId } = req.params
    const { text } = req.body

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid job or request id' })
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' })
    }

    const job = await Job.findById(id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const requestEntry = job.request.id(requestId)
    if (!requestEntry) {
      return res.status(404).json({ message: 'Request not found' })
    }

    const isJobOwner = job.userId.toString() === req.userId
    const isRequestWorker = requestEntry.workerId?.toString() === req.userId

    if (!isJobOwner && !isRequestWorker) {
      return res.status(403).json({ message: 'You are not authorized to message this request' })
    }

    let sender = 'Job Owner'
    if (isRequestWorker) {
      const worker = await Worker.findById(req.userId).select('name')
      sender = worker ? worker.name : 'Worker'
    }

    requestEntry.messages.push({ sender, text: text.trim(), time: new Date() })
    await job.save()

    return res.json({ message: 'Message added successfully', request: requestEntry })
  } catch (error) {
    console.error('Send request message error:', error)
    return res.status(500).json({ message: 'Server error sending message' })
  }
})

router.post('/:id/request/:requestId/price', verifyToken, async (req, res) => {
  try {
    const { id, requestId } = req.params
    const { price } = req.body

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid job or request id' })
    }

    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: 'A valid price is required' })
    }

    const job = await Job.findById(id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const requestEntry = job.request.id(requestId)
    if (!requestEntry) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (requestEntry.workerId?.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the request worker can update the price' })
    }

    requestEntry.price = price
    await job.save()

    return res.json({ message: 'Price updated successfully', request: requestEntry })
  } catch (error) {
    console.error('Update request price error:', error)
    return res.status(500).json({ message: 'Server error updating price' })
  }
})

router.post('/:id/request/:requestId/accept', verifyToken, async (req, res) => {
  try {
    const { id, requestId } = req.params

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid job or request id' })
    }

    const job = await Job.findById(id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the job owner can accept requests' })
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending jobs can be accepted' })
    }

    const requestEntry = job.request.id(requestId)
    if (!requestEntry) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (!requestEntry.workerId) {
      return res.status(400).json({ message: 'Request must be associated with a worker' })
    }

    const worker = await Worker.findById(requestEntry.workerId).select('name')
    const progressJob = new ProgressJob({
      jobId: job._id,
      coordinates: job.coordinates,
      isActive: true,
      category: job.category,
      hostingDate: job.hostingDate,
      hostingTime: job.hostingTime,
      userName: job.userName,
      contactNumber: job.contactNumber,
      address: job.address,
      recipientName: job.recipientName,
      title: job.title,
      description: job.description,
      price: requestEntry.price,
      workerId: requestEntry.workerId,
      workerName: worker?.name || '',
      userId: job.userId,
      status: 'in-progress',
    })

    await progressJob.save()

    try {
      await redisClient.sendCommand(['ZREM', GEO_JOB_KEY, `job:${job._id}`])
    } catch (redisError) {
      console.error('Redis ZREM error:', redisError)
    }

    await job.deleteOne()

    return res.json({ message: 'Request accepted successfully', progressJob })
  } catch (error) {
    console.error('Accept request error:', error)
    return res.status(500).json({ message: 'Server error accepting request' })
  }
})

router.post('/progress/:id/message', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid progress job id' })
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' })
    }

    const progressJob = await ProgressJob.findById(id)
    if (!progressJob) {
      return res.status(404).json({ message: 'Progress job not found' })
    }

    const isUser = progressJob.userId.toString() === req.userId
    const isWorker = progressJob.workerId?.toString() === req.userId
    if (!isUser && !isWorker) {
      return res.status(403).json({ message: 'You are not authorized to message this job' })
    }

    let sender = 'Job Owner'
    if (isWorker) {
      const worker = await Worker.findById(req.userId).select('name')
      sender = worker?.name || 'Worker'
    }

    progressJob.messages.push({ sender, text: text.trim(), time: new Date() })
    await progressJob.save()

    return res.json({ message: 'Message added successfully', progressJob })
  } catch (error) {
    console.error('Progress job message error:', error)
    return res.status(500).json({ message: 'Server error sending message' })
  }
})

router.post('/progress/:id/request-completion', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid progress job id' })
    }

    const progressJob = await ProgressJob.findById(id)
    if (!progressJob) {
      return res.status(404).json({ message: 'Progress job not found' })
    }

    if (progressJob.workerId?.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the assigned worker can request completion' })
    }

    progressJob.completionRequested = true
    await progressJob.save()

    return res.json({ message: 'Completion request sent to user', progressJob })
  } catch (error) {
    console.error('Request completion error:', error)
    return res.status(500).json({ message: 'Server error requesting completion' })
  }
})

router.post('/progress/:id/confirm-complete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid progress job id' })
    }

    const progressJob = await ProgressJob.findById(id)
    if (!progressJob) {
      return res.status(404).json({ message: 'Progress job not found' })
    }

    if (progressJob.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the job owner can confirm completion' })
    }

    if (!progressJob.completionRequested) {
      return res.status(400).json({ message: 'Completion has not been requested by the worker' })
    }

    const completedJob = new CompletedJob({
      jobId: progressJob.jobId,
      coordinates: progressJob.coordinates,
      isActive: false,
      category: progressJob.category,
      hostingDate: progressJob.hostingDate,
      hostingTime: progressJob.hostingTime,
      userName: progressJob.userName,
      contactNumber: progressJob.contactNumber,
      address: progressJob.address,
      recipientName: progressJob.recipientName,
      title: progressJob.title,
      description: progressJob.description,
      price: progressJob.price,
      workerId: progressJob.workerId,
      workerName: progressJob.workerName,
      userId: progressJob.userId,
      status: 'completed',
    })

    await completedJob.save()
    await progressJob.deleteOne()

    return res.json({ message: 'Job marked complete successfully', completedJob })
  } catch (error) {
    console.error('Confirm completion error:', error)
    return res.status(500).json({ message: 'Server error confirming completion' })
  }
})

router.get('/worker-progress', verifyToken, async (req, res) => {
  try {
    const worker = await Worker.findById(req.userId)
    if (!worker) {
      return res.status(403).json({ message: 'Only workers can view progress jobs' })
    }

    const progressJobs = await ProgressJob.find({ workerId: req.userId }).sort({ createdAt: -1 })

    return res.json({ progressJobs })
  } catch (error) {
    console.error('Fetch worker progress jobs error:', error)
    return res.status(500).json({ message: 'Server error fetching progress jobs' })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' })
    }

    const job = await Job.findById(id).populate('request.workerId', 'name')
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to view this job' })
    }

    const jobObj = job.toObject()
    jobObj.request = jobObj.request.map((request) => ({
      ...request,
      workerName: request.workerId?.name || undefined,
      workerId: request.workerId?._id || request.workerId,
    }))

    return res.json({ job: jobObj })
  } catch (error) {
    console.error('Fetch job by id error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
