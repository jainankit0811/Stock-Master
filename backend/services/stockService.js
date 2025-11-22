const mongoose = require('mongoose');
const StockBalance = require('../models/StockBalance.model');
const LedgerEntry = require('../models/LedgerEntry.model');

/**
 * Get or create stock balance for a product-warehouse combination
 */
const getOrCreateBalance = async (productId, warehouseId, session = null) => {
  const options = session ? { session } : {};
  
  let balance = await StockBalance.findOne({ productId, warehouseId }, null, options);
  
  if (!balance) {
    balance = await StockBalance.create([{
      productId,
      warehouseId,
      quantity: 0,
      reservedQty: 0
    }], options);
    balance = balance[0];
  }
  
  return balance;
};

/**
 * Create ledger entry
 */
const createLedgerEntry = async (entryData, session = null) => {
  const options = session ? { session } : {};
  return await LedgerEntry.create([entryData], options);
};

/**
 * Receive stock (increase quantity)
 * Used for Receipts
 */
const receiveStock = async (productId, warehouseId, quantity, userId, documentType, documentId, notes = '', session = null) => {
  const options = session ? { session } : {};
  
  // Get or create balance
  const balance = await getOrCreateBalance(productId, warehouseId, session);
  
  const balanceBefore = balance.quantity;
  const balanceAfter = balanceBefore + quantity;
  
  // Update balance
  balance.quantity = balanceAfter;
  await balance.save(options);
  
  // Create ledger entry
  await createLedgerEntry({
    productId,
    warehouseId,
    documentType,
    documentId,
    quantity: quantity, // Positive for receipt
    balanceBefore,
    balanceAfter,
    userId,
    notes
  }, session);
  
  return { balanceBefore, balanceAfter, balance };
};

/**
 * Deliver stock (decrease quantity)
 * Used for Delivery Orders
 */
const deliverStock = async (productId, warehouseId, quantity, userId, documentType, documentId, notes = '', session = null) => {
  const options = session ? { session } : {};
  
  // Get or create balance
  const balance = await getOrCreateBalance(productId, warehouseId, session);
  
  // Check if sufficient stock
  if (balance.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${balance.quantity}, Requested: ${quantity}`);
  }
  
  const balanceBefore = balance.quantity;
  const balanceAfter = balanceBefore - quantity;
  
  // Update balance
  balance.quantity = balanceAfter;
  await balance.save(options);
  
  // Create ledger entry
  await createLedgerEntry({
    productId,
    warehouseId,
    documentType,
    documentId,
    quantity: -quantity, // Negative for delivery
    balanceBefore,
    balanceAfter,
    userId,
    notes
  }, session);
  
  return { balanceBefore, balanceAfter, balance };
};

/**
 * Transfer stock between warehouses
 * Decreases from source, increases in destination
 */
const transferStock = async (productId, fromWarehouseId, toWarehouseId, quantity, userId, documentType, documentId, notes = '', session = null) => {
  const options = session ? { session } : {};
  
  // Get or create balances
  const fromBalance = await getOrCreateBalance(productId, fromWarehouseId, session);
  
  // Check if sufficient stock in source warehouse
  if (fromBalance.quantity < quantity) {
    throw new Error(`Insufficient stock in source warehouse. Available: ${fromBalance.quantity}, Requested: ${quantity}`);
  }
  
  const toBalance = await getOrCreateBalance(productId, toWarehouseId, session);
  
  // Update source warehouse (decrease)
  const fromBalanceBefore = fromBalance.quantity;
  const fromBalanceAfter = fromBalanceBefore - quantity;
  fromBalance.quantity = fromBalanceAfter;
  await fromBalance.save(options);
  
  // Update destination warehouse (increase)
  const toBalanceBefore = toBalance.quantity;
  const toBalanceAfter = toBalanceBefore + quantity;
  toBalance.quantity = toBalanceAfter;
  await toBalance.save(options);
  
  // Create ledger entries for both warehouses
  await createLedgerEntry({
    productId,
    warehouseId: fromWarehouseId,
    documentType,
    documentId,
    quantity: -quantity, // Negative for source
    balanceBefore: fromBalanceBefore,
    balanceAfter: fromBalanceAfter,
    userId,
    notes: `Transfer out: ${notes}`
  }, session);
  
  await createLedgerEntry({
    productId,
    warehouseId: toWarehouseId,
    documentType,
    documentId,
    quantity: quantity, // Positive for destination
    balanceBefore: toBalanceBefore,
    balanceAfter: toBalanceAfter,
    userId,
    notes: `Transfer in: ${notes}`
  }, session);
  
  return {
    from: { balanceBefore: fromBalanceBefore, balanceAfter: fromBalanceAfter },
    to: { balanceBefore: toBalanceBefore, balanceAfter: toBalanceAfter }
  };
};

/**
 * Adjust stock (can be positive or negative)
 * Used for Stock Adjustments
 */
const adjustStock = async (productId, warehouseId, quantity, userId, documentType, documentId, notes = '', session = null) => {
  const options = session ? { session } : {};
  
  // Get or create balance
  const balance = await getOrCreateBalance(productId, warehouseId, session);
  
  const balanceBefore = balance.quantity;
  const balanceAfter = balanceBefore + quantity; // quantity can be positive or negative
  
  // Check if adjustment would result in negative stock
  if (balanceAfter < 0) {
    throw new Error(`Adjustment would result in negative stock. Current: ${balanceBefore}, Adjustment: ${quantity}`);
  }
  
  // Update balance
  balance.quantity = balanceAfter;
  await balance.save(options);
  
  // Create ledger entry
  await createLedgerEntry({
    productId,
    warehouseId,
    documentType,
    documentId,
    quantity: quantity, // Can be positive or negative
    balanceBefore,
    balanceAfter,
    userId,
    notes
  }, session);
  
  return { balanceBefore, balanceAfter, balance };
};

module.exports = {
  receiveStock,
  deliverStock,
  transferStock,
  adjustStock,
  getOrCreateBalance
};

