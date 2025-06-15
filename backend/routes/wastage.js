const express = require('express');
const router = express.Router();
const controller = require('../controllers/wastage.controller');

router.post('/', controller.createWastage);
router.get('/', controller.getAllWastage);
router.put('/:id', controller.updateWastage);
router.delete('/:id', controller.deleteWastage);

module.exports = router;
