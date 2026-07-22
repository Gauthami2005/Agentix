const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');

router.get('/', notesController.getNotes);
router.post('/', notesController.saveNotes);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
