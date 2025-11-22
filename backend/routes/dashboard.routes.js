const express = require('express');
const { getDashboard } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', getDashboard);

module.exports = router;

