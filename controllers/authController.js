const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user.id);

    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: 'FiShoppingBag' },
      { name: 'Transportation', color: '#4ECDC4', icon: 'FiTruck' },
      { name: 'Shopping', color: '#FFD93D', icon: 'FiShoppingCart' },
      { name: 'Healthcare', color: '#FF8A5C', icon: 'FiHeart' },
      { name: 'Education', color: '#A8E6CF', icon: 'FiBook' },
      { name: 'Entertainment', color: '#DDA0DD', icon: 'FiFilm' },
      { name: 'Bills & Utilities', color: '#87CEEB', icon: 'FiFileText' },
      { name: 'Rent', color: '#98D8C8', icon: 'FiHome' },
      { name: 'Investment', color: '#B8A9C9', icon: 'FiTrendingUp' },
      { name: 'Others', color: '#95A5A6', icon: 'FiMoreHorizontal' },
    ];

    const CategoryModel = require('../models/Category');
    await CategoryModel.bulkCreate(defaultCategories.map((cat) => ({ ...cat, userId: user.id, isDefault: true })));

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyIncomeGoal: user.monthlyIncomeGoal,
        savingsGoal: user.savingsGoal,
        profilePicture: user.profilePicture,
        phone: user.phone,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await user.update({ resetToken, resetTokenExpiry });

    res.json({ message: 'Reset token generated', resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [require('sequelize').Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'phone', 'currency', 'monthlyIncomeGoal', 'savingsGoal', 'theme'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.password && req.body.currentPassword) {
      const user = await User.findByPk(req.userId);
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      updates.password = req.body.password;
    }

    await User.update(updates, { where: { id: req.userId } });
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    await user.destroy();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
