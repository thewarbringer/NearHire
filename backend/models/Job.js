const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
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
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisterUser', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
