const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware для проверки роли пользователя
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    next();
  };
};

// Маршрут для входа пользователя
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Проверка наличия логина и пароля
    if (!login || !password) {
      return res.status(400).json({ message: 'Необходимо указать логин и пароль' });
    }
    
    // Поиск пользователя по логину
    const user = await User.findOne({ where: { login } });
    
    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }
    
    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }
    
    // Создание JWT токена
    const token = jwt.sign(
      { 
        id: user.id, 
        login: user.login, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршрут для проверки текущего пользователя
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = { router, authenticateToken, checkRole };