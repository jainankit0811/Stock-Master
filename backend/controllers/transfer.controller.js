const Transfer = require('../models/Transfer.model');
const Warehouse = require('../models/Warehouse.model');
const Product = require('../models/Product.model');
const stockService = require('../services/stockService');
const mongoose = require('mongoose');

/**
 * Generate transfer number
 */
const generateTransferNumber = async () => {
  const count = await Transfer.countDocuments();
  return `TRF-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Create a new transfer
 * POST /api/transfers
 */
const createTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromWarehouseId, toWarehouseId, lines, notes } = req.body;

    // Validate warehouses exist
    const fromWarehouse = await Warehouse.findById(fromWarehouseId);
    const toWarehouse = await Warehouse.findById(toWarehouseId);
    
    if (!fromWarehouse || !toWarehouse) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'From and To warehouses must be different'
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

    // Generate transfer number
    const transferNumber = await generateTransferNumber();

    // Create transfer
    const transfer = await Transfer.create([{
      transferNumber,
      fromWarehouseId,
      toWarehouseId,
      lines,
      notes,
      status: 'Draft',
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();

    const populatedTransfer = await Transfer.findById(transfer[0]._id)
      .populate('fromWarehouseId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      data: { transfer: populatedTransfer }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating transfer'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all transfers
 * GET /api/transfers
 */
const getTransfers = async (req, res) => {
  try {
    const { status, fromWarehouseId, toWarehouseId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (fromWarehouseId) query.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) query.toWarehouseId = toWarehouseId;

    const transfers = await Transfer.find(query)
      .populate('fromWarehouseId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transfers.length,
      data: { transfers }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transfers'
    });
  }
};

/**
 * Get single transfer by ID
 * GET /api/transfers/:id
 */
const getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouseId', 'name code address')
      .populate('toWarehouseId', 'name code address')
      .populate('lines.productId', 'name sku category unit')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      data: { transfer }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transfer'
    });
  }
};

/**
 * Validate transfer (only manager can do this)
 * POST /api/transfers/:id/validate
 */
const validateTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await Transfer.findById(req.params.id).session(session);

    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'Validated') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Transfer is already validated'
      });
    }

    // Transfer stock for each line (updates both warehouses in transaction)
    for (const line of transfer.lines) {
      await stockService.transferStock(
        line.productId,
        transfer.fromWarehouseId,
        transfer.toWarehouseId,
        line.quantity,
        req.user._id,
        'Transfer',
        transfer._id,
        `Transfer ${transfer.transferNumber}`,
        session
      );
    }

    // Update transfer status
    transfer.status = 'Validated';
    transfer.validatedBy = req.user._id;
    transfer.validatedAt = new Date();
    await transfer.save({ session });

    await session.commitTransaction();

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('fromWarehouseId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    res.json({
      success: true,
      message: 'Transfer validated successfully',
      data: { transfer: populatedTransfer }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating transfer'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update transfer (only if Draft)
 * PUT /api/transfers/:id
 */
const updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update validated transfer'
      });
    }

    const { fromWarehouseId, toWarehouseId, lines, notes } = req.body;

    if (fromWarehouseId) transfer.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) transfer.toWarehouseId = toWarehouseId;
    if (lines) transfer.lines = lines;
    if (notes !== undefined) transfer.notes = notes;

    await transfer.save();

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('fromWarehouseId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Transfer updated successfully',
      data: { transfer: populatedTransfer }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating transfer'
    });
  }
};

/**
 * Delete transfer (only if Draft)
 * DELETE /api/transfers/:id
 */
const deleteTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete validated transfer'
      });
    }

    await Transfer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transfer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting transfer'
    });
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  getTransfer,
  validateTransfer,
  updateTransfer,
  deleteTransfer
};

