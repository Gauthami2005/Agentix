const Progress = require('../models/Progress');

exports.getProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne().sort({ createdAt: -1 });
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne();
    if (progress) {
      progress = await Progress.findByIdAndUpdate(progress._id, req.body, { new: true });
    } else {
      progress = await Progress.create(req.body);
    }
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteProgress = async (req, res) => {
  try {
    await Progress.deleteMany({});
    res.status(200).json({ status: 'success', message: 'Progress reset successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
