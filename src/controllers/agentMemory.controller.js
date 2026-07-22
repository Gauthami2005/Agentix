const AgentMemory = require('../models/AgentMemory');

exports.getSessions = async (req, res) => {
  try {
    const sessions = await AgentMemory.find().sort({ lastUpdated: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await AgentMemory.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const newSession = await AgentMemory.create(req.body);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const updated = await AgentMemory.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ status: 'error', message: 'Session not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const deleted = await AgentMemory.findOneAndDelete({ sessionId: req.params.sessionId });
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Session not found' });
    res.status(200).json({ status: 'success', message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
