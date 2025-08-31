const express = require('express');
const { getFile, previewDay } = require('../controllers/filesController');

const router = express.Router();

router.get('/files/:id', getFile);
router.get('/generations/:genId/day/:day/index.html', previewDay);

module.exports = router;
