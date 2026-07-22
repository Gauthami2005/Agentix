const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    default: 'user'
  },
  googleId: {
    type: String
  },
  picture: {
    type: String
  },
  github: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  leetcode: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  leetcode_topics: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('User', UserSchema);
