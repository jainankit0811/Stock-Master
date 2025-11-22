const express = require('express');
const { body } = require('express-validator');
const {
  createReceipt,
  getReceipts,
  getReceipt,
  validateReceipt,
  updateReceipt,
  deleteReceipt
} = require('../controllers/receipt.controller');
const { verifyToken, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const receiptValidation = [
  body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').notEmpty().withMessage('Product ID is required for each line'),
  body('lines.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
];

// Routes
router.post('/', receiptValidation, createReceipt);
router.get('/', getReceipts);
router.get('/:id', getReceipt);
router.post('/:id/validate', requireManager, validateReceipt); // Only manager can validate
router.put('/:id', receiptValidation, updateReceipt);
router.delete('/:id', deleteReceipt);

module.exports = router;

