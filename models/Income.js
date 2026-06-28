const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Income = sequelize.define('Income', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'income',
});

module.exports = Income;
