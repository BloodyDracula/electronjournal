const express = require('express');
const { Subject, User } = require('../models');
const { authenticateToken, checkRole } = require('./auth');

const router = express.Router();

// Получение всех предметов
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: User,
        as: 'teachers',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    res.json(subjects);
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение конкретного предмета
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByPk(id, {
      include: [{
        model: User,
        as: 'teachers',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    if (!subject) {
      return res.status(404).json({ message: 'Предмет не найден' });
    }
    
    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание нового предмета (только для админа)
router.post('/', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, description, teacherIds } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название предмета обязательно' });
    }
    
    const subject = await Subject.create({
      name,
      description
    });
    
    // Добавление преподавателей к предмету
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await User.findAll({
        where: { 
          id: teacherIds,
          role: 'teacher'
        }
      });
      
      await subject.setTeachers(teachers);
    }
    
    // Получение созданного предмета с преподавателями
    const createdSubject = await Subject.findByPk(subject.id, {
      include: [{
        model: User,
        as: 'teachers',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    res.status(201).json(createdSubject);
  } catch (error) {
    console.error('Create subject error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Предмет с таким названием уже существует' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление предмета (только для админа)
router.put('/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, teacherIds } = req.body;
    
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Предмет не найден' });
    }
    
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    
    await subject.save();
    
    // Обновление преподавателей предмета
    if (teacherIds) {
      const teachers = await User.findAll({
        where: { 
          id: teacherIds,
          role: 'teacher'
        }
      });
      
      await subject.setTeachers(teachers);
    }
    
    // Получение обновленного предмета с преподавателями
    const updatedSubject = await Subject.findByPk(id, {
      include: [{
        model: User,
        as: 'teachers',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    res.json(updatedSubject);
  } catch (error) {
    console.error('Update subject error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Предмет с таким названием уже существует' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление предмета (только для админа)
router.delete('/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Предмет не найден' });
    }
    
    await subject.destroy();
    
    res.json({ message: 'Предмет успешно удален' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;