const stockAlertService = require('../services/stockAlertService');
const { validationResult } = require('express-validator');

/**
 * Get all active (unresolved) stock alerts.
 * GET /api/stock-alerts/active
 */
const getActiveStockAlerts = async (req, res) => {
  try {
    const { success, data, message, error } = await stockAlertService.getActiveAlerts();
    if (success) {
      res.json({ success: true, count: data.alerts.length, data: data });
    } else {
      res.status(500).json({ success: false, message: message, error: error });
    }
  } catch (error) {
    console.error('Error in getActiveStockAlerts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active stock alerts.', error: error.message });
  }
};

/**
 * Manually trigger a low stock check.
 * POST /api/stock-alerts/check
 */
const triggerLowStockCheck = async (req, res) => {
  try {
    const { success, message, error } = await stockAlertService.checkLowStock();
    if (success) {
      res.json({ success: true, message: message });
    } else {
      res.status(500).json({ success: false, message: message, error: error });
    }
  } catch (error) {
    console.error('Error in triggerLowStockCheck:', error);
    res.status(500).json({ success: false, message: 'Server error triggering low stock check.', error: error.message });
  }
};

/**
 * Resolve a specific stock alert.
 * PUT /api/stock-alerts/:id/resolve
 */
const resolveStockAlert = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const userId = req.user._id; // Assuming user is authenticated and req.user is populated

    const { success, message, data, error } = await stockAlertService.resolveAlert(id, userId);

    if (success) {
      res.json({ success: true, message: message, data: data });
    } else {
      // Differentiate between not found and already resolved for better API responses
      if (message.includes('not found')) {
        res.status(404).json({ success: false, message: message });
      } else if (message.includes('already resolved')) {
        res.status(400).json({ success: false, message: message });
      } else {
        res.status(500).json({ success: false, message: message, error: error });
      }
    }
  } catch (error) {
    console.error('Error in resolveStockAlert:', error);
    res.status(500).json({ success: false, message: 'Server error resolving stock alert.', error: error.message });
  }
};

module.exports = {
  getActiveStockAlerts,
  triggerLowStockCheck,
  resolveStockAlert
};