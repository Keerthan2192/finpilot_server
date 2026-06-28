const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(auth);

router.get('/', budgetController.getBudgets);

router.post('/', [
  body('month').notEmpty().withMessage('Month is required'),
  body('categoryId').isInt().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  validate,
], budgetController.createBudget);

router.post('/copy', budgetController.copyBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
