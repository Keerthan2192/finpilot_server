const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { Op } = require('sequelize');

exports.getBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    const where = { userId: req.userId };
    if (month) where.month = month;

    const budgets = await Budget.findAll({
      where,
      include: [{ model: Category, attributes: ['name', 'color', 'icon'] }],
      order: [['createdAt', 'DESC']],
    });

    const budgetWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.sum('amount', {
          where: {
            userId: req.userId,
            categoryId: budget.categoryId,
            month: budget.month,
          },
        });

        const usedPercent = spent ? Math.min((spent / parseFloat(budget.amount)) * 100, 100) : 0;

        let status = 'green';
        if (usedPercent >= 100) status = 'red';
        else if (usedPercent >= 80) status = 'yellow';

        return {
          ...budget.toJSON(),
          spent: spent || 0,
          remaining: Math.max(parseFloat(budget.amount) - (spent || 0), 0),
          usedPercent: Math.round(usedPercent * 100) / 100,
          status,
        };
      })
    );

    const months = await Budget.findAll({
      where: { userId: req.userId },
      attributes: ['month'],
      group: ['month'],
      order: [['month', 'DESC']],
      raw: true,
    });

    const totalBudgets = budgetWithUsage.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = budgetWithUsage.reduce((sum, b) => sum + parseFloat(b.spent), 0);

    res.json({
      budgets: budgetWithUsage,
      months: months.map((m) => m.month),
      summary: {
        totalBudget: totalBudgets,
        totalSpent,
        totalRemaining: Math.max(totalBudgets - totalSpent, 0),
        overallUsedPercent: totalBudgets > 0 ? Math.round((totalSpent / totalBudgets) * 10000) / 100 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const { month, categoryId, amount, notes } = req.body;

    const existing = await Budget.findOne({
      where: { userId: req.userId, month, categoryId },
    });

    if (existing) {
      return res.status(400).json({ message: 'Budget already exists for this category and month' });
    }

    const category = await Category.findOne({ where: { id: categoryId, userId: req.userId } });
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const budget = await Budget.create({ userId: req.userId, month, categoryId, amount, notes });
    res.status(201).json({ message: 'Budget created', budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOne({ where: { id, userId: req.userId } });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { month, categoryId, amount, notes } = req.body;
    await budget.update({ month, categoryId, amount, notes });

    res.json({ message: 'Budget updated', budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOne({ where: { id, userId: req.userId } });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await budget.destroy();
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.copyBudget = async (req, res) => {
  try {
    const { sourceMonth, targetMonth } = req.body;
    const userId = req.userId;

    if (!sourceMonth || !targetMonth) {
      return res.status(400).json({ message: 'Source and target months are required' });
    }

    if (sourceMonth === targetMonth) {
      return res.status(400).json({ message: 'Source and target months must be different' });
    }

    // Verify source budgets exist
    const sourceBudgets = await Budget.findAll({
      where: { userId, month: sourceMonth },
    });

    if (!sourceBudgets || sourceBudgets.length === 0) {
      return res.status(400).json({ message: 'No budgets found for the selected source month' });
    }

    // Verify target doesn't already have budgets
    const existingTarget = await Budget.findOne({
      where: { userId, month: targetMonth },
    });

    if (existingTarget) {
      return res.status(400).json({ message: 'Target month already has budgets. Delete them first or choose another month.' });
    }

    // Copy each budget
    const newBudgets = sourceBudgets.map((b) => ({
      userId,
      categoryId: b.categoryId,
      month: targetMonth,
      amount: b.amount,
      notes: b.notes ? `${b.notes} (copied from ${sourceMonth})` : `Copied from ${sourceMonth}`,
    }));

    await Budget.bulkCreate(newBudgets);

    res.json({ success: true, message: 'Budget copied successfully.', count: newBudgets.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
