const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Note'
  },
  category: {
    type: String
  },
  content: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
  userId: {
    type: String
  },
  user_id: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Note', NoteSchema);
