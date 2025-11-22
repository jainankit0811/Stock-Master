const LedgerEntry = require('../models/LedgerEntry.model');

/**
 * Get all ledger entries with filters
 * GET /api/ledger
 */
const getLedgerEntries = async (req, res) => {
  try {
    const { productId, warehouseId, documentType, documentId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (productId) query.productId = productId;
    if (warehouseId) query.warehouseId = warehouseId;
    if (documentType) query.documentType = documentType;
    if (documentId) query.documentId = documentId;
    if (userId) query.userId = userId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ledgerEntries = await LedgerEntry.find(query)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LedgerEntry.countDocuments(query);

    res.json({
      success: true,
      count: ledgerEntries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: { ledgerEntries }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching ledger entries'
    });
  }
};

/**
 * Get single ledger entry by ID
 * GET /api/ledger/:id
 */
const getLedgerEntry = async (req, res) => {
  try {
    const ledgerEntry = await LedgerEntry.findById(req.params.id)
      .populate('productId', 'name sku category unit')
      .populate('warehouseId', 'name code address')
      .populate('userId', 'name email role');

    if (!ledgerEntry) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    res.json({
      success: true,
      data: { ledgerEntry }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching ledger entry'
    });
  }
};

module.exports = {
  getLedgerEntries,
  getLedgerEntry
};

