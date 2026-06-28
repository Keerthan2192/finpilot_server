const { Op } = require('sequelize');
const Income = require('../models/Income');
const dayjs = require('dayjs');

exports.getIncome = async (req, res) => {
  try {
    const { month, search, sortBy = 'date', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;
    const where = { userId: req.userId };

    if (month) where.month = month;
    if (search) {
      where[Op.or] = [
        { source: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Income.findAndCountAll({
      where,
      order: sortBy === 'date' ? [['date', sortOrder], ['id', 'DESC']] : [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const summary = await Income.findAll({
      where: { userId: req.userId, month: month || dayjs().format('YYYY-MM') },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('MAX', require('sequelize').col('amount')), 'highest'],
        [require('sequelize').fn('MIN', require('sequelize').col('amount')), 'lowest'],
        [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'average'],
      ],
      raw: true,
    });

    const months = await Income.findAll({
      where: { userId: req.userId },
      attributes: ['month'],
      group: ['month'],
      order: [['month', 'DESC']],
      raw: true,
    });

    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      summary: summary[0],
      months: months.map((m) => m.month),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createIncome = async (req, res) => {
  try {
    const { source, amount, date, description } = req.body;
    const month = dayjs(date).format('YYYY-MM');

    const income = await Income.create({
      userId: req.userId,
      source,
      amount,
      date,
      month,
      description,
    });

    res.status(201).json({ message: 'Income added', income });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findOne({ where: { id, userId: req.userId } });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    const { source, amount, date, description } = req.body;
    const month = date ? dayjs(date).format('YYYY-MM') : income.month;

    await income.update({ source, amount, date, month, description });
    res.json({ message: 'Income updated', income });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findOne({ where: { id, userId: req.userId } });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    await income.destroy();
    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
