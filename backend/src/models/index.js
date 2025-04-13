const User = require('./User');
const Group = require('./Group');
const Subject = require('./Subject');
const Grade = require('./Grade');
const Assignment = require('./Assignment');
const AssignmentSubmission = require('./AssignmentSubmission');
const Lesson = require('./Lesson');
const Attendance = require('./Attendance');
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

// Связь заданий с преподавателями и предметами
Assignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Assignment, { foreignKey: 'teacherId', as: 'assignments' });

Assignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Subject.hasMany(Assignment, { foreignKey: 'subjectId', as: 'assignments' });

// Связь групп с заданиями (многие ко многим)
const GroupAssignment = sequelize.define('GroupAssignment', {}, { timestamps: false });
Assignment.belongsToMany(Group, { through: GroupAssignment, as: 'groups', foreignKey: 'assignmentId' });
Group.belongsToMany(Assignment, { through: GroupAssignment, as: 'assignments', foreignKey: 'groupId' });

// Связь ответов на задания со студентами и заданиями
AssignmentSubmission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(AssignmentSubmission, { foreignKey: 'studentId', as: 'submissions' });

AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignmentId', as: 'submissions' });

// Связь занятий с преподавателями, предметами и группами
Lesson.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Lesson, { foreignKey: 'teacherId', as: 'lessons' });

Lesson.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Subject.hasMany(Lesson, { foreignKey: 'subjectId', as: 'lessons' });

Lesson.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Lesson, { foreignKey: 'groupId', as: 'lessons' });

// Связь посещаемости со студентами и занятиями
Attendance.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });

Attendance.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Lesson.hasMany(Attendance, { foreignKey: 'lessonId', as: 'attendances' });

module.exports = {
  User,
  Group,
  Subject,
  Grade,
  Assignment,
  AssignmentSubmission,
  Lesson,
  Attendance,
  TeacherSubject,
  GroupAssignment,
  sequelize
};