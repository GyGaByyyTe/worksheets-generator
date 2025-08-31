const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/me', optionalAuth, me);

module.exports = router;
