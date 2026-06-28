const { Op } = require('sequelize');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const AiReport = require('../models/AiReport');
const dayjs = require('dayjs');

exports.getDashboard = async (req, res) => {
  try {
    const currentMonth = dayjs().format('YYYY-MM');
    const previousMonth = dayjs().subtract(1, 'month').format('YYYY-MM');

    // Current month income & expense
    const monthlyIncome = await Income.sum('amount', {
      where: { userId: req.userId, month: currentMonth },
    }) || 0;

    const monthlyExpense = await Expense.sum('amount', {
      where: { userId: req.userId, month: currentMonth },
    }) || 0;

    // Previous month
    const prevIncome = await Income.sum('amount', {
      where: { userId: req.userId, month: previousMonth },
    }) || 0;

    const prevExpense = await Expense.sum('amount', {
      where: { userId: req.userId, month: previousMonth },
    }) || 0;

    // Budget summary
    const budgets = await Budget.findAll({
      where: { userId: req.userId, month: currentMonth },
    });

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const budgetUsedPercent = totalBudget > 0 ? Math.round((monthlyExpense / totalBudget) * 100) : 0;

    const totalIncome = await Income.sum('amount', { where: { userId: req.userId } }) || 0;
    const totalExpense = await Expense.sum('amount', { where: { userId: req.userId } }) || 0;
    const totalSavings = totalIncome - totalExpense;
    const currentBalance = monthlyIncome - monthlyExpense;

    // Income trend (last 6 months)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      last6Months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
    }

    const incomeTrend = await Promise.all(
      last6Months.map(async (month) => {
        const total = await Income.sum('amount', { where: { userId: req.userId, month } }) || 0;
        return { month, total };
      })
    );

    const expenseTrend = await Promise.all(
      last6Months.map(async (month) => {
        const total = await Expense.sum('amount', { where: { userId: req.userId, month } }) || 0;
        return { month, total };
      })
    );

    // Top spending categories - use raw query to avoid ambiguity
    const sequelize = require('sequelize');
    const [categoryExpenses] = await require('../config/database').query(`
      SELECT e.category_id as categoryId, SUM(e.amount) as total, COUNT(e.id) as count,
             c.name, c.color, c.icon
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ? AND e.month = ?
      GROUP BY e.category_id
      ORDER BY total DESC
      LIMIT 5
    `, { replacements: [req.userId, currentMonth] });

    // Latest transactions
    const [latestExpenses] = await require('../config/database').query(`
      SELECT e.id, e.name, e.amount, e.date, e.category_id, e.payment_method, e.notes,
             c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ?
      ORDER BY e.date DESC
      LIMIT 5
    `, { replacements: [req.userId] });

    const latestIncome = await Income.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC']],
      limit: 3,
    });

    // Recent AI suggestions
    const recentAiReports = await AiReport.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 3,
    });

    // Monthly comparison
    const monthlyComparison = await Promise.all(
      last6Months.map(async (month) => {
        const inc = await Income.sum('amount', { where: { userId: req.userId, month } }) || 0;
        const exp = await Expense.sum('amount', { where: { userId: req.userId, month } }) || 0;
        return { month, income: inc, expense: exp, savings: inc - exp };
      })
    );

    res.json({
      currentBalance,
      monthlyIncome,
      monthlyExpense,
      savings: currentBalance,
      totalSavings,
      budgetUsedPercent,
      budgetRemaining: Math.max(totalBudget - monthlyExpense, 0),
      totalBudget,
      incomeTrend,
      expenseTrend,
      topCategories: categoryExpenses,
      latestTransactions: [...latestExpenses.slice(0, 3), ...latestIncome.slice(0, 2)]
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      recentAiReports,
      monthlyComparison,
      prevIncome,
      prevExpense,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
