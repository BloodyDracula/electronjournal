const express = require('express');
const router = express.Router();
const { Assignment, AssignmentSubmission, User, Subject, Group } = require('../models');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Получение всех заданий (для админа и преподавателя)
router.get('/', auth, role(['admin', 'teacher']), async (req, res) => {
  try {
    let assignments;
    
    if (req.user.role === 'admin') {
      // Администратор видит все задания
      assignments = await Assignment.findAll({
        include: [
          { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
          { model: Subject, as: 'subject', attributes: ['id', 'name'] },
          { model: Group, as: 'groups', attributes: ['id', 'name'], through: { attributes: [] } }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Преподаватель видит только свои задания
      assignments = await Assignment.findAll({
        where: { teacherId: req.user.id },
        include: [
          { model: Subject, as: 'subject', attributes: ['id', 'name'] },
          { model: Group, as: 'groups', attributes: ['id', 'name'], through: { attributes: [] } }
        ],
        order: [['createdAt', 'DESC']]
      });
    }
    
    res.json(assignments);
  } catch (error) {
    console.error('Ошибка при получении заданий:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заданий' });
  }
});

// Получение заданий для студента
router.get('/student', auth, role(['student']), async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id, {
      include: [{ model: Group, as: 'group' }]
    });
    
    if (!student || !student.group) {
      return res.status(404).json({ message: 'Студент не найден или не привязан к группе' });
    }
    
    // Получаем задания для группы студента
    const assignments = await Assignment.findAll({
      include: [
        { model: Group, as: 'groups', where: { id: student.group.id }, through: { attributes: [] } },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
        {
          model: AssignmentSubmission, 
          as: 'submissions',
          where: { studentId: req.user.id },
          required: false
        }
      ],
      where: { status: 'published' },
      order: [['dueDate', 'ASC']]
    });
    
    res.json(assignments);
  } catch (error) {
    console.error('Ошибка при получении заданий для студента:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заданий' });
  }
});

// Получение конкретного задания по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'groups', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'student') {
      // Студент может видеть только опубликованные задания для своей группы
      const student = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: 'group' }]
      });
      
      if (!student || !student.group) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      
      const hasAccess = assignment.status === 'published' && 
                       assignment.groups.some(group => group.id === student.group.id);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    } else if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
      // Преподаватель может видеть только свои задания
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Ошибка при получении задания:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении задания' });
  }
});

// Создание нового задания (только для преподавателей и админов)
router.post('/', auth, role(['admin', 'teacher']), async (req, res) => {
  try {
    const { title, description, type, dueDate, maxScore, subjectId, groupIds, status } = req.body;
    
    // Проверка обязательных полей
    if (!title || !description || !subjectId || !groupIds || !groupIds.length) {
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }
    
    // Создание задания
    const assignment = await Assignment.create({
      title,
      description,
      type: type || 'task',
      dueDate: dueDate || null,
      maxScore: maxScore || 5,
      status: status || 'draft',
      teacherId: req.user.id,
      subjectId
    });
    
    // Привязка задания к группам
    await assignment.setGroups(groupIds);
    
    // Получение полных данных о созданном задании
    const createdAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'groups', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    
    res.status(201).json(createdAssignment);
  } catch (error) {
    console.error('Ошибка при создании задания:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании задания' });
  }
});

// Обновление задания (только для преподавателя, создавшего задание, или админа)
router.put('/:id', auth, role(['admin', 'teacher']), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { title, description, type, dueDate, maxScore, subjectId, groupIds, status } = req.body;
    
    // Обновление полей задания
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (type) assignment.type = type;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (maxScore) assignment.maxScore = maxScore;
    if (subjectId) assignment.subjectId = subjectId;
    if (status) assignment.status = status;
    
    await assignment.save();
    
    // Обновление связанных групп, если они были переданы
    if (groupIds && groupIds.length) {
      await assignment.setGroups(groupIds);
    }
    
    // Получение обновленных данных о задании
    const updatedAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { model: Group, as: 'groups', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Ошибка при обновлении задания:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении задания' });
  }
});

// Удаление задания (только для преподавателя, создавшего задание, или админа)
router.delete('/:id', auth, role(['admin', 'teacher']), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await assignment.destroy();
    
    res.json({ message: 'Задание успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении задания:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении задания' });
  }
});

module.exports = router;