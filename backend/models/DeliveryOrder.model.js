const mongoose = require('mongoose');

const deliveryOrderLineSchema = new mongoose.Schema({
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
    min: 0
  }
}, { _id: true });

const deliveryOrderSchema = new mongoose.Schema({
  orderNumber: {
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
  lines: [deliveryOrderLineSchema],
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
deliveryOrderSchema.index({ orderNumber: 1 });
deliveryOrderSchema.index({ warehouseId: 1 });
deliveryOrderSchema.index({ status: 1 });
deliveryOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DeliveryOrder', deliveryOrderSchema);

