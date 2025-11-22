const express = require('express');
const { body } = require('express-validator');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('unit').optional().trim().notEmpty(),
  body('minStockLevel').optional().isFloat({ min: 0 }).withMessage('Minimum stock level must be a non-negative number')
];

// Routes
router.post('/', productValidation, createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', productValidation, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;

