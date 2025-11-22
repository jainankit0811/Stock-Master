const Receipt = require('../models/Receipt.model');
const Warehouse = require('../models/Warehouse.model');
const Product = require('../models/Product.model');
const stockService = require('../services/stockService');
const mongoose = require('mongoose');

/**
 * Generate receipt number
 */
const generateReceiptNumber = async (session) => {
  const count = await Receipt.countDocuments({}, { session });
  return `REC-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Create a new receipt
 * POST /api/receipts
 */
const createReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { warehouseId, lines, notes, receiveFrom, scheduleDate, responsible } = req.body;

    // Validate warehouse exists
    const warehouse = await Warehouse.findById(warehouseId).session(session);
    if (!warehouse) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Validate products exist
    for (const line of lines) {
      const product = await Product.findById(line.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${line.productId}`
        });
      }
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(session);

    // Create receipt
    const newReceipt = new Receipt({
      receiptNumber,
      warehouseId,
      lines,
      notes,
      receiveFrom,
      scheduleDate,
      responsible,
      status: 'Draft',
      createdBy: req.user._id
    });
		
    const receipt = await newReceipt.save({ session });
    
    await session.commitTransaction();

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: { receipt: populatedReceipt }
    });
  } catch (error) {
    console.error('Error creating receipt:', error);
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating receipt'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all receipts
 * GET /api/receipts
 */
const getReceipts = async (req, res) => {
  try {
    const { status, warehouseId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouseId) query.warehouseId = warehouseId;

    const receipts = await Receipt.find(query)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: receipts.length,
      data: { receipts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching receipts'
    });
  }
};

/**
 * Get single receipt by ID
 * GET /api/receipts/:id
 */
const getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouseId', 'name code address')
      .populate('lines.productId', 'name sku category unit')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      data: { receipt }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching receipt'
    });
  }
};

/**
 * Validate receipt (only manager can do this)
 * POST /api/receipts/:id/validate
 */
const validateReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receipt = await Receipt.findById(req.params.id).session(session);

    if (!receipt) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'Validated') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Receipt is already validated'
      });
    }

    // Update stock for each line
    for (const line of receipt.lines) {
      await stockService.receiveStock(
        line.productId,
        receipt.warehouseId,
        line.quantity,
        req.user._id,
        'Receipt',
        receipt._id,
        `Receipt ${receipt.receiptNumber}`,
        session
      );
    }

    // Update receipt status
    receipt.status = 'Validated';
    receipt.validatedBy = req.user._id;
    receipt.validatedAt = new Date();
    await receipt.save({ session });

    await session.commitTransaction();

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    res.json({
      success: true,
      message: 'Receipt validated successfully',
      data: { receipt: populatedReceipt }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating receipt'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update receipt (only if Draft)
 * PUT /api/receipts/:id
 */
const updateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update validated receipt'
      });
    }

    const { warehouseId, lines, notes, receiveFrom, scheduleDate, responsible } = req.body;

    if (warehouseId) receipt.warehouseId = warehouseId;
    if (lines) receipt.lines = lines;
    if (notes !== undefined) receipt.notes = notes;
    if (receiveFrom) receipt.receiveFrom = receiveFrom;
    if (scheduleDate) receipt.scheduleDate = scheduleDate;
    if (responsible) receipt.responsible = responsible;

    await receipt.save();

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Receipt updated successfully',
      data: { receipt: populatedReceipt }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating receipt'
    });
  }
};

/**
 * Delete receipt (only if Draft)
 * DELETE /api/receipts/:id
 */
const deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete validated receipt'
      });
    }

    await Receipt.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting receipt'
    });
  }
};

module.exports = {
  createReceipt,
  getReceipts,
  getReceipt,
  validateReceipt,
  updateReceipt,
  deleteReceipt
};

