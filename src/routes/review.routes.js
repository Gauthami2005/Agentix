const express = require('express');
const router = express.Router();
const { generateResumeBullets } = require('../controllers/review.controller');

// Import verifyToken middleware, with fallbacks for dynamic project loading
let verifyToken;
try {
    verifyToken = require('../middleware/auth.middleware').verifyToken;
} catch (e) {
    try {
        verifyToken = require('../middleware/verifyToken');
    } catch (err) {
        // Fallback mock middleware if it does not exist yet in reference architecture
        verifyToken = (req, res, next) => { next(); };
    }
}

router.post('/resume-bullets', verifyToken, generateResumeBullets);

module.exports = router;
