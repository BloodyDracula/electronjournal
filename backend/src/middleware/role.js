/**
 * Middleware для проверки роли пользователя
 * @param {Array} roles - Массив разрешенных ролей
 */
module.exports = (roles) => {
  return (req, res, next) => {
    try {
      // Проверка наличия пользователя в запросе (должен быть добавлен auth middleware)
      if (!req.user) {
        return res.status(401).json({ message: 'Требуется авторизация' });
      }
      
      // Проверка роли пользователя
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  };
};