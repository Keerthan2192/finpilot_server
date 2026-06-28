const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const dayjs = require('dayjs');

exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const currentMonth = dayjs().format('YYYY-MM');

    // Income vs Expense data
    const months = [];
    const count = period === 'yearly' ? 12 : period === 'weekly' ? 4 : 6;
    for (let i = count - 1; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
    }

    const incomeVsExpense = await Promise.all(
      months.map(async (month) => {
        const income = await Income.sum('amount', { where: { userId: req.userId, month } }) || 0;
        const expense = await Expense.sum('amount', { where: { userId: req.userId, month } }) || 0;
        return { month, income, expense };
      })
    );

    // Category wise spending - use raw query
    const db = require('../config/database');
    const [categorySpending] = await db.query(`
      SELECT e.category_id as categoryId, SUM(e.amount) as total, COUNT(e.id) as count,
             c.name, c.color, c.icon
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ? AND e.month = ?
      GROUP BY e.category_id
      ORDER BY total DESC
    `, { replacements: [req.userId, currentMonth] });

    // Savings trend
    const savingsTrend = await Promise.all(
      months.map(async (month) => {
        const income = await Income.sum('amount', { where: { userId: req.userId, month } }) || 0;
        const expense = await Expense.sum('amount', { where: { userId: req.userId, month } }) || 0;
        return { month, savings: income - expense };
      })
    );

    // Budget utilization
    const budgets = await Budget.findAll({
      where: { userId: req.userId, month: currentMonth },
    });

    const budgetUtilization = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.sum('amount', {
          where: { userId: req.userId, categoryId: budget.categoryId, month: currentMonth },
        }) || 0;
        const percentage = budget.amount > 0 ? Math.round((spent / parseFloat(budget.amount)) * 100) : 0;
        return {
          categoryId: budget.categoryId,
          budgeted: parseFloat(budget.amount),
          spent,
          percentage,
        };
      })
    );

    // Expense frequency (daily averages)
    const dailyExpenses = await Expense.findAll({
      where: {
        userId: req.userId,
        month: currentMonth,
      },
      attributes: [
        'date',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
      ],
      group: ['date'],
      order: [['date', 'ASC']],
    });

    // Insights
    const allIncome = await Income.sum('amount', { where: { userId: req.userId } }) || 0;
    const allExpense = await Expense.sum('amount', { where: { userId: req.userId } }) || 0;
    const totalMonths = months.length;
    const avgMonthlyExpense = totalMonths > 0 ? allExpense / totalMonths : 0;
    const avgMonthlyIncome = totalMonths > 0 ? allIncome / totalMonths : 0;

    // Find best/worst months
    let bestMonth = '', worstMonth = '', highestSaving = -Infinity, lowestSaving = Infinity;
    let highestSpending = 0, highestSpendingMonth = '', lowestSpending = Infinity, lowestSpendingMonth = '';

    incomeVsExpense.forEach(({ month, income, expense }) => {
      const saving = income - expense;
      if (saving > highestSaving) { highestSaving = saving; bestMonth = month; }
      if (saving < lowestSaving) { lowestSaving = saving; worstMonth = month; }
      if (expense > highestSpending) { highestSpending = expense; highestSpendingMonth = month; }
      if (expense < lowestSpending) { lowestSpending = expense; lowestSpendingMonth = month; }
    });

    res.json({
      incomeVsExpense,
      categorySpending,
      savingsTrend,
      budgetUtilization,
      dailyExpenses,
      insights: {
        bestMonth,
        worstMonth,
        highestSpendingMonth,
        highestSpending,
        lowestSpendingMonth,
        lowestSpending,
        highestSaving,
        lowestSaving,
        avgMonthlyExpense: Math.round(avgMonthlyExpense * 100) / 100,
        avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
        totalIncome: allIncome,
        totalExpense: allExpense,
        totalSavings: allIncome - allExpense,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
