const express = require('express');
const { User, Group, Subject } = require('../models');
const { authenticateToken, checkRole } = require('./auth');

const router = express.Router();

// Получение всех пользователей (только для админа)
router.get('/', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Group, as: 'group' },
        { model: Subject, as: 'subjects' }
      ]
    });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение пользователей по роли (админ может получить всех, преподаватель - студентов)
router.get('/role/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Проверка прав доступа
    if (req.user.role !== 'admin' && 
        (role !== 'student' || req.user.role !== 'teacher')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
      include: [
        { model: Group, as: 'group' },
        { model: Subject, as: 'subjects' }
      ]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение конкретного пользователя
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка прав доступа (админ может получить любого, пользователь - только себя)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Group, as: 'group' },
        { model: Subject, as: 'subjects' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание нового пользователя (только для админа)
router.post('/', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { login, password, firstName, lastName, middleName, role, groupId, subjectIds } = req.body;
    
    // Проверка обязательных полей
    if (!login || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }
    
    // Проверка роли
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }
    
    // Проверка группы для студента
    if (role === 'student' && !groupId) {
      return res.status(400).json({ message: 'Для студента необходимо указать группу' });
    }
    
    // Создание пользователя
    const user = await User.create({
      login,
      password,
      firstName,
      lastName,
      middleName,
      role,
      groupId: role === 'student' ? groupId : null
    });
    
    // Добавление предметов для преподавателя
    if (role === 'teacher' && subjectIds && subjectIds.length > 0) {
      const subjects = await Subject.findAll({
        where: { id: subjectIds }
      });
      await user.setSubjects(subjects);
    }
    
    // Получение созданного пользователя с связанными данными
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Group, as: 'group' },
        { model: Subject, as: 'subjects' }
      ]
    });
    
    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление пользователя (админ может обновить любого, пользователь - только себя)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, middleName, password, groupId, subjectIds } = req.body;
    
    // Проверка прав доступа
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Получение пользователя
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Обновление данных пользователя
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (middleName !== undefined) user.middleName = middleName;
    if (password) user.password = password;
    
    // Обновление группы для студента (только админ может менять)
    if (req.user.role === 'admin' && user.role === 'student' && groupId) {
      user.groupId = groupId;
    }
    
    await user.save();
    
    // Обновление предметов для преподавателя (только админ может менять)
    if (req.user.role === 'admin' && user.role === 'teacher' && subjectIds) {
      const subjects = await Subject.findAll({
        where: { id: subjectIds }
      });
      await user.setSubjects(subjects);
    }
    
    // Получение обновленного пользователя с связанными данными
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Group, as: 'group' },
        { model: Subject, as: 'subjects' }
      ]
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление пользователя (только для админа)
router.delete('/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    await user.destroy();
    
    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;