const express = require('express');
const { body } = require('express-validator');
const {
  getActiveStockAlerts,
  triggerLowStockCheck,
  resolveStockAlert
} = require('../controllers/stockAlert.controller');
const { verifyToken, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/active', getActiveStockAlerts);
router.post('/check', requireManager, triggerLowStockCheck); // Only managers can manually trigger checks
router.put('/:id/resolve', requireManager, resolveStockAlert); // Only managers can resolve alerts

module.exports = router;
