const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['date', 'month'],
    required: true
  },
  date: {
    type: Date,
    required: function() {
      return this.type === 'date';
    }
  },
  month: {
    type: String, // Format: YYYY-MM
    required: function() {
      return this.type === 'month';
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ user: 1, date: -1 });
eventSchema.index({ user: 1, month: -1 });

module.exports = mongoose.model('Event', eventSchema);