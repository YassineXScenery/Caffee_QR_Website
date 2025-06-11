const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');
const adminAuth = require('../middleware/adminAuth');

router.post('/', adminAuth, expensesController.addExpense);
router.get('/', adminAuth, expensesController.getExpenses);
router.put('/:id', adminAuth, expensesController.updateExpense);
router.delete('/:id', adminAuth, expensesController.deleteExpense);

module.exports = router;
