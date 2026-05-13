const express = require('express');
const router  = express.Router();
const {
  placeOrder, payForOrder, confirmDispatch, confirmReceipt,
  getMyOrders, getFarmerOrders, getOrderById,
  updateOrderStatus, cancelOrder,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/',                   protect, authorize('buyer'),           placeOrder);
router.post('/:id/pay',            protect, authorize('buyer'),           payForOrder);
router.put('/:id/dispatch',        protect, authorize('farmer'),          confirmDispatch);
router.put('/:id/confirm-receipt', protect, authorize('buyer'),           confirmReceipt);
router.get('/my',                  protect, authorize('buyer'),           getMyOrders);
router.get('/farmer',              protect, authorize('farmer'),          getFarmerOrders);
router.get('/:id',                 protect,                               getOrderById);
router.put('/:id/status',          protect, authorize('admin'),           updateOrderStatus);
router.put('/:id/cancel',          protect, authorize('buyer'),           cancelOrder);

module.exports = router;
