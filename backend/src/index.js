require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const { initializeAdmin } = require('./config/initAdmin');

// Импорт маршрутов
const { router: authRoutes } = require('./routes/auth');
const usersRoutes = require('./routes/users');
const groupsRoutes = require('./routes/groups');
const subjectsRoutes = require('./routes/subjects');
const gradesRoutes = require('./routes/grades');

const app = express();

// Middleware
// Логирование CORS конфигурации
console.log('Applying CORS with config:', {
  origin: true,
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Authorization', 'Content-Type']
});

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование запросов
// Логирование входящих заголовков
app.use((req, res, next) => {
  console.log('Incoming headers:', {
    authorization: req.headers.authorization?.slice(0, 20) + '...',
    origin: req.headers.origin,
    'access-control-request-headers': req.headers['access-control-request-headers']
  });
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/grades', gradesRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(async () => {
    // Инициализация администратора при запуске
    await initializeAdmin();
    
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Ошибка при синхронизации с базой данных:', err);
  });