const AiReport = require('../models/AiReport');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const dayjs = require('dayjs');

exports.getAiAdvice = async (req, res) => {
  try {
    const currentMonth = dayjs().format('YYYY-MM');
    const userId = req.userId;

    // Gather financial data
    const monthlyIncome = await Income.sum('amount', { where: { userId, month: currentMonth } }) || 0;
    const monthlyExpense = await Expense.sum('amount', { where: { userId, month: currentMonth } }) || 0;

    const totalIncome = await Income.sum('amount', { where: { userId } }) || 0;
    const totalExpense = await Expense.sum('amount', { where: { userId } }) || 0;

    // Last 3 months data
    const last3Months = [];
    for (let i = 2; i >= 0; i--) {
      last3Months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
    }

    const monthlyData = await Promise.all(
      last3Months.map(async (month) => {
        const inc = await Income.sum('amount', { where: { userId, month } }) || 0;
        const exp = await Expense.sum('amount', { where: { userId, month } }) || 0;
        return { month, income: inc, expense: exp, savings: inc - exp };
      })
    );

    // Category breakdown - use raw query
    const db = require('../config/database');
    const [categoryExpenses] = await db.query(`
      SELECT e.category_id as categoryId, SUM(e.amount) as total,
             c.name, c.icon
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ? AND e.month = ?
      GROUP BY e.category_id
      ORDER BY total DESC
    `, { replacements: [userId, currentMonth] });

    const budgets = await Budget.findAll({
      where: { userId, month: currentMonth },
      include: [{ model: Category, attributes: ['name'] }],
    });

    // Income sources
    const incomeSources = await Income.findAll({
      where: { userId },
      attributes: [
        'source',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
      ],
      group: ['source'],
      order: [[require('sequelize').literal('total'), 'DESC']],
    });

    // Build AI prompt data
    const categoriesData = categoryExpenses.map((ce) => ({
      category: ce.name || 'Unknown',
      amount: parseFloat(ce.total),
      percentage: monthlyExpense > 0 ? Math.round((parseFloat(ce.total) / monthlyExpense) * 100) : 0,
    }));

    const budgetsData = budgets.map((b) => ({
      category: b.Category?.name || 'Unknown',
      budgeted: parseFloat(b.amount),
      spent: categoryExpenses.find((ce) => parseInt(ce.categoryId) === b.categoryId)
        ? parseFloat(categoryExpenses.find((ce) => parseInt(ce.categoryId) === b.categoryId).total)
        : 0,
    }));

    const prompt = `You are an expert personal finance advisor. Analyze this financial data and provide personalized advice.

Current Month: ${currentMonth}
Monthly Income: ₹${monthlyIncome}
Monthly Expenses: ₹${monthlyExpense}
Monthly Savings: ₹${monthlyIncome - monthlyExpense}
Total Income (All Time): ₹${totalIncome}
Total Expenses (All Time): ₹${totalExpense}

Income Sources:
${incomeSources.map((is) => `- ${is.source}: ₹${parseFloat(is.getDataValue('total')).toFixed(2)}`).join('\n')}

Category Breakdown:
${categoriesData.map((cd) => `- ${cd.category}: ₹${cd.amount.toFixed(2)} (${cd.percentage}%)`).join('\n')}

Budget Performance:
${budgetsData.map((bd) => `- ${bd.category}: Budgeted ₹${bd.budgeted.toFixed(2)}, Spent ₹${bd.spent.toFixed(2)}`).join('\n')}

Monthly Trend (Last 3 Months):
${monthlyData.map((md) => `- ${md.month}: Income ₹${md.income}, Expenses ₹${md.expense}, Savings ₹${md.savings}`).join('\n')}

Provide the response in this exact JSON format (no markdown, no code blocks):
{
  "financialHealthScore": number 0-100,
  "summary": "2-3 sentence spending summary",
  "biggestCategories": ["category1", "category2"],
  "savingsOpportunities": ["opportunity1", "opportunity2"],
  "budgetSuggestions": ["suggestion1", "suggestion2"],
  "expenseReductionTips": ["tip1", "tip2"],
  "incomeIdeas": ["idea1", "idea2"],
  "monthlyActionPlan": ["action1", "action2"],
  "investmentSuggestions": ["suggestion1", "suggestion2"],
  "personalizedAdvice": "2-3 sentence personalized advice",
  "riskLevel": "low|medium|high"
}`;

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'sk-or-v1-demo'}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'FinPilot AI',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial AI assistant. Return ONLY valid JSON without markdown formatting.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    let aiData;
    if (openRouterResponse.ok) {
      const aiResponse = await openRouterResponse.json();
      const content = aiResponse.choices?.[0]?.message?.content || '';
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiData = JSON.parse(cleaned);
      } catch {
        aiData = {
          financialHealthScore: 70,
          summary: `Your monthly income is $${monthlyIncome} and expenses are $${monthlyExpense}.`,
          biggestCategories: categoriesData.slice(0, 3).map((c) => c.category),
          savingsOpportunities: ['Consider reducing dining out', 'Review subscription services'],
          budgetSuggestions: ['Set a 50/30/20 budget rule', 'Track daily expenses'],
          expenseReductionTips: ['Cook at home more often', 'Use public transportation'],
          incomeIdeas: ['Start a side hustle', 'Invest in skill development'],
          monthlyActionPlan: ['Review expenses weekly', 'Save 20% of income first'],
          investmentSuggestions: ['Start an emergency fund', 'Consider index funds'],
          personalizedAdvice: 'Keep tracking your expenses and aim to save at least 20% of your income.',
          riskLevel: 'medium',
        };
      }
    } else {
      aiData = {
        financialHealthScore: 70,
        summary: `Your monthly income is $${monthlyIncome} and expenses are $${monthlyExpense}. You're saving $${monthlyIncome - monthlyExpense} this month.`,
        biggestCategories: categoriesData.slice(0, 3).map((c) => c.category),
        savingsOpportunities: ['Consider reducing dining out', 'Review subscription services'],
        budgetSuggestions: ['Set a 50/30/20 budget rule', 'Track daily expenses with FinPilot'],
        expenseReductionTips: ['Cook at home more often', 'Use public transportation'],
        incomeIdeas: ['Start a side hustle', 'Invest in skill development'],
        monthlyActionPlan: ['Review expenses weekly', 'Save 20% of income first'],
        investmentSuggestions: ['Start an emergency fund', 'Consider index funds'],
        personalizedAdvice: 'Keep tracking your expenses and aim to save at least 20% of your income.',
        riskLevel: 'medium',
      };
    }

    // Determine health score based on data if AI fails
    if (!aiData.financialHealthScore) {
      const savingsRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0;
      aiData.financialHealthScore = Math.min(100, Math.max(0, Math.round(savingsRatio * 100 + 50)));
    }

    const report = await AiReport.create({
      userId,
      reportData: aiData,
      summary: aiData.summary,
    });

    res.json({ report, data: aiData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAiReports = async (req, res) => {
  try {
    const reports = await AiReport.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAiReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await AiReport.findOne({ where: { id, userId: req.userId } });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await report.destroy();
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
