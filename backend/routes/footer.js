const express = require('express');
const router = express.Router();
const footerController = require('../controllers/footerController');
const adminController = require('../controllers/adminController');

// Get footer settings (public route)
router.get('/', footerController.getFooterSettings);

// Update footer settings (protected route)
router.put('/', adminController.verifyToken, footerController.updateFooterSettings);

module.exports = router;
