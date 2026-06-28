const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiReport = sequelize.define('AiReport', {
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
  reportData: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'report_data',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ai_reports',
  timestamps: true,
  underscored: true,
});

module.exports = AiReport;
