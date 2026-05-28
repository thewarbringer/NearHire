const express = require('express')
const crypto = require('crypto')
const RegisterUser = require('../models/RegisterUser')
const Worker = require('../models/Worker')
const redisClient = require('../config/redis')

const WORKER_GEO_KEY = 'worker:locations'

console.log('Loaded backend auth route module')
const router = express.Router()

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.slice(7)
    const userId = await redisClient.get(`token:${token}`)

    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    req.userId = userId
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await RegisterUser.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
    const passwordHash = `${salt}:${hash}`

    const user = new RegisterUser({
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      phone: phone.trim(),
      role: 'user',
    })

    await user.save()
    return res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await RegisterUser.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const [salt, storedHash] = (user.password || '').split(':')
    if (!salt || !storedHash) return res.status(500).json({ message: 'Invalid stored password format' })

    const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
    if (hash !== storedHash) return res.status(401).json({ message: 'Invalid credentials' })

    const token = crypto.randomBytes(24).toString('hex')
    await redisClient.setEx(`token:${token}`, 7 * 24 * 60 * 60, user._id.toString())

    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/register-worker', async (req, res) => {
  try {
    const { name, age, email, password, phone, specialization, preferredLocation, coordinates } = req.body

    if (!name || !age || !email || !password || !specialization || !preferredLocation || !coordinates) {
      return res.status(400).json({ message: 'All required worker fields must be provided' })
    }

    if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Valid worker coordinates are required' })
    }

    const existingWorker = await Worker.findOne({ email: email.toLowerCase().trim() })
    if (existingWorker) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
    const passwordHash = `${salt}:${hash}`

    const worker = new Worker({
      name: name.trim(),
      age,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      phone: phone ? phone.trim() : undefined,
      specialization: specialization.trim(),
      preferredLocation: preferredLocation.trim(),
    })

    await worker.save()

    try {
      await redisClient.sendCommand([
        'GEOADD',
        WORKER_GEO_KEY,
        coordinates.lng.toString(),
        coordinates.lat.toString(),
        worker._id.toString(),
      ])
    } catch (redisError) {
      console.error('Redis GEOADD error:', redisError)
      await Worker.findByIdAndDelete(worker._id)
      return res.status(500).json({ message: 'Server error saving worker location' })
    }

    return res.status(201).json({ message: 'Worker registered successfully', workerId: worker._id })
  } catch (error) {
    console.error('Register worker error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login-worker', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const worker = await Worker.findOne({ email: email.toLowerCase().trim() })
    if (!worker) return res.status(401).json({ message: 'Invalid credentials' })

    const [salt, storedHash] = (worker.password || '').split(':')
    if (!salt || !storedHash) return res.status(500).json({ message: 'Invalid stored password format' })

    const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
    if (hash !== storedHash) return res.status(401).json({ message: 'Invalid credentials' })

    const token = crypto.randomBytes(24).toString('hex')
    await redisClient.setEx(`token:${token}`, 7 * 24 * 60 * 60, worker._id.toString())

    return res.json({
      token,
      user: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        specialization: worker.specialization,
        preferredLocation: worker.preferredLocation,
      },
    })
  } catch (error) {
    console.error('Worker login error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/user-profile', verifyToken, async (req, res) => {
  try {
    const user = await RegisterUser.findById(req.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({
      user: {
        id: user._id,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
  } catch (error) {
    console.error('User profile error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/worker-profile', verifyToken, async (req, res) => {
  try {
    const worker = await Worker.findById(req.userId).select('-password')
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' })
    }

    return res.json({
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        specialization: worker.specialization,
        preferredLocation: worker.preferredLocation,
        rating: worker.rating,
        bankAccountNumber: worker.bankAccountNumber || '',
        ifscCode: worker.ifscCode || '',
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt,
      },
    })
  } catch (error) {
    console.error('Worker profile error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.put('/worker-profile', verifyToken, async (req, res) => {
  try {
    const { bankAccountNumber, ifscCode, phone } = req.body
    const worker = await Worker.findById(req.userId)
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' })
    }

    if (bankAccountNumber !== undefined) worker.bankAccountNumber = bankAccountNumber.trim()
    if (ifscCode !== undefined) worker.ifscCode = ifscCode.trim()
    if (phone !== undefined) worker.phone = phone.trim()

    await worker.save()

    return res.json({ message: 'Worker profile updated successfully' })
  } catch (error) {
    console.error('Update worker profile error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router;
