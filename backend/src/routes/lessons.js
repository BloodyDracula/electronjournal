const express = require('express');
const router = express.Router();
const { Lesson, User, Subject, Group, Attendance } = require('../models');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Получение всех занятий (для админа и преподавателей)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let lessons;
    
    // Для студентов показываем только занятия их группы
    if (req.user.role === 'student') {
      // Получаем информацию о студенте с его группой
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group) {
        return res.status(403).json({ message: 'У вас нет доступа к занятиям' });
      }
      
      // Получаем занятия для группы студента
      lessons = await Lesson.findAll({
        where: { groupId: student.group.id },
        include: [
          { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
          { model: Subject, as: 'subject', attributes: ['id', 'name'] },
          { model: Group, as: 'group', attributes: ['id', 'name'] }
        ],
        order: [['date', 'DESC'], ['startTime', 'DESC']]
      });
    } else {
      // Для преподавателей показываем их занятия, для админа - все
      const whereClause = req.user.role === 'teacher' ? { teacherId: req.user.id } : {};
      
      lessons = await Lesson.findAll({
        where: whereClause,
        include: [
          { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
          { model: Subject, as: 'subject', attributes: ['id', 'name'] },
          { model: Group, as: 'group', attributes: ['id', 'name'] }
        ],
        order: [['date', 'DESC'], ['startTime', 'DESC']]
      });
    }
    
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ message: 'Ошибка при получении занятий' });
  }
});

// Получение конкретного занятия
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findByPk(id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { 
          model: Attendance, 
          as: 'attendances',
          include: [{ model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }]
        }
      ]
    });
    
    if (!lesson) {
      return res.status(404).json({ message: 'Занятие не найдено' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'student') {
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group || student.group.id !== lesson.groupId) {
        return res.status(403).json({ message: 'У вас нет доступа к этому занятию' });
      }
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ message: 'Ошибка при получении занятия' });
  }
});

// Создание нового занятия (только для преподавателей и админа)
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { title, date, startTime, endTime, description, subjectId, groupId } = req.body;
    
    // Проверка наличия обязательных полей
    if (!title || !date || !startTime || !endTime || !subjectId || !groupId) {
      return res.status(400).json({ message: 'Необходимо заполнить все обязательные поля' });
    }
    
    // Создание занятия
    const lesson = await Lesson.create({
      title,
      date,
      startTime,
      endTime,
      description,
      subjectId,
      groupId,
      teacherId: req.user.id
    });
    
    // Получение полных данных с включением связанных моделей
    const lessonWithDetails = await Lesson.findByPk(lesson.id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'group', attributes: ['id', 'name'] }
      ]
    });
    
    // Автоматическое создание записей о посещаемости для всех студентов группы
    const students = await User.findAll({
      where: { role: 'student', groupId }
    });
    
    // Создаем записи о посещаемости для каждого студента
    const attendancePromises = students.map(student => {
      return Attendance.create({
        lessonId: lesson.id,
        studentId: student.id,
        status: 'absent' // По умолчанию отмечаем отсутствие
      });
    });
    
    await Promise.all(attendancePromises);
    
    res.status(201).json(lessonWithDetails);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ message: 'Ошибка при создании занятия' });
  }
});

// Обновление занятия (только для преподавателя, создавшего занятие, и админа)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, startTime, endTime, description, subjectId, groupId } = req.body;
    
    const lesson = await Lesson.findByPk(id);
    
    if (!lesson) {
      return res.status(404).json({ message: 'Занятие не найдено' });
    }
    
    // Проверка прав доступа: только создатель занятия или админ могут его изменять
    if (req.user.role !== 'admin' && lesson.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет прав на изменение этого занятия' });
    }
    
    // Обновление полей
    if (title) lesson.title = title;
    if (date) lesson.date = date;
    if (startTime) lesson.startTime = startTime;
    if (endTime) lesson.endTime = endTime;
    if (description !== undefined) lesson.description = description;
    if (subjectId) lesson.subjectId = subjectId;
    if (groupId) lesson.groupId = groupId;
    
    await lesson.save();
    
    // Получение обновленных данных с включением связанных моделей
    const updatedLesson = await Lesson.findByPk(id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'group', attributes: ['id', 'name'] }
      ]
    });
    
    res.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ message: 'Ошибка при обновлении занятия' });
  }
});

// Удаление занятия (только для преподавателя, создавшего занятие, и админа)
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findByPk(id);
    
    if (!lesson) {
      return res.status(404).json({ message: 'Занятие не найдено' });
    }
    
    // Проверка прав доступа: только создатель занятия или админ могут его удалять
    if (req.user.role !== 'admin' && lesson.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет прав на удаление этого занятия' });
    }
    
    // Удаление связанных записей о посещаемости
    await Attendance.destroy({ where: { lessonId: id } });
    
    // Удаление занятия
    await lesson.destroy();
    
    res.json({ message: 'Занятие успешно удалено' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ message: 'Ошибка при удалении занятия' });
  }
});

module.exports = router;