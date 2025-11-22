const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  alertDate: {
    type: Date,
    default: Date.now
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

stockAlertSchema.index({ productId: 1, warehouseId: 1, isResolved: 1 });
stockAlertSchema.index({ isResolved: 1, alertDate: -1 });

module.exports = mongoose.model('StockAlert', stockAlertSchema);