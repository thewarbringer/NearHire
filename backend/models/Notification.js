const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['user', 'worker'],
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'nearby_job', 'job_request', 'price_update', 'request_accepted'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    metadata: {
      jobId: { type: mongoose.Schema.Types.ObjectId },
      senderId: { type: mongoose.Schema.Types.ObjectId },
      senderName: { type: String },
      jobTitle: { type: String },
      category: { type: String },
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 })

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema)

module.exports = Notification
