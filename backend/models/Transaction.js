const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['USER_TO_WORKER'],
      default: 'USER_TO_WORKER',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProgressJob',
      required: true,
    },
    jobTitle: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RegisterUser',
    },
    userName: {
      type: String,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
    },
    workerName: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED'],
      default: 'SUCCESS',
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)

module.exports = Transaction
