const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories used by the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Transaction.distinct('category', {
      user: req.user._id
    });

    res.json(categories.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
