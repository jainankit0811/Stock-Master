const mongoose = require('mongoose');

const stockBalanceSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQty: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Unique compound index to ensure one balance per product-warehouse combination
stockBalanceSchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// Index for faster queries
stockBalanceSchema.index({ warehouseId: 1 });
stockBalanceSchema.index({ quantity: 1 });

module.exports = mongoose.model('StockBalance', stockBalanceSchema);

