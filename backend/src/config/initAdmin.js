const { User } = require('../models');

/**
 * Функция для создания администратора по умолчанию, если он не существует
 */
async function initializeAdmin() {
  try {
    // Проверяем, есть ли уже администратор в системе
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      console.log('Создание администратора по умолчанию...');
      
      // Создаем администратора
      await User.create({
        login: 'admin',
        password: 'admin123', // В реальном приложении следует использовать более сложный пароль
        firstName: 'Администратор',
        lastName: 'Системы',
        middleName: '',
        role: 'admin'
      });
      
      console.log('Администратор по умолчанию успешно создан!');
    } else {
      console.log('Администратор уже существует в системе.');
    }
  } catch (error) {
    console.error('Ошибка при инициализации администратора:', error);
  }
}

module.exports = { initializeAdmin };