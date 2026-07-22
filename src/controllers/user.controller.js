const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'error', message: 'Email is required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ status: 'error', message: 'User already exists' });

    const newUser = await User.create({
      ...req.body,
      email: email.toLowerCase()
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email } = req.params;
    const updated = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.params;
    const deleted = await User.findOneAndDelete({ email: email.toLowerCase() });
    if (!deleted) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
