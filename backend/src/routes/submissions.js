const express = require('express');
const router = express.Router();
const { AssignmentSubmission, Assignment, User, Group, Subject } = require('../models');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Получение всех ответов на задания (для админа)
router.get('/', auth, role(['admin']), async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.findAll({
      include: [
        { 
          model: Assignment, 
          as: 'assignment',
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
        },
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ],
      order: [['submittedAt', 'DESC']]
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Ошибка при получении ответов на задания:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ответов на задания' });
  }
});

// Получение ответов на задания для преподавателя
router.get('/teacher', auth, role(['teacher']), async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.findAll({
      include: [
        { 
          model: Assignment, 
          as: 'assignment',
          where: { teacherId: req.user.id },
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
        },
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ],
      order: [['submittedAt', 'DESC']]
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Ошибка при получении ответов на задания для преподавателя:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ответов на задания' });
  }
});

// Получение ответов на задания для студента
router.get('/student', auth, role(['student']), async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.findAll({
      where: { studentId: req.user.id },
      include: [
        { 
          model: Assignment, 
          as: 'assignment',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name'] },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
          ]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Ошибка при получении ответов на задания для студента:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ответов на задания' });
  }
});

// Получение конкретного ответа на задание по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findByPk(req.params.id, {
      include: [
        { 
          model: Assignment, 
          as: 'assignment',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name'] },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
          ]
        },
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ]
    });
    
    if (!submission) {
      return res.status(404).json({ message: 'Ответ на задание не найден' });
    }
    
    // Проверка прав доступа
    if (req.user.role === 'student' && submission.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    } else if (req.user.role === 'teacher' && submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Ошибка при получении ответа на задание:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ответа на задание' });
  }
});

// Отправка ответа на задание (для студента)
router.post('/:assignmentId', auth, role(['student']), async (req, res) => {
  try {
    const { answer } = req.body;
    const assignmentId = req.params.assignmentId;
    
    // Проверка существования задания
    const assignment = await Assignment.findByPk(assignmentId, {
      include: [{ model: Group, as: 'groups' }]
    });
    
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    
    // Проверка, что задание опубликовано
    if (assignment.status !== 'published') {
      return res.status(403).json({ message: 'Задание не опубликовано' });
    }
    
    // Проверка, что студент принадлежит к группе, для которой предназначено задание
    const student = await User.findByPk(req.user.id, {
      include: [{ model: Group, as: 'group' }]
    });
    
    if (!student || !student.group) {
      return res.status(403).json({ message: 'Студент не привязан к группе' });
    }
    
    const hasAccess = assignment.groups.some(group => group.id === student.group.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Задание не предназначено для вашей группы' });
    }
    
    // Проверка, не истек ли срок сдачи
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      return res.status(403).json({ message: 'Срок сдачи задания истек' });
    }
    
    // Проверка, не отправлял ли студент уже ответ на это задание
    let submission = await AssignmentSubmission.findOne({
      where: { assignmentId, studentId: req.user.id }
    });
    
    if (submission) {
      // Обновление существующего ответа
      submission.answer = answer;
      submission.status = 'submitted';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      // Создание нового ответа
      submission = await AssignmentSubmission.create({
        assignmentId,
        studentId: req.user.id,
        answer,
        status: 'submitted',
        submittedAt: new Date()
      });
    }
    
    // Получение полных данных о созданном/обновленном ответе
    const submissionWithDetails = await AssignmentSubmission.findByPk(submission.id, {
      include: [
        { model: Assignment, as: 'assignment' },
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ]
    });
    
    res.status(201).json(submissionWithDetails);
  } catch (error) {
    console.error('Ошибка при отправке ответа на задание:', error);
    res.status(500).json({ message: 'Ошибка сервера при отправке ответа на задание' });
  }
});

// Оценивание ответа на задание (для преподавателя)
router.put('/:id/grade', auth, role(['admin', 'teacher']), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ message: 'Необходимо указать оценку' });
    }
    
    const submission = await AssignmentSubmission.findByPk(req.params.id, {
      include: [{ model: Assignment, as: 'assignment' }]
    });
    
    if (!submission) {
      return res.status(404).json({ message: 'Ответ на задание не найден' });
    }
    
    // Проверка прав доступа для преподавателя
    if (req.user.role === 'teacher' && submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Проверка, что ответ был отправлен
    if (submission.status === 'not_submitted') {
      return res.status(400).json({ message: 'Невозможно оценить неотправленный ответ' });
    }
    
    // Проверка, что оценка не превышает максимальный балл за задание
    if (score > submission.assignment.maxScore) {
      return res.status(400).json({ 
        message: `Оценка не может превышать максимальный балл за задание (${submission.assignment.maxScore})` 
      });
    }
    
    // Обновление оценки
    submission.score = score;
    submission.feedback = feedback || null;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    
    await submission.save();
    
    // Получение обновленных данных
    const updatedSubmission = await AssignmentSubmission.findByPk(submission.id, {
      include: [
        { model: Assignment, as: 'assignment' },
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'middleName'] }
      ]
    });
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error('Ошибка при оценивании ответа на задание:', error);
    res.status(500).json({ message: 'Ошибка сервера при оценивании ответа на задание' });
  }
});

module.exports = router;