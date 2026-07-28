require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const connectDB = require('./config/mongodb')
const { setIO, addUser, removeUser } = require('./config/socket')

const app = express()
const server = http.createServer(app)

const jwtSecret = process.env.JWT_SECRET || 'nearhire_secret'

// Set up Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Store the io instance so routes can use it
setIO(io)

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) {
    return next(new Error('Authentication required'))
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid token'))
    }
    socket.userId = decoded.userId
    socket.userRole = decoded.role
    next()
  } catch (err) {
    return next(new Error('Invalid or expired token'))
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.userId
  console.log(`Socket connected: ${userId} (${socket.id})`)

  addUser(userId, socket.id)

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${userId} (${socket.id})`)
    removeUser(userId, socket.id)
  })
})

app.use(cors())
app.use(express.json())
app.use('/api/auth', require('./routes/auth'))
app.use('/api/location', require('./routes/location'))
app.use('/api/jobs', require('./routes/jobs'))
app.use('/api/notifications', require('./routes/notifications'))

// Initialize MongoDB connection
connectDB();

app.get('/', (req, res) => {
    res.send('hello')
})

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
