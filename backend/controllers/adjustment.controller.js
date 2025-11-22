const Adjustment = require('../models/Adjustment.model');
const Warehouse = require('../models/Warehouse.model');
const Product = require('../models/Product.model');
const stockService = require('../services/stockService');
const mongoose = require('mongoose');

/**
 * Generate adjustment number
 */
const generateAdjustmentNumber = async () => {
  const count = await Adjustment.countDocuments();
  return `ADJ-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Create a new adjustment
 * POST /api/adjustments
 */
const createAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { warehouseId, lines, notes } = req.body;

    // Validate warehouse exists
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Validate products exist
    for (const line of lines) {
      const product = await Product.findById(line.productId);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${line.productId}`
        });
      }
    }

    // Generate adjustment number
    const adjustmentNumber = await generateAdjustmentNumber();

    // Create adjustment
    const adjustment = await Adjustment.create([{
      adjustmentNumber,
      warehouseId,
      lines,
      notes,
      status: 'Draft',
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();

    const populatedAdjustment = await Adjustment.findById(adjustment[0]._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Adjustment created successfully',
      data: { adjustment: populatedAdjustment }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating adjustment'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all adjustments
 * GET /api/adjustments
 */
const getAdjustments = async (req, res) => {
  try {
    const { status, warehouseId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouseId) query.warehouseId = warehouseId;

    const adjustments = await Adjustment.find(query)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: adjustments.length,
      data: { adjustments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching adjustments'
    });
  }
};

/**
 * Get single adjustment by ID
 * GET /api/adjustments/:id
 */
const getAdjustment = async (req, res) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id)
      .populate('warehouseId', 'name code address')
      .populate('lines.productId', 'name sku category unit')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    res.json({
      success: true,
      data: { adjustment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching adjustment'
    });
  }
};

/**
 * Validate adjustment (only manager can do this)
 * POST /api/adjustments/:id/validate
 */
const validateAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustment = await Adjustment.findById(req.params.id).session(session);

    if (!adjustment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    if (adjustment.status === 'Validated') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Adjustment is already validated'
      });
    }

    // Adjust stock for each line (quantity can be positive or negative)
    for (const line of adjustment.lines) {
      await stockService.adjustStock(
        line.productId,
        adjustment.warehouseId,
        line.quantity,
        req.user._id,
        'Adjustment',
        adjustment._id,
        `Adjustment ${adjustment.adjustmentNumber}: ${line.reason || ''}`,
        session
      );
    }

    // Update adjustment status
    adjustment.status = 'Validated';
    adjustment.validatedBy = req.user._id;
    adjustment.validatedAt = new Date();
    await adjustment.save({ session });

    await session.commitTransaction();

    const populatedAdjustment = await Adjustment.findById(adjustment._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    res.json({
      success: true,
      message: 'Adjustment validated successfully',
      data: { adjustment: populatedAdjustment }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating adjustment'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update adjustment (only if Draft)
 * PUT /api/adjustments/:id
 */
const updateAdjustment = async (req, res) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    if (adjustment.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update validated adjustment'
      });
    }

    const { warehouseId, lines, notes } = req.body;

    if (warehouseId) adjustment.warehouseId = warehouseId;
    if (lines) adjustment.lines = lines;
    if (notes !== undefined) adjustment.notes = notes;

    await adjustment.save();

    const populatedAdjustment = await Adjustment.findById(adjustment._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Adjustment updated successfully',
      data: { adjustment: populatedAdjustment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating adjustment'
    });
  }
};

/**
 * Delete adjustment (only if Draft)
 * DELETE /api/adjustments/:id
 */
const deleteAdjustment = async (req, res) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Adjustment not found'
      });
    }

    if (adjustment.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete validated adjustment'
      });
    }

    await Adjustment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Adjustment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting adjustment'
    });
  }
};

module.exports = {
  createAdjustment,
  getAdjustments,
  getAdjustment,
  validateAdjustment,
  updateAdjustment,
  deleteAdjustment
};

