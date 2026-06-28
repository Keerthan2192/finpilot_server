const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(auth);

router.get('/', expenseController.getExpenses);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('date').isDate().withMessage('Valid date is required'),
  body('categoryId').isInt().withMessage('Category is required'),
  validate,
], expenseController.createExpense);

router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
