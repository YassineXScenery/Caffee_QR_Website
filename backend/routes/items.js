const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemController');

// Define routes for items
router.get('/', itemsController.getItems);
router.get('/basic', itemsController.getItemsBasic);
router.get('/:id', itemsController.getItemById);
router.post('/', itemsController.createItem);
router.put('/:id', itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);

module.exports = router;