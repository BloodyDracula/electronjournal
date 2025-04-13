const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    // Получение токена из заголовка
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Проверка токена
    console.log('Attempting to verify token:', token.slice(0, 10) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Получение пользователя из базы данных
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    
    // Добавление пользователя в объект запроса
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
  message: error.message,
  token: token ? token.slice(0, 10) + '...' : 'missing',
  stack: error.stack
});
    
    let errorMessage = 'Ошибка авторизации';
    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Недействительный токен';
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Срок действия токена истек';
    } else if (error.name === 'SequelizeConnectionError') {
      errorMessage = 'Ошибка подключения к базе данных';
    }
    
    console.error(`Auth Error: ${errorMessage}`, error.stack);
    res.status(401).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};