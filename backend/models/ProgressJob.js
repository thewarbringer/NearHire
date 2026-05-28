const mongoose = require('mongoose');

const ProgressJobSchema = new mongoose.Schema({
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  isActive: { type: Boolean, default: true },
  category: { type: String, required: true },
  hostingDate: { type: Date, required: true },
  hostingTime: { type: String },
  userName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  recipientName: { type: String },
  price: { type: Number },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  workerName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisterUser', required: true },
  status: { type: String, enum: ['in-progress'], default: 'in-progress' },
}, { timestamps: true });

module.exports = mongoose.model('ProgressJob', ProgressJobSchema);
