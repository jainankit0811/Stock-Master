const mongoose = require('mongoose');

const transferLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  }
}, { _id: true });

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  fromWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Validated'],
    default: 'Draft'
  },
  lines: [transferLineSchema],
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

// Validation: from and to warehouses must be different
transferSchema.pre('validate', function(next) {
  if (this.fromWarehouseId && this.toWarehouseId) {
    if (this.fromWarehouseId.toString() === this.toWarehouseId.toString()) {
      return next(new Error('From and To warehouses must be different'));
    }
  }
  next();
});

// Indexes
transferSchema.index({ transferNumber: 1 });
transferSchema.index({ fromWarehouseId: 1 });
transferSchema.index({ toWarehouseId: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transfer', transferSchema);

