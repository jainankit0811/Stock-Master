const express = require('express');
const { body } = require('express-validator');
const {
  createDeliveryOrder,
  getDeliveryOrders,
  getDeliveryOrder,
  validateDeliveryOrder,
  updateDeliveryOrder,
  deleteDeliveryOrder
} = require('../controllers/deliveryOrder.controller');
const { verifyToken, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const deliveryOrderValidation = [
  body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').notEmpty().withMessage('Product ID is required for each line'),
  body('lines.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
];

// Routes
router.post('/', deliveryOrderValidation, createDeliveryOrder);
router.get('/', getDeliveryOrders);
router.get('/:id', getDeliveryOrder);
router.post('/:id/validate', requireManager, validateDeliveryOrder); // Only manager can validate
router.put('/:id', deliveryOrderValidation, updateDeliveryOrder);
router.delete('/:id', deleteDeliveryOrder);

module.exports = router;

