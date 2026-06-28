const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ income: [], expenses: [], categories: [] });
    }

    const searchTerm = `%${q}%`;

    const [income, expenses, categories] = await Promise.all([
      Income.findAll({
        where: {
          userId: req.userId,
          [Op.or]: [
            { source: { [Op.like]: searchTerm } },
            { description: { [Op.like]: searchTerm } },
          ],
        },
        limit: 5,
        order: [['date', 'DESC']],
      }),
      Expense.findAll({
        where: {
          userId: req.userId,
          [Op.or]: [
            { name: { [Op.like]: searchTerm } },
            { notes: { [Op.like]: searchTerm } },
          ],
        },
        include: [{ model: Category, attributes: ['name', 'color'] }],
        limit: 5,
        order: [['date', 'DESC']],
      }),
      Category.findAll({
        where: {
          userId: req.userId,
          name: { [Op.like]: searchTerm },
        },
        limit: 5,
      }),
    ]);

    res.json({ income, expenses, categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
