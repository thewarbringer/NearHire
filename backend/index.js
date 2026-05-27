const mongoose = require('mongoose')

require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/auth', require('./routes/auth'))

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@nearhire.3ybte67.mongodb.net/?appName=NearHire');
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`MongoDB Connection Error: ${error}`);
        process.exit(1);
    }
}

connectDB();

app.get('/', (req, res) => {
    res.send('hello')
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
