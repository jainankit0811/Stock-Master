const Product = require('../models/Product.model');
const StockBalance = require('../models/StockBalance.model');
const StockAlert = require('../models/StockAlert.model');
const Warehouse = require('../models/Warehouse.model'); // Added to iterate through warehouses

/**
 * Checks for low stock products across all warehouses and creates/updates alerts.
 */
const checkLowStock = async () => {
  try {
    const products = await Product.find({});
    const warehouses = await Warehouse.find({}); // Fetch all warehouses

    for (const product of products) {
      for (const warehouse of warehouses) {
        const stockBalance = await StockBalance.findOne({
          productId: product._id,
          warehouseId: warehouse._id,
        });

        const currentStock = stockBalance ? stockBalance.quantity : 0;

        if (currentStock < product.minStockLevel) {
          // Check if an active alert already exists for this product in this warehouse
          let existingAlert = await StockAlert.findOne({
            productId: product._id,
            warehouseId: warehouse._id,
            isResolved: false,
          });

          if (!existingAlert) {
            // Create a new alert
            existingAlert = new StockAlert({
              productId: product._id,
              warehouseId: warehouse._id,
              currentStock: currentStock,
              minStockLevel: product.minStockLevel,
              alertDate: new Date(),
            });
            await existingAlert.save();
            console.log(`Low stock alert created for Product ${product.name} in Warehouse ${warehouse.name}. Current: ${currentStock}, Min: ${product.minStockLevel}`);
          } else {
            // Update existing alert with current stock level and alert date
            existingAlert.currentStock = currentStock;
            existingAlert.alertDate = new Date();
            await existingAlert.save();
            console.log(`Low stock alert updated for Product ${product.name} in Warehouse ${warehouse.name}. Current: ${currentStock}, Min: ${product.minStockLevel}`);
          }
        } else {
          // If stock is now sufficient, resolve any active alerts for this product in this warehouse
          await StockAlert.updateMany(
            {
              productId: product._id,
              warehouseId: warehouse._id,
              isResolved: false,
            },
            {
              $set: {
                isResolved: true,
                resolvedAt: new Date(),
                // We don't set resolvedBy here as it's an automated resolution
              },
            }
          );
        }
      }
    }
    return { success: true, message: 'Low stock check completed.' };
  } catch (error) {
    console.error('Error during low stock check:', error);
    return { success: false, message: 'Error during low stock check.', error: error.message };
  }
};

/**
 * Resolves a specific stock alert.
 * @param {string} alertId - The ID of the stock alert to resolve.
 * @param {string} userId - The ID of the user resolving the alert.
 */
const resolveAlert = async (alertId, userId) => {
  try {
    const alert = await StockAlert.findById(alertId);

    if (!alert) {
      return { success: false, message: 'Stock alert not found.' };
    }
    if (alert.isResolved) {
      return { success: false, message: 'Stock alert is already resolved.' };
    }

    alert.isResolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    await alert.save();

    return { success: true, message: 'Stock alert resolved successfully.', data: { alert } };
  } catch (error) {
    console.error('Error resolving stock alert:', error);
    return { success: false, message: 'Error resolving stock alert.', error: error.message };
  }
};

/**
 * Get all active (unresolved) stock alerts.
 */
const getActiveAlerts = async () => {
  try {
    const alerts = await StockAlert.find({ isResolved: false })
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .sort({ alertDate: -1 });
    return { success: true, data: { alerts } };
  } catch (error) {
    console.error('Error fetching active stock alerts:', error);
    return { success: false, message: 'Error fetching active stock alerts.', error: error.message };
  }
};

module.exports = {
  checkLowStock,
  resolveAlert,
  getActiveAlerts,
};