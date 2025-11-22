const express = require('express');
const { body } = require('express-validator');
const {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouse.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Validation rules
const warehouseValidation = [
  body('name').trim().notEmpty().withMessage('Warehouse name is required'),
  body('code').trim().notEmpty().withMessage('Warehouse code is required')
];

// Routes
router.post('/', warehouseValidation, createWarehouse);
router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.put('/:id', warehouseValidation, updateWarehouse);
router.delete('/:id', deleteWarehouse);

module.exports = router;

