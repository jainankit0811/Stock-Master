const express = require('express');
const { getLedgerEntries, getLedgerEntry } = require('../controllers/ledger.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/', getLedgerEntries);
router.get('/:id', getLedgerEntry);

module.exports = router;

