import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Students from '../views/Students.vue';
import Grades from '../views/Grades.vue';

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
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

// Проверка авторизации перед переходом на защищенные маршруты
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token');
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' }); // Перенаправляем на страницу авторизации
    } else {
        next();
    }
});

export default router;