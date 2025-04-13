const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssignmentSubmission = sequelize.define('AssignmentSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('not_submitted', 'submitted', 'graded'),
    allowNull: false,
    defaultValue: 'not_submitted'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = AssignmentSubmission;