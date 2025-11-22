const Product = require('../models/Product.model');
const StockBalance = require('../models/StockBalance.model');
const Receipt = require('../models/Receipt.model');
const DeliveryOrder = require('../models/DeliveryOrder.model');
const Transfer = require('../models/Transfer.model');

/**
 * Get dashboard KPIs
 * GET /api/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock count (quantity <= 10)
    const lowStockCount = await StockBalance.countDocuments({
      quantity: { $lte: 10 }
    });

    // Pending receipts
    const pendingReceipts = await Receipt.countDocuments({
      status: 'Draft'
    });

    // Pending delivery orders
    const pendingDeliveries = await DeliveryOrder.countDocuments({
      status: 'Draft'
    });

    // Pending transfers
    const pendingTransfers = await Transfer.countDocuments({
      status: 'Draft'
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
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

module.exports = {
  getDashboard
};

