const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caller: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['incoming', 'answered', 'missed', 'auto-answered', 'message-sent', 'rejected'],
    default: 'incoming'
  },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'spam', 'unknown'],
    default: 'unknown'
  },
  reason: {
    type: String,
    default: ''
  },
  transcript: {
    type: String,
    default: ''
  },
  aiResponse: {
    type: String,
    default: ''
  },
  truecallerData: {
    name: String,
    location: String,
    carrier: String,
    spamScore: Number,
    isVerified: Boolean
  }
}, {
  timestamps: true
});

// Index for faster queries
callSchema.index({ userId: 1, timestamp: -1 });
callSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Call', callSchema);
