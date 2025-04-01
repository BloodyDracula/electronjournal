const express = require('express');
const { Group, User } = require('../models');
const { authenticateToken, checkRole } = require('./auth');

const router = express.Router();

// Получение всех групп (админ и преподаватель могут видеть все, студент - только свою)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Если пользователь - студент, возвращаем только его группу
    if (req.user.role === 'student') {
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group) {
        return res.json([]);
      }
      
      return res.json([student.group]);
    }
    
    // Для админа и преподавателя - все группы
    const groups = await Group.findAll({
      include: [{
        model: User,
        as: 'students',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    res.json(groups);
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение конкретной группы
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Если пользователь - студент, проверяем, что это его группа
    if (req.user.role === 'student') {
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group || student.group.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    }
    
    const group = await Group.findByPk(id, {
      include: [{
        model: User,
        as: 'students',
        attributes: ['id', 'firstName', 'lastName', 'middleName']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой группы (только для админа)
router.post('/', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название группы обязательно' });
    }
    
    const group = await Group.create({
      name,
      description
    });
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Группа с таким названием уже существует' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление группы (только для админа)
router.put('/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    
    await group.save();
    
    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Группа с таким названием уже существует' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление группы (только для админа)
router.delete('/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    await group.destroy();
    
    res.json({ message: 'Группа успешно удалена' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;