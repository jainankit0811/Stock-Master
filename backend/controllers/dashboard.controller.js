const Product = require('../models/Product.model');
const StockBalance = require('../models/StockBalance.model');
const Receipt = require('../models/Receipt.model');
const DeliveryOrder = require('../models/DeliveryOrder.model');
const Transfer = require('../models/Transfer.model');
const Adjustment = require('../models/Adjustment.model');

/**
 * Get dashboard KPIs
 * GET /api/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    // Total products in stock
    const totalProducts = await Product.countDocuments();

    // Low stock count (quantity <= 10 but > 0)
    const lowStockCount = await StockBalance.countDocuments({
      quantity: { $lte: 10, $gt: 0 }
    });

    // Out of stock count (quantity = 0)
    const outOfStockCount = await StockBalance.countDocuments({
      quantity: 0
    });

    // Pending receipts (Draft status - ready to be validated)
    const pendingReceipts = await Receipt.countDocuments({
      status: 'Draft'
    });

    // Pending delivery orders (Draft status - ready to be validated)
    const pendingDeliveries = await DeliveryOrder.countDocuments({
      status: 'Draft'
    });

    // Pending transfers (Draft status - ready to be validated)
    const pendingTransfers = await Transfer.countDocuments({
      status: 'Draft'
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard data'
    });
  }
};

/**
 * Get inventory operations snapshot with filters
 * GET /api/dashboard/operations
 */
const getInventoryOperations = async (req, res) => {
  try {
    const {
      documentType,
      status,
      warehouseId,
      category,
      page = 1,
      limit = 50
    } = req.query;

    const operations = [];
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filters
    const receiptQuery = {};
    const deliveryQuery = {};
    const transferQuery = {};
    const adjustmentQuery = {};

    if (status) {
      receiptQuery.status = status;
      deliveryQuery.status = status;
      transferQuery.status = status;
      adjustmentQuery.status = status;
    }

    if (warehouseId) {
      receiptQuery.warehouseId = warehouseId;
      deliveryQuery.warehouseId = warehouseId;
      transferQuery.$or = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId }
      ];
      adjustmentQuery.warehouseId = warehouseId;
    }

    // Fetch based on document type filter
    if (!documentType || documentType === 'Receipt') {
      const receipts = await Receipt.find(receiptQuery)
        .populate('warehouseId', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      receipts.forEach((receipt) => {
        receipt.lines?.forEach((line) => {
          operations.push({
            _id: `${receipt._id}-${line._id}`,
            documentType: 'Receipt',
            documentId: receipt._id,
            documentNumber: receipt.receiptNumber,
            date: receipt.createdAt,
            status: receipt.status,
            warehouse: receipt.warehouseId?.name || 'N/A',
            productId: line.productId,
            quantity: line.quantity,
            createdBy: receipt.createdBy?.name || 'N/A',
            notes: receipt.notes
          });
        });
      });
    }

    if (!documentType || documentType === 'Delivery') {
      const deliveries = await DeliveryOrder.find(deliveryQuery)
        .populate('warehouseId', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      deliveries.forEach((delivery) => {
        delivery.lines?.forEach((line) => {
          operations.push({
            _id: `${delivery._id}-${line._id}`,
            documentType: 'Delivery',
            documentId: delivery._id,
            documentNumber: delivery.orderNumber,
            date: delivery.createdAt,
            status: delivery.status,
            warehouse: delivery.warehouseId?.name || 'N/A',
            productId: line.productId,
            quantity: line.quantity,
            createdBy: delivery.createdBy?.name || 'N/A',
            notes: delivery.notes
          });
        });
      });
    }

    if (!documentType || documentType === 'Transfer') {
      const transfers = await Transfer.find(transferQuery)
        .populate('fromWarehouseId', 'name code')
        .populate('toWarehouseId', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      transfers.forEach((transfer) => {
        transfer.lines?.forEach((line) => {
          operations.push({
            _id: `${transfer._id}-${line._id}`,
            documentType: 'Transfer',
            documentId: transfer._id,
            documentNumber: transfer.transferNumber,
            date: transfer.createdAt,
            status: transfer.status,
            warehouse: `${transfer.fromWarehouseId?.name || 'N/A'} → ${transfer.toWarehouseId?.name || 'N/A'}`,
            productId: line.productId,
            quantity: line.quantity,
            createdBy: transfer.createdBy?.name || 'N/A',
            notes: transfer.notes
          });
        });
      });
    }

    if (!documentType || documentType === 'Adjustment') {
      const adjustments = await Adjustment.find(adjustmentQuery)
        .populate('warehouseId', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      adjustments.forEach((adjustment) => {
        adjustment.lines?.forEach((line) => {
          operations.push({
            _id: `${adjustment._id}-${line._id}`,
            documentType: 'Adjustment',
            documentId: adjustment._id,
            documentNumber: adjustment.adjustmentNumber,
            date: adjustment.createdAt,
            status: adjustment.status,
            warehouse: adjustment.warehouseId?.name || 'N/A',
            productId: line.productId,
            quantity: line.quantity,
            createdBy: adjustment.createdBy?.name || 'N/A',
            notes: adjustment.notes || line.reason
          });
        });
      });
    }

    // Get all unique product IDs from operations
    const allProductIds = [...new Set(operations.map(op => {
      if (op.productId && typeof op.productId === 'object' && op.productId._id) {
        return op.productId._id.toString();
      }
      return op.productId?.toString();
    }).filter(Boolean))];

    // Fetch products (with category filter if specified)
    const productQuery = { _id: { $in: allProductIds } };
    if (category) {
      productQuery.category = category;
    }
    const products = await Product.find(productQuery).select('name sku category');
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    // Filter operations by category if specified
    let filteredOperations = operations;
    if (category) {
      filteredOperations = operations.filter(op => {
        const pid = op.productId && typeof op.productId === 'object' && op.productId._id 
          ? op.productId._id.toString() 
          : op.productId?.toString();
        return productMap[pid];
      });
    }

    // Add product info to operations
    const enrichedOperations = filteredOperations.map(op => {
      const pid = op.productId && typeof op.productId === 'object' && op.productId._id
        ? op.productId._id.toString()
        : (op.productId?.toString() || op.productId);
      return {
        ...op,
        product: productMap[pid] || { name: 'N/A', sku: 'N/A', category: 'N/A' }
      };
    });

    // Sort by date (newest first)
    enrichedOperations.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      count: enrichedOperations.length,
      page: parseInt(page),
      limit: parseInt(limit),
      data: { operations: enrichedOperations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching inventory operations'
    });
  }
};

module.exports = {
  getDashboard,
  getInventoryOperations
};

