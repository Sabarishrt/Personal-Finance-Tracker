const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, month, limit = 50 } = req.query;
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (type === 'date' && (startDate || endDate)) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (type === 'month' && month) {
      query.month = month;
    }

    const events = await Event.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get a single event
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['date', 'month']).withMessage('Type must be date or month'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('month').optional().isString().withMessage('Month must be a valid string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, type, date, month } = req.body;

    // Validate that required fields are present based on type
    if (type === 'date' && !date) {
      return res.status(400).json({ message: 'Date is required for date events' });
    }
    if (type === 'month' && !month) {
      return res.status(400).json({ message: 'Month is required for month events' });
    }

    const event = new Event({
      user: req.user._id,
      title,
      description,
      type,
      date: type === 'date' ? new Date(date) : undefined,
      month: type === 'month' ? month : undefined
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('type').optional().isIn(['date', 'month']).withMessage('Type must be date or month'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('month').optional().isString().withMessage('Month must be a valid string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, description, type, date, month } = req.body;

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (type) {
      event.type = type;
      if (type === 'date' && date) event.date = new Date(date);
      if (type === 'month' && month) event.month = month;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;