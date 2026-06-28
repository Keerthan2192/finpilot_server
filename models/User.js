const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  monthlyIncomeGoal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'monthly_income_goal',
  },
  savingsGoal: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'savings_goal',
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'profile_picture',
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'light',
  },
  resetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'reset_token',
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_token_expiry',
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
