const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  targetGoal: {
    type: String,
    required: true
  },
  phases: {
    type: Array,
    default: []
  },
  active: {
    type: Boolean,
    default: true
  },
  title: {
    type: String
  },
  roadmapText: {
    type: String
  },
  completedDays: {
    type: [String],
    default: []
  },
  completedTopics: {
    type: [String],
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

module.exports = mongoose.model('Roadmap', RoadmapSchema);
