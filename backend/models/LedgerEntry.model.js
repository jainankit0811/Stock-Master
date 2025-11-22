const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
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
  documentType: {
    type: String,
    enum: ['Receipt', 'DeliveryOrder', 'Transfer', 'Adjustment'],
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ledgerEntrySchema.index({ productId: 1, warehouseId: 1 });
ledgerEntrySchema.index({ documentType: 1, documentId: 1 });
ledgerEntrySchema.index({ createdAt: -1 });
ledgerEntrySchema.index({ userId: 1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

