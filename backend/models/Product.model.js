const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    default: 'pcs'
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);

