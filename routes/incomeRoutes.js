const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(auth);

router.get('/', incomeController.getIncome);

router.post('/', [
  body('source').trim().notEmpty().withMessage('Source is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('date').isDate().withMessage('Valid date is required'),
  validate,
], incomeController.createIncome);

router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
