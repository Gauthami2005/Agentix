const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  studyStreak: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: [String],
    default: []
  },
  completedTaskNames: {
    type: [String],
    default: []
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  topics: [{
    name: String,
    completed: Boolean
  }],
  overallProgress: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Progress', ProgressSchema);
