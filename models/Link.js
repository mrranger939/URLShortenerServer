const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clicks: [{
    timestamp: Date,
    ipAddress: String,
    device: String,
    browser: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Link', LinkSchema);