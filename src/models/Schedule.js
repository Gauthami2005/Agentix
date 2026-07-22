const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const ScheduleSchema = new mongoose.Schema({
  taskQueue: {
    type: [TaskSchema],
    default: []
  },
  reminders: {
    type: [String],
    default: []
  },
  today: {
    type: [TaskSchema],
    default: []
  },
  tomorrow: {
    type: [TaskSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
