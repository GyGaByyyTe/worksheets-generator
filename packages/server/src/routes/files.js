const express = require('express');
const { getFile, previewDay, downloadGeneration } = require('../controllers/filesController');

const router = express.Router();

router.get('/files/:id', getFile);
router.get('/generations/:genId/day/:day/index.html', previewDay);
router.get('/generations/:genId/download', downloadGeneration);

module.exports = router;
