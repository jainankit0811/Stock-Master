const express = require('express');
const { body } = require('express-validator');
const {
  createTransfer,
  getTransfers,
  getTransfer,
  validateTransfer,
  updateTransfer,
  deleteTransfer
} = require('../controllers/transfer.controller');
const { verifyToken, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const transferValidation = [
  body('fromWarehouseId').notEmpty().withMessage('From warehouse ID is required'),
  body('toWarehouseId').notEmpty().withMessage('To warehouse ID is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').notEmpty().withMessage('Product ID is required for each line'),
  body('lines.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
];

// Routes
router.post('/', transferValidation, createTransfer);
router.get('/', getTransfers);
router.get('/:id', getTransfer);
router.post('/:id/validate', requireManager, validateTransfer); // Only manager can validate
router.put('/:id', transferValidation, updateTransfer);
router.delete('/:id', deleteTransfer);

module.exports = router;

