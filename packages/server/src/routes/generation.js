const express = require('express');
const { generateWorksheets } = require('../controllers/generationController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/generate/worksheets', optionalAuth, generateWorksheets);

module.exports = router;
