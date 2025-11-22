const Warehouse = require('../models/Warehouse.model');

/**
 * Create a new warehouse
 * POST /api/warehouses
 */
const createWarehouse = async (req, res) => {
  try {
    const { name, code, address } = req.body;

    // Check if code already exists
    const existingWarehouse = await Warehouse.findOne({ code: code.toUpperCase() });
    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse with this code already exists'
      });
    }

    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase(),
      address
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { warehouse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating warehouse'
    });
  }
};

/**
 * Get all warehouses
 * GET /api/warehouses
 */
const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: warehouses.length,
      data: { warehouses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching warehouses'
    });
  }
};

/**
 * Get single warehouse by ID
 * GET /api/warehouses/:id
 */
const getWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      data: { warehouse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching warehouse'
    });
  }
};

/**
 * Update warehouse
 * PUT /api/warehouses/:id
 */
const updateWarehouse = async (req, res) => {
  try {
    const { name, code, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (address !== undefined) updateData.address = address;

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: { warehouse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating warehouse'
    });
  }
};

/**
 * Delete warehouse
 * DELETE /api/warehouses/:id
 */
const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting warehouse'
    });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse
};

