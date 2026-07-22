const mongoose = require('mongoose');
const Note = require('../models/Note');

// Get all notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Save a single note or an array of notes
exports.saveNotes = async (req, res) => {
  const payload = req.body;

  if (Array.isArray(payload)) {
    try {
      // Clear existing and replace with new array
      await Note.deleteMany({});
      const inserted = await Note.insertMany(payload);
      return res.status(200).json({ status: 'success', message: 'Notes array updated successfully', notes: inserted });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  }

  // Handle single note saving/updating
  if (!payload) {
    return res.status(400).json({ status: 'error', message: 'Payload is required' });
  }

  const noteId = payload.id || payload._id;

  try {
    let note;
    const noteData = {
      ...payload,
      title: payload.title || 'Untitled Note'
    };

    if (noteId) {
      if (mongoose.Types.ObjectId.isValid(noteId)) {
        note = await Note.findByIdAndUpdate(noteId, noteData, { new: true });
      } else {
        note = await Note.findOneAndUpdate({ id: noteId }, noteData, { new: true });
      }
      
      if (note) {
        console.log('📝 Saved note to MongoDB Atlas: ' + note._id);
      } else {
        // If not found by ID (maybe a new string ID), create it
        const { title, content, tags, userId, user_id, createdAt } = payload;
        const newNote = new Note({
          title: title || 'Untitled Note',
          content: content || '',
          tags: tags || [],
          userId: userId || user_id,
          user_id: user_id || userId,
          createdAt: createdAt || new Date()
        });
        note = await newNote.save();
        console.log('📝 Saved note to MongoDB Atlas: ' + note._id);
      }
    } else {
      // Create new note
      const { title, content, tags, userId, user_id } = payload;
      const newNote = new Note({
        title: title || 'Untitled Note',
        content: content || '',
        tags: tags || [],
        userId: userId || user_id,
        user_id: user_id || userId,
        createdAt: new Date()
      });
      note = await newNote.save();
      console.log('📝 Saved note to MongoDB Atlas: ' + note._id);
    }

    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', message: 'Note saved successfully', note, notes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'Note ID is required' });
  }

  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Note.findByIdAndDelete(id);
    } else {
      await Note.deleteOne({ id });
    }
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
