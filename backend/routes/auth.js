const express = require('express')
const crypto = require('crypto')
const RegisterUser = require('../models/RegisterUser')
const Worker = require('../models/Worker')
const redisClient = require('../config/redis')

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
    // Store token in Redis with 7-day expiration
    await redisClient.setEx(`token:${token}`, 7 * 24 * 60 * 60, user._id.toString())
    
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Get user profile route - requires authentication
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

module.exports = router;
