const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
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
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#60A5FA',
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'FiFolder',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_default',
  },
}, {
  tableName: 'categories',
});

module.exports = Category;
