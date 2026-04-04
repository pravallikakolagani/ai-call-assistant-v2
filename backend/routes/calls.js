const express = require('express');
const Call = require('../models/Call');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/calls
// @desc    Get all calls for logged in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const calls = await Call.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json(calls);
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/calls
// @desc    Create a new call
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const callData = {
      ...req.body,
      userId: req.user._id
    };

    const call = new Call(callData);
    await call.save();
    
    res.status(201).json(call);
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/calls/:id
// @desc    Update a call
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const call = await Call.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json(call);
  } catch (error) {
    console.error('Update call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/calls/stats
// @desc    Get call statistics
// @access  Private
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Call.aggregate([
      { $match: { userId: new require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          answered: { 
            $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] }
          },
          missed: { 
            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
          },
          autoAnswered: { 
            $sum: { $cond: [{ $eq: ['$status', 'auto-answered'] }, 1, 0] }
          },
          messagesSent: { 
            $sum: { $cond: [{ $eq: ['$status', 'message-sent'] }, 1, 0] }
          },
          highPriority: { 
            $sum: { $cond: [{ $eq: ['$importance', 'high'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json(stats[0] || {
      total: 0,
      answered: 0,
      missed: 0,
      autoAnswered: 0,
      messagesSent: 0,
      highPriority: 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/calls/:id
// @desc    Delete a call
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const call = await Call.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json({ message: 'Call deleted' });
  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
