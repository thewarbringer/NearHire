require('dotenv').config({ path: '../.env' }) || require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/mongodb')
const Worker = require('../models/Worker')

const migrateWorkers = async () => {
  try {
    await connectDB()

    const result = await Worker.updateMany(
      { totalEarnings: { $exists: false } },
      { $set: { totalEarnings: 0 } }
    )

    console.log(`Migration complete! Updated ${result.modifiedCount} existing worker document(s) with totalEarnings: 0.`)
    process.exit(0)
  } catch (err) {
    console.error('Migration error:', err)
    process.exit(1)
  }
}

migrateWorkers()
