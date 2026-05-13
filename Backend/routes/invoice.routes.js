const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getInvoice } = require('../controllers/invoice.controller');

router.get('/:orderId', protect, getInvoice);

module.exports = router;
