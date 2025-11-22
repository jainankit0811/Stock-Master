const express = require('express');
const { body } = require('express-validator');
const {
  createAdjustment,
  getAdjustments,
  getAdjustment,
  validateAdjustment,
  updateAdjustment,
  deleteAdjustment
} = require('../controllers/adjustment.controller');
const { verifyToken, requireManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const adjustmentValidation = [
  body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').notEmpty().withMessage('Product ID is required for each line'),
  body('lines.*.quantity').isNumeric().withMessage('Quantity must be a number')
];

// Routes
router.post('/', adjustmentValidation, createAdjustment);
router.get('/', getAdjustments);
router.get('/:id', getAdjustment);
router.post('/:id/validate', requireManager, validateAdjustment); // Only manager can validate
router.put('/:id', adjustmentValidation, updateAdjustment);
router.delete('/:id', deleteAdjustment);

module.exports = router;

