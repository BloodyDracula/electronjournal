const express = require('express');
const router = express.Router();
const { Attendance, User, Lesson, Group } = require('../models');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Получение записей о посещаемости для конкретного занятия
router.get('/lesson/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Получаем информацию о занятии
    const lesson = await Lesson.findByPk(lessonId, {
      include: [{ model: Group, as: 'group' }]
    });
    
    if (!lesson) {
      return res.status(404).json({ message: 'Занятие не найдено' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'student') {
      // Студент может видеть только свою посещаемость
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group || student.group.id !== lesson.groupId) {
        return res.status(403).json({ message: 'У вас нет доступа к этим данным' });
      }
      
      // Получаем только запись о посещаемости для этого студента
      const attendance = await Attendance.findOne({
        where: { lessonId, studentId: req.user.id },
        include: [
          { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
          { model: Lesson, as: 'lesson' }
        ]
      });
      
      return res.json([attendance]);
    }
    
    // Для преподавателей и админов
    // Преподаватель может видеть посещаемость только для своих занятий
    if (req.user.role === 'teacher' && lesson.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет доступа к этим данным' });
    }
    
    // Получаем все записи о посещаемости для данного занятия
    const attendances = await Attendance.findAll({
      where: { lessonId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ]
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ message: 'Ошибка при получении данных о посещаемости' });
  }
});

// Получение записей о посещаемости для конкретного студента
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Проверка прав доступа
    if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ message: 'У вас нет доступа к этим данным' });
    }
    
    // Получаем информацию о студенте
    const student = await User.findByPk(studentId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Студент не найден' });
    }
    
    // Получаем все записи о посещаемости для данного студента
    const attendances = await Attendance.findAll({
      where: { studentId },
      include: [
        { 
          model: Lesson, 
          as: 'lesson',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name'] },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
          ]
        }
      ],
      order: [[{ model: Lesson, as: 'lesson' }, 'date', 'DESC']]
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching student attendances:', error);
    res.status(500).json({ message: 'Ошибка при получении данных о посещаемости студента' });
  }
});

// Обновление статуса посещаемости (только для преподавателей и админа)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    // Проверка корректности статуса
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус посещаемости' });
    }
    
    // Получаем запись о посещаемости
    const attendance = await Attendance.findByPk(id, {
      include: [{ model: Lesson, as: 'lesson' }]
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'Запись о посещаемости не найдена' });
    }
    
    // Проверка прав доступа: только преподаватель, ведущий занятие, или админ могут изменять посещаемость
    if (req.user.role === 'teacher' && attendance.lesson.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет прав на изменение этой записи' });
    }
    
    // Обновление статуса и комментария
    attendance.status = status;
    if (comment !== undefined) attendance.comment = comment;
    
    await attendance.save();
    
    // Получение обновленных данных
    const updatedAttendance = await Attendance.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
        { model: Lesson, as: 'lesson' }
      ]
    });
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Ошибка при обновлении статуса посещаемости' });
  }
});

// Массовое обновление статусов посещаемости для занятия (только для преподавателей и админа)
router.put('/lesson/:lessonId/bulk', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { attendances } = req.body;
    
    if (!Array.isArray(attendances)) {
      return res.status(400).json({ message: 'Некорректный формат данных' });
    }
    
    // Получаем информацию о занятии
    const lesson = await Lesson.findByPk(lessonId);
    
    if (!lesson) {
      return res.status(404).json({ message: 'Занятие не найдено' });
    }
    
    // Проверка прав доступа: только преподаватель, ведущий занятие, или админ могут изменять посещаемость
    if (req.user.role === 'teacher' && lesson.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет прав на изменение этих записей' });
    }
    
    // Обновляем каждую запись о посещаемости
    const updatePromises = attendances.map(async (item) => {
      const { id, status, comment } = item;
      
      // Проверка корректности статуса
      if (!['present', 'absent', 'late'].includes(status)) {
        throw new Error(`Некорректный статус посещаемости для записи ${id}`);
      }
      
      // Получаем запись о посещаемости
      const attendance = await Attendance.findOne({
        where: { id, lessonId }
      });
      
      if (!attendance) {
        throw new Error(`Запись о посещаемости с id ${id} не найдена`);
      }
      
      // Обновление статуса и комментария
      attendance.status = status;
      if (comment !== undefined) attendance.comment = comment;
      
      return attendance.save();
    });
    
    await Promise.all(updatePromises);
    
    // Получаем обновленные данные
    const updatedAttendances = await Attendance.findAll({
      where: { lessonId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ]
    });
    
    res.json(updatedAttendances);
  } catch (error) {
    console.error('Error bulk updating attendances:', error);
    res.status(500).json({ message: error.message || 'Ошибка при массовом обновлении статусов посещаемости' });
  }
});

module.exports = router;