const express = require('express');
const { listTasks } = require('../controllers/tasksController');
const router = express.Router();

router.get('/tasks', listTasks);

module.exports = router;
