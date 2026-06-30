const mongoose = require('mongoose');

const ProgressJobSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
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
  price: { type: Number },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  workerName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisterUser', required: true },
  status: { type: String, enum: ['in-progress'], default: 'in-progress' },
  completionRequested: { type: Boolean, default: false },
  messages: {
          type: [
            {
              sender: { type: String, required: true },
              text: { type: String, required: true },
              time: { type: Date, required: true },
            }
          ],
          default: [],
        },
}, { timestamps: true });

module.exports = mongoose.model('ProgressJob', ProgressJobSchema);
