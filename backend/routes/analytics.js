const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const adminAuth = require('../middleware/adminAuth');

router.get('/revenue', adminAuth, analyticsController.getRevenue);
router.get('/expenses', adminAuth, analyticsController.getExpenses);
router.get('/net', adminAuth, analyticsController.getNetProfit);
router.get('/popular-items', adminAuth, analyticsController.getPopularItems);

// Advanced analytics endpoints
router.get('/order-trends', adminAuth, analyticsController.getOrderTrends);
router.get('/customer-count', adminAuth, analyticsController.getCustomerCount);
router.get('/revenue-heatmap', adminAuth, analyticsController.getRevenueHeatmap);

module.exports = router;
