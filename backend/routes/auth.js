const express = require('express')
const crypto = require('crypto')
const RegisterUser = require('../models/RegisterUser')

console.log('Loaded backend auth route module')
const router = express.Router()

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
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
