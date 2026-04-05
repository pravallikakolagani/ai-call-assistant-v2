const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  attendees: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed'
  },
  provider: {
    type: String,
    enum: ['google', 'outlook', 'apple'],
    required: true
  },
  externalEventId: {
    type: String,
    default: null
  },
  relatedCallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    default: null
  }
}, {
  timestamps: true
});

// Index for querying user's calendar events
calendarEventSchema.index({ userId: 1, startTime: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
