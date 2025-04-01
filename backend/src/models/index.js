const User = require('./User');
const Group = require('./Group');
const Subject = require('./Subject');
const Grade = require('./Grade');
const sequelize = require('../config/database');

// Связь студента с группой (многие студенты к одной группе)
User.belongsTo(Group, { foreignKey: 'groupId', as: 'group', constraints: false });
Group.hasMany(User, { foreignKey: 'groupId', as: 'students', constraints: false });

// Связь преподавателя с предметами (многие ко многим)
const TeacherSubject = sequelize.define('TeacherSubject', {}, { timestamps: false });
User.belongsToMany(Subject, { through: TeacherSubject, as: 'subjects', foreignKey: 'teacherId' });
Subject.belongsToMany(User, { through: TeacherSubject, as: 'teachers', foreignKey: 'subjectId' });

// Связь оценок со студентами, предметами и преподавателями
Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });

Grade.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Subject.hasMany(Grade, { foreignKey: 'subjectId', as: 'grades' });

Grade.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Grade, { foreignKey: 'teacherId', as: 'givenGrades' });

module.exports = {
  User,
  Group,
  Subject,
  Grade,
  TeacherSubject,
  sequelize
};