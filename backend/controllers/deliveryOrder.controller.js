const DeliveryOrder = require('../models/DeliveryOrder.model');
const Warehouse = require('../models/Warehouse.model');
const Product = require('../models/Product.model');
const stockService = require('../services/stockService');
const mongoose = require('mongoose');

/**
 * Generate delivery order number
 */
const generateOrderNumber = async () => {
  const count = await DeliveryOrder.countDocuments();
  return `DO-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Create a new delivery order
 * POST /api/delivery-orders
 */
const createDeliveryOrder = async (req, res) => {
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

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create delivery order
    const deliveryOrder = await DeliveryOrder.create([{
      orderNumber,
      warehouseId,
      lines,
      notes,
      status: 'Draft',
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();

    const populatedOrder = await DeliveryOrder.findById(deliveryOrder[0]._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Delivery order created successfully',
      data: { deliveryOrder: populatedOrder }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating delivery order'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all delivery orders
 * GET /api/delivery-orders
 */
const getDeliveryOrders = async (req, res) => {
  try {
    const { status, warehouseId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouseId) query.warehouseId = warehouseId;

    const deliveryOrders = await DeliveryOrder.find(query)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: deliveryOrders.length,
      data: { deliveryOrders }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching delivery orders'
    });
  }
};

/**
 * Get single delivery order by ID
 * GET /api/delivery-orders/:id
 */
const getDeliveryOrder = async (req, res) => {
  try {
    const deliveryOrder = await DeliveryOrder.findById(req.params.id)
      .populate('warehouseId', 'name code address')
      .populate('lines.productId', 'name sku category unit')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    if (!deliveryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    res.json({
      success: true,
      data: { deliveryOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching delivery order'
    });
  }
};

/**
 * Validate delivery order (only manager can do this)
 * POST /api/delivery-orders/:id/validate
 */
const validateDeliveryOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deliveryOrder = await DeliveryOrder.findById(req.params.id).session(session);

    if (!deliveryOrder) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    if (deliveryOrder.status === 'Validated') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Delivery order is already validated'
      });
    }

    // Update stock for each line (decrease stock)
    for (const line of deliveryOrder.lines) {
      await stockService.deliverStock(
        line.productId,
        deliveryOrder.warehouseId,
        line.quantity,
        req.user._id,
        'DeliveryOrder',
        deliveryOrder._id,
        `Delivery Order ${deliveryOrder.orderNumber}`,
        session
      );
    }

    // Update delivery order status
    deliveryOrder.status = 'Validated';
    deliveryOrder.validatedBy = req.user._id;
    deliveryOrder.validatedAt = new Date();
    await deliveryOrder.save({ session });

    await session.commitTransaction();

    const populatedOrder = await DeliveryOrder.findById(deliveryOrder._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name email');

    res.json({
      success: true,
      message: 'Delivery order validated successfully',
      data: { deliveryOrder: populatedOrder }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating delivery order'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update delivery order (only if Draft)
 * PUT /api/delivery-orders/:id
 */
const updateDeliveryOrder = async (req, res) => {
  try {
    const deliveryOrder = await DeliveryOrder.findById(req.params.id);

    if (!deliveryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    if (deliveryOrder.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update validated delivery order'
      });
    }

    const { warehouseId, lines, notes } = req.body;

    if (warehouseId) deliveryOrder.warehouseId = warehouseId;
    if (lines) deliveryOrder.lines = lines;
    if (notes !== undefined) deliveryOrder.notes = notes;

    await deliveryOrder.save();

    const populatedOrder = await DeliveryOrder.findById(deliveryOrder._id)
      .populate('warehouseId', 'name code')
      .populate('lines.productId', 'name sku')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Delivery order updated successfully',
      data: { deliveryOrder: populatedOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating delivery order'
    });
  }
};

/**
 * Delete delivery order (only if Draft)
 * DELETE /api/delivery-orders/:id
 */
const deleteDeliveryOrder = async (req, res) => {
  try {
    const deliveryOrder = await DeliveryOrder.findById(req.params.id);

    if (!deliveryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    if (deliveryOrder.status === 'Validated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete validated delivery order'
      });
    }

    await DeliveryOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Delivery order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting delivery order'
    });
  }
};

module.exports = {
  createDeliveryOrder,
  getDeliveryOrders,
  getDeliveryOrder,
  validateDeliveryOrder,
  updateDeliveryOrder,
  deleteDeliveryOrder
};

