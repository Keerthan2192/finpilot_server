const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], authController.login);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
  validate,
], authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], authController.resetPassword);

router.get('/profile', auth, authController.getProfile);
router.put('/update-profile', auth, authController.updateProfile);
router.delete('/delete-account', auth, authController.deleteAccount);

module.exports = router;
