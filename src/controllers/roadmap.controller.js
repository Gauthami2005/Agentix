const Roadmap = require('../models/Roadmap');

exports.getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find().sort({ createdAt: -1 });
    res.status(200).json(roadmaps);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ status: 'error', message: 'Roadmap not found' });
    res.status(200).json(roadmap);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createRoadmap = async (req, res) => {
  try {
    const newRoadmap = await Roadmap.create(req.body);
    res.status(201).json(newRoadmap);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const updated = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ status: 'error', message: 'Roadmap not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteRoadmap = async (req, res) => {
  try {
    const deleted = await Roadmap.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Roadmap not found' });
    res.status(200).json({ status: 'success', message: 'Roadmap deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
