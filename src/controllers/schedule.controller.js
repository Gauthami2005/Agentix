const Schedule = require('../models/Schedule');

exports.getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne().sort({ createdAt: -1 });
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.saveSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.findOne();
    if (schedule) {
      schedule = await Schedule.findByIdAndUpdate(schedule._id, req.body, { new: true });
    } else {
      schedule = await Schedule.create(req.body);
    }
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await Schedule.deleteMany({});
    res.status(200).json({ status: 'success', message: 'Schedule cleared successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
