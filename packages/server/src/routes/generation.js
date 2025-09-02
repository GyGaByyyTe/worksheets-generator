const express = require('express');
const {
  generateWorksheets,
  listRecentGenerations,
} = require('../controllers/generationController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/generate/worksheets', optionalAuth, generateWorksheets);
router.get('/generations/recent', optionalAuth, listRecentGenerations);

module.exports = router;
