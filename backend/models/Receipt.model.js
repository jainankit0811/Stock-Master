const mongoose = require('mongoose');

const receiptLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  receiveFrom: {
    type: String,
    trim: true
  },
  scheduleDate: {
    type: Date
  },
  responsible: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Validated'],
    default: 'Draft'
  },
  lines: [receiptLineSchema],
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ warehouseId: 1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Receipt', receiptSchema);
