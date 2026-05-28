const mongoose = require('mongoose');

const CompletedJobSchema = new mongoose.Schema({
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  isActive: { type: Boolean, default: false },
  category: { type: String, required: true },
  hostingDate: { type: Date, required: true },
  hostingTime: { type: String },
  userName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  recipientName: { type: String },
  price: { type: Number, required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisterUser', required: true },
  status: { type: String, enum: ['completed'], default: 'completed' },
}, { timestamps: true });

module.exports = mongoose.model('CompletedJob', CompletedJobSchema);
