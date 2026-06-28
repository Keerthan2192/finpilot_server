const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const dayjs = require('dayjs');

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;

    let dateFilter;
    if (startDate && endDate) {
      dateFilter = {
        date: { [Op.between]: [startDate, endDate] },
      };
    } else {
      const months = period === 'yearly' ? 12 : period === 'weekly' ? 1 : 1;
      dateFilter = {
        month: {
          [Op.gte]: dayjs().subtract(months, 'month').format('YYYY-MM'),
        },
      };
    }

    const whereClause = { userId: req.userId, ...dateFilter };

    const totalIncome = await Income.sum('amount', { where: whereClause }) || 0;
    const totalExpense = await Expense.sum('amount', { where: whereClause }) || 0;

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [{ model: Category, attributes: ['name', 'color', 'icon'] }],
      order: [['amount', 'DESC']],
    });

    // Top categories
    const categoryTotals = {};
    expenses.forEach((exp) => {
      const catName = exp.Category?.name || 'Unknown';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { total: 0, count: 0, color: exp.Category?.color || '#95A5A6' };
      }
      categoryTotals[catName].total += parseFloat(exp.amount);
      categoryTotals[catName].count += 1;
    });

    const topCategories = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    // Budget performance
    const budgets = await Budget.findAll({
      where: { userId: req.userId, ...dateFilter },
      include: [{ model: Category, attributes: ['name', 'color'] }],
    });

    const budgetPerformance = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.sum('amount', {
          where: {
            userId: req.userId,
            categoryId: budget.categoryId,
            month: budget.month,
          },
        }) || 0;
        return {
          categoryName: budget.Category?.name || 'Unknown',
          budgeted: parseFloat(budget.amount),
          spent,
          remaining: Math.max(parseFloat(budget.amount) - spent, 0),
          percentage: budget.amount > 0 ? Math.round((spent / parseFloat(budget.amount)) * 100) : 0,
        };
      })
    );

    // Income sources
    const incomeSources = await Income.findAll({
      where: whereClause,
      attributes: [
        'source',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      group: ['source'],
      order: [[require('sequelize').literal('total'), 'DESC']],
    });

    const largestExpense = expenses.length > 0 ? expenses[0] : null;
    const highestIncomeSource = incomeSources.length > 0 ? incomeSources[0] : null;

    const expenseCount = expenses.length;
    const avgSpending = expenseCount > 0 ? totalExpense / expenseCount : 0;

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        savings: totalIncome - totalExpense,
        transactionCount: expenseCount,
        avgSpending: Math.round(avgSpending * 100) / 100,
      },
      topCategories,
      budgetPerformance,
      incomeSources,
      largestExpense: largestExpense ? {
        name: largestExpense.name,
        amount: largestExpense.amount,
        category: largestExpense.Category?.name,
        date: largestExpense.date,
      } : null,
      highestIncomeSource: highestIncomeSource ? {
        source: highestIncomeSource.source,
        total: highestIncomeSource.getDataValue('total'),
      } : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
