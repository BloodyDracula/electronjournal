import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Students from '../views/Students.vue';
import Grades from '../views/Grades.vue';
import Teachers from '../views/Teachers.vue';
import Groups from '../views/Groups.vue';
import Subjects from '../views/Subjects.vue';
import Users from '@/views/Users.vue';
import NotFound from '../views/NotFound.vue'; // Добавляем страницу 404

const routes = [
    {
        path: '/',
        redirect: '/login', // Перенаправляем с корня на страницу авторизации
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/students',
        name: 'Students',
        component: Students,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/grades',
        name: 'Grades',
        component: Grades,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/teachers',
        name: 'Teachers',
        component: Teachers,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/groups',
        name: 'Groups',
        component: Groups,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/subjects',
        name: 'Subjects',
        component: Subjects,
        meta: { requiresAuth: true }, // Защищенный маршрут
    },
    {
        path: '/users',
        name: 'Users',
        component: Users,
        meta: { requiresAuth: true, requiresAdmin: true }, // Требуется авторизация и роль администратора
    },
    {
        path: '/:pathMatch(.*)*', // Ловим все несуществующие маршруты
        name: 'NotFound',
        component: NotFound,
    },
];

const router = createRouter({
    history: createWebHistory('/'), // Используем корневой путь
    routes,
});

// Проверка авторизации и ролей перед переходом на защищенные маршруты
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user')); // Получаем данные пользователя

    if (to.meta.requiresAuth && !isAuthenticated) {
        // Если маршрут требует авторизации, а пользователь не авторизован
        next({ name: 'Login' });
    } else if (to.meta.requiresAdmin && user?.role !== 'admin') {
        // Если маршрут требует роли администратора, а пользователь не админ
        next({ name: 'Dashboard' }); // Перенаправляем на главную страницу
    } else {
        // Всё в порядке, разрешаем переход
        next();
    }
});

export default router;