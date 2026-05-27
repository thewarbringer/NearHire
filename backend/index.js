require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/mongodb')
const redisClient = require('./config/redis')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/auth', require('./routes/auth'))

// Initialize MongoDB connection
connectDB();

app.get('/', (req, res) => {
    res.send('hello')
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
