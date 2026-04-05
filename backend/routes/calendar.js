const express = require('express');
const CalendarEvent = require('../models/CalendarEvent');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/calendar/events
// @desc    Get user's calendar events
// @access  Private
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let query = { userId: req.user._id };
    
    // Filter by date range if provided
    if (start || end) {
      query.startTime = {};
      if (start) query.startTime.$gte = new Date(start);
      if (end) query.startTime.$lte = new Date(end);
    }

    const events = await CalendarEvent.find(query)
      .sort({ startTime: 1 })
      .limit(100);

    res.json(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/calendar/events
// @desc    Create a new calendar event
// @access  Private
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.user._id
    };

    const event = new CalendarEvent(eventData);
    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/calendar/events/:id
// @desc    Update a calendar event
// @access  Private
router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/calendar/events/:id
// @desc    Delete a calendar event
// @access  Private
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/calendar/available-slots
// @desc    Get available time slots for next 24 hours
// @access  Private
router.get('/available-slots', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get existing events for next 24 hours
    const existingEvents = await CalendarEvent.find({
      userId: req.user._id,
      startTime: { $gte: now, $lte: tomorrow },
      status: 'confirmed'
    }).sort({ startTime: 1 });

    // Generate available slots (every 2 hours, 30 min duration)
    const slots = [];
    let currentSlot = new Date(now);
    currentSlot.setMinutes(0, 0, 0);
    currentSlot.setHours(currentSlot.getHours() + 1);

    while (currentSlot < tomorrow) {
      // Check if slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const slotEnd = new Date(currentSlot.getTime() + 30 * 60000);
        
        return (currentSlot < eventEnd && slotEnd > eventStart);
      });

      if (!hasConflict) {
        slots.push(new Date(currentSlot));
      }

      currentSlot = new Date(currentSlot.getTime() + 2 * 60 * 60 * 1000);
    }

    res.json(slots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
