const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin management routes (protected by verifyToken)
router.get('/', adminController.verifyToken, adminController.getAllAdmins);
router.post('/', adminController.verifyToken, adminController.addAdmin);
router.put('/:id', adminController.verifyToken, adminController.modifyAdmin);
router.delete('/:id', adminController.verifyToken, adminController.removeAdmin);
router.post('/login', adminController.loginAdmin); // Changed from '/admins/login' to '/login'

module.exports = router;