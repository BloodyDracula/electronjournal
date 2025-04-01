const express = require('express');
const router = express.Router();
const { Grade, User, Subject } = require('../models');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Получение всех оценок (только для админа и преподавателей)
router.get('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const grades = await Grade.findAll({
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Ошибка при получении оценок' });
  }
});

// Получение оценок конкретного студента
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Проверка прав доступа: админ, преподаватель или сам студент
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const grades = await Grade.findAll({
      where: { studentId },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({ message: 'Ошибка при получении оценок студента' });
  }
});

// Получение оценок по предмету
router.get('/subject/:subjectId', authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Для студентов показываем только их оценки по предмету
    let whereClause = { subjectId };
    if (req.user.role === 'student') {
      whereClause.studentId = req.user.id;
    }
    
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching subject grades:', error);
    res.status(500).json({ message: 'Ошибка при получении оценок по предмету' });
  }
});

// Создание новой оценки (только для преподавателей)
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { studentId, subjectId, value, comment } = req.body;
    
    // Проверка наличия обязательных полей
    if (!studentId || !subjectId || !value) {
      return res.status(400).json({ message: 'Необходимо указать студента, предмет и оценку' });
    }
    
    // Создание оценки
    const grade = await Grade.create({
      studentId,
      subjectId,
      teacherId: req.user.id,
      value,
      comment,
      date: new Date()
    });
    
    // Получение полных данных с включением связанных моделей
    const gradeWithDetails = await Grade.findByPk(grade.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    
    res.status(201).json(gradeWithDetails);
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({ message: 'Ошибка при создании оценки' });
  }
});

// Обновление оценки (только для преподавателя, который ее поставил)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { value, comment } = req.body;
    
    // Получение оценки
    const grade = await Grade.findByPk(id);
    
    if (!grade) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    
    // Проверка прав доступа: админ или преподаватель, который поставил оценку
    if (req.user.role !== 'admin' && grade.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Обновление оценки
    await grade.update({ value, comment });
    
    // Получение обновленных данных с включением связанных моделей
    const updatedGrade = await Grade.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    
    res.json(updatedGrade);
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ message: 'Ошибка при обновлении оценки' });
  }
});

// Удаление оценки (только для преподавателя, который ее поставил)
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получение оценки
    const grade = await Grade.findByPk(id);
    
    if (!grade) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    
    // Проверка прав доступа: админ или преподаватель, который поставил оценку
    if (req.user.role !== 'admin' && grade.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Удаление оценки
    await grade.destroy();
    
    res.json({ message: 'Оценка успешно удалена' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ message: 'Ошибка при удалении оценки' });
  }
});

module.exports = router;