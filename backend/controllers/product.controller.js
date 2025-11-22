const Product = require('../models/Product.model');

/**
 * Create a new product
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const { name, sku, category, unit } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      category,
      unit: unit || 'pcs'
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
};

/**
 * Get all products with filters
 * GET /api/products
 */
const getProducts = async (req, res) => {
  try {
    const { sku, category, lowStock, warehouseId } = req.query;
    const query = {};

    if (sku) {
      query.sku = { $regex: sku.toUpperCase(), $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // If lowStock filter is requested, we need to check StockBalance
    let filteredProducts = products;
    if (lowStock === 'true' && warehouseId) {
      const StockBalance = require('../models/StockBalance.model');
      const balances = await StockBalance.find({
        warehouseId,
        quantity: { $lte: 10 } // Consider low stock as <= 10
      }).populate('productId');

      const lowStockProductIds = balances.map(b => b.productId._id.toString());
      filteredProducts = products.filter(p => lowStockProductIds.includes(p._id.toString()));
    }

    res.json({
      success: true,
      count: filteredProducts.length,
      data: { products: filteredProducts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching products'
    });
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 */
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching product'
    });
  }
};

/**
 * Update product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { name, sku, category, unit } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (sku) updateData.sku = sku.toUpperCase();
    if (category !== undefined) updateData.category = category;
    if (unit) updateData.unit = unit;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting product'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};

