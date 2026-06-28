const sequelize = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const AiReport = require('../models/AiReport');
const dayjs = require('dayjs');

const seedData = async () => {
  try {
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@finpilot.ai',
      password: 'Demo@123',
      currency: 'INR',
      monthlyIncomeGoal: 8000,
      savingsGoal: 50000,
    });

    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: 'FiShoppingBag', description: 'Restaurants, groceries, food delivery', isDefault: true },
      { name: 'Transportation', color: '#4ECDC4', icon: 'FiTruck', description: 'Fuel, public transport, parking', isDefault: true },
      { name: 'Shopping', color: '#FFD93D', icon: 'FiShoppingCart', description: 'Online and retail shopping', isDefault: true },
      { name: 'Healthcare', color: '#FF8A5C', icon: 'FiHeart', description: 'Medical bills, insurance, pharmacy', isDefault: true },
      { name: 'Education', color: '#A8E6CF', icon: 'FiBook', description: 'Courses, books, training', isDefault: true },
      { name: 'Entertainment', color: '#DDA0DD', icon: 'FiFilm', description: 'Movies, games, streaming, events', isDefault: true },
      { name: 'Bills & Utilities', color: '#87CEEB', icon: 'FiFileText', description: 'Electricity, water, internet, phone', isDefault: true },
      { name: 'Rent', color: '#98D8C8', icon: 'FiHome', description: 'Monthly rent or mortgage', isDefault: true },
      { name: 'Investment', color: '#B8A9C9', icon: 'FiTrendingUp', description: 'Stocks, mutual funds, crypto', isDefault: true },
      { name: 'Travel', color: '#F7DC6F', icon: 'FiMapPin', description: 'Flights, hotels, vacation', isDefault: true },
    ];

    const categories = await Category.bulkCreate(
      defaultCategories.map((cat) => ({ ...cat, userId: user.id }))
    );

    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
    }

    const incomeEntries = [];
    months.forEach((month, idx) => {
      const baseSalary = 6000 + Math.floor(Math.random() * 2000);
      const freelancing = Math.floor(Math.random() * 1500);
      const investments = Math.floor(Math.random() * 800);
      const date = dayjs(month + '-15').format('YYYY-MM-DD');

      incomeEntries.push({
        userId: user.id,
        source: 'Salary',
        amount: baseSalary,
        date,
        month,
        description: 'Monthly salary',
      });
      incomeEntries.push({
        userId: user.id,
        source: 'Freelancing',
        amount: freelancing,
        date: dayjs(month + '-20').format('YYYY-MM-DD'),
        month,
        description: 'Freelance projects',
      });
      incomeEntries.push({
        userId: user.id,
        source: 'Investments',
        amount: investments,
        date: dayjs(month + '-25').format('YYYY-MM-DD'),
        month,
        description: 'Investment returns',
      });
    });

    await Income.bulkCreate(incomeEntries);

    const expenseEntries = [];
    const expenseTemplates = [
      { categoryId: categories[0].id, name: 'Grocery Store', amount: 200, note: 'Weekly groceries' },
      { categoryId: categories[0].id, name: 'Restaurant Dinner', amount: 80, note: 'Dinner with friends' },
      { categoryId: categories[0].id, name: 'Coffee Shop', amount: 15, note: 'Coffee & pastry' },
      { categoryId: categories[1].id, name: 'Fuel', amount: 120, note: 'Car fuel' },
      { categoryId: categories[1].id, name: 'Uber Ride', amount: 25, note: 'Office commute' },
      { categoryId: categories[2].id, name: 'Amazon Purchase', amount: 150, note: 'Online shopping' },
      { categoryId: categories[2].id, name: 'Clothing', amount: 200, note: 'New clothes' },
      { categoryId: categories[3].id, name: 'Pharmacy', amount: 45, note: 'Medicine' },
      { categoryId: categories[3].id, name: 'Doctor Visit', amount: 150, note: 'General checkup' },
      { categoryId: categories[4].id, name: 'Online Course', amount: 99, note: 'New course' },
      { categoryId: categories[5].id, name: 'Netflix', amount: 16, note: 'Monthly subscription' },
      { categoryId: categories[5].id, name: 'Movie Tickets', amount: 30, note: 'Weekend movie' },
      { categoryId: categories[6].id, name: 'Electricity Bill', amount: 90, note: 'Monthly bill' },
      { categoryId: categories[6].id, name: 'Internet', amount: 60, note: 'Monthly bill' },
      { categoryId: categories[6].id, name: 'Phone Bill', amount: 45, note: 'Monthly plan' },
      { categoryId: categories[7].id, name: 'Monthly Rent', amount: 1500, note: 'Apartment rent' },
      { categoryId: categories[8].id, name: 'Stock Purchase', amount: 500, note: 'Monthly investment' },
    ];

    months.forEach((month) => {
      expenseTemplates.forEach((tmpl, idx) => {
        const day = Math.floor(Math.random() * 25) + 1;
        const variability = 0.7 + Math.random() * 0.6;
        expenseEntries.push({
          userId: user.id,
          categoryId: tmpl.categoryId,
          name: tmpl.name,
          amount: Math.round(tmpl.amount * variability * 100) / 100,
          date: dayjs(`${month}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD'),
          month,
          paymentMethod: ['Credit Card', 'Debit Card', 'Cash', 'UPI'][Math.floor(Math.random() * 4)],
          notes: tmpl.note,
        });
      });
    });

    await Expense.bulkCreate(expenseEntries);

    const budgetEntries = months.slice(0, 2).flatMap((month) =>
      categories.map((cat) => ({
        userId: user.id,
        categoryId: cat.id,
        month,
        amount: [1500, 300, 400, 200, 150, 150, 250, 1600, 600, 300][categories.indexOf(cat)],
        notes: `Monthly budget for ${cat.name}`,
      }))
    );

    await Budget.bulkCreate(budgetEntries);

    console.log('✓ Seed data inserted successfully!');
    console.log('  Login: demo@finpilot.ai / Demo@123');
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

module.exports = seedData;
