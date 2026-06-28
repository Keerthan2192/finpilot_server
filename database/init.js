const sequelize = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const AiReport = require('../models/AiReport');
const seedData = require('./seed');

const initDatabase = async () => {
  try {
    // Define associations
    User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Category.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(Income, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Income.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Expense.belongsTo(User, { foreignKey: 'userId' });
    Category.hasMany(Expense, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
    Expense.belongsTo(Category, { foreignKey: 'categoryId' });

    User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Budget.belongsTo(User, { foreignKey: 'userId' });
    Category.hasMany(Budget, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
    Budget.belongsTo(Category, { foreignKey: 'categoryId' });

    User.hasMany(AiReport, { foreignKey: 'userId', onDelete: 'CASCADE' });
    AiReport.belongsTo(User, { foreignKey: 'userId' });

    // Sync tables WITHOUT dropping existing data.
    // `sync()` creates missing tables; it does NOT drop or alter existing ones.
    await sequelize.sync();
    console.log('✓ Database tables verified');

    // Only seed if the database is empty (no users exist)
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('📦 First run detected — inserting seed data...');
      await seedData();
    } else {
      console.log(`✓ Found ${userCount} existing user(s) — data preserved`);
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
};

module.exports = initDatabase;
