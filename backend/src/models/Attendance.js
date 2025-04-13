const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    allowNull: false,
    defaultValue: 'absent'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Attendance;