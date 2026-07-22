const fs = require('fs');
const path = require('path');

let NOTES_FILE_PATH = path.join(__dirname, '../../backend/memory/notes.json');
try {
  if (fs.existsSync(path.join(__dirname, '../memory/notes.json'))) {
    NOTES_FILE_PATH = path.join(__dirname, '../memory/notes.json');
  }
} catch (e) {}

const readNotesFromFile = () => {
  try {
    if (!fs.existsSync(NOTES_FILE_PATH)) {
      // Ensure directory exists
      const dir = path.dirname(NOTES_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(NOTES_FILE_PATH, '[]');
      return [];
    }
    const data = fs.readFileSync(NOTES_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading notes file:', error);
    return [];
  }
};

const writeNotesToFile = (notes) => {
  try {
    const dir = path.dirname(NOTES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing notes file:', error);
    return false;
  }
};

exports.getNotes = (req, res) => {
  const notes = readNotesFromFile();
  res.status(200).json(notes);
};

exports.saveNotes = (req, res) => {
  const payload = req.body;
  
  if (Array.isArray(payload)) {
    const success = writeNotesToFile(payload);
    if (success) {
      return res.status(200).json({ status: 'success', message: 'Notes array updated successfully' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to write notes array' });
  }

  // Handle single note saving/updating
  if (!payload || !payload.title) {
    return res.status(400).json({ status: 'error', message: 'Note title is required' });
  }

  const notes = readNotesFromFile();
  const noteId = payload.id;

  if (noteId) {
    // Update existing note
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        ...payload,
        createdAt: payload.createdAt || new Date().toISOString()
      };
    } else {
      notes.push({
        ...payload,
        createdAt: payload.createdAt || new Date().toISOString()
      });
    }
  } else {
    // Create new note
    const newNote = {
      ...payload,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    notes.unshift(newNote);
  }

  const success = writeNotesToFile(notes);
  if (success) {
    res.status(200).json({ status: 'success', message: 'Note saved successfully', notes });
  } else {
    res.status(500).json({ status: 'error', message: 'Failed to save note' });
  }
};

exports.deleteNote = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'Note ID is required' });
  }

  let notes = readNotesFromFile();
  notes = notes.filter(n => n.id !== id);

  const success = writeNotesToFile(notes);
  if (success) {
    res.status(200).json(notes);
  } else {
    res.status(500).json({ status: 'error', message: 'Failed to delete note' });
  }
};
