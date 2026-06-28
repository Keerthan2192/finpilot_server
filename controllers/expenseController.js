const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const dayjs = require('dayjs');

exports.getExpenses = async (req, res) => {
  try {
    const { month, search, categoryId, sortBy = 'date', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;
    const where = { userId: req.userId };

    if (month) where.month = month;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Expense.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name', 'color', 'icon'] }],
      order: sortBy === 'date' ? [['date', sortOrder], ['id', 'DESC']] : [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const targetMonth = month || dayjs().format('YYYY-MM');
    const summary = await Expense.findAll({
      where: { userId: req.userId, month: targetMonth },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('MAX', require('sequelize').col('amount')), 'highest'],
        [require('sequelize').fn('MIN', require('sequelize').col('amount')), 'lowest'],
        [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'average'],
      ],
      raw: true,
    });

    const months = await Expense.findAll({
      where: { userId: req.userId },
      attributes: ['month'],
      group: ['month'],
      order: [['month', 'DESC']],
      raw: true,
    });

    const categories = await Category.findAll({
      where: { userId: req.userId },
      attributes: ['id', 'name'],
      raw: true,
    });

    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      summary: summary[0],
      months: months.map((m) => m.month),
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { name, amount, date, categoryId, paymentMethod, notes } = req.body;

    const category = await Category.findOne({ where: { id: categoryId, userId: req.userId } });
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const month = dayjs(date).format('YYYY-MM');

    const expense = await Expense.create({
      userId: req.userId,
      categoryId,
      name,
      amount,
      date,
      month,
      paymentMethod,
      notes,
    });

    const result = await Expense.findByPk(expense.id, {
      include: [{ model: Category, attributes: ['name', 'color', 'icon'] }],
    });

    res.status(201).json({ message: 'Expense added', expense: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ where: { id, userId: req.userId } });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { name, amount, date, categoryId, paymentMethod, notes } = req.body;
    const month = date ? dayjs(date).format('YYYY-MM') : expense.month;

    await expense.update({ name, amount, date, month, categoryId, paymentMethod, notes });

    const result = await Expense.findByPk(expense.id, {
      include: [{ model: Category, attributes: ['name', 'color', 'icon'] }],
    });

    res.json({ message: 'Expense updated', expense: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ where: { id, userId: req.userId } });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
