const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const adminAuth = require('../middleware/adminAuth');

router.post('/', adminAuth, stockController.addStock);
router.get('/current', adminAuth, stockController.getCurrentStock);
router.get('/low', adminAuth, stockController.getLowStock);
router.put('/:id', adminAuth, stockController.updateStock);
router.delete('/:id', adminAuth, stockController.deleteStock);
router.get('/', adminAuth, stockController.getAllStock);

module.exports = router;