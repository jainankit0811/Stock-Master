const mongoose = require('mongoose');

const adjustmentLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  }
}, { _id: true });

const adjustmentSchema = new mongoose.Schema({
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Validated'],
    default: 'Draft'
  },
  lines: [adjustmentLineSchema],
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
adjustmentSchema.index({ adjustmentNumber: 1 });
adjustmentSchema.index({ warehouseId: 1 });
adjustmentSchema.index({ status: 1 });
adjustmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Adjustment', adjustmentSchema);

