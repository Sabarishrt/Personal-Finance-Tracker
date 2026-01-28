const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/budget
// @desc    Get user's budget settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let budget = await Budget.findOne({ user: req.user._id });
    
    if (!budget) {
      // Create default budget if doesn't exist
      budget = new Budget({ user: req.user._id });
      await budget.save();
    }

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/budget
// @desc    Update user's budget settings
// @access  Private
router.put('/', [
  auth,
  body('monthlyLimit').optional().isFloat({ min: 0 }).withMessage('Monthly limit must be a positive number'),
  body('categories').optional().isArray().withMessage('Categories must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let budget = await Budget.findOne({ user: req.user._id });

    if (!budget) {
      budget = new Budget({ user: req.user._id });
    }

    if (req.body.monthlyLimit !== undefined) {
      budget.monthlyLimit = req.body.monthlyLimit;
    }

    if (req.body.categories !== undefined) {
      budget.categories = req.body.categories;
    }

    await budget.save();
    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budget/stats
// @desc    Get budget statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id });
    
    // Get current month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenses = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate expenses by category
    const expensesByCategory = {};
    expenses.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    // Calculate budget usage
    const monthlyLimit = budget?.monthlyLimit || 0;
    const remaining = monthlyLimit - totalExpenses;
    const percentageUsed = monthlyLimit > 0 ? (totalExpenses / monthlyLimit) * 100 : 0;

    // Category limits
    const categoryStats = {};
    if (budget?.categories) {
      budget.categories.forEach(catBudget => {
        const spent = expensesByCategory[catBudget.category] || 0;
        categoryStats[catBudget.category] = {
          limit: catBudget.limit,
          spent,
          remaining: catBudget.limit - spent,
          percentageUsed: catBudget.limit > 0 ? (spent / catBudget.limit) * 100 : 0
        };
      });
    }

    res.json({
      monthlyLimit,
      totalExpenses,
      remaining,
      percentageUsed,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budget/reset
// @desc    Reset budget (clear all limits)
// @access  Private
router.post('/reset', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id });
    
    if (budget) {
      budget.monthlyLimit = 0;
      budget.categories = [];
      await budget.save();
    }

    res.json({ message: 'Budget reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
