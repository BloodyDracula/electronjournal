import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

// Компоненты для страниц
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Users from '../views/Users.vue'
import Students from '../views/Students.vue'
import Groups from '../views/Groups.vue'
import Subjects from '../views/Subjects.vue'
import Grades from '../views/Grades.vue'
import Assignments from '../views/Assignments.vue'
import AssignmentDetail from '../views/AssignmentDetail.vue'
import Attendance from '../views/Attendance.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/students',
    name: 'Students',
    component: Students,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: Groups,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/subjects',
    name: 'Subjects',
    component: Subjects,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/grades',
    name: 'Grades',
    component: Grades,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments',
    name: 'Assignments',
    component: Assignments,
    meta: { requiresAuth: true }
  },
  {
    path: '/assignments/:id',
    name: 'AssignmentDetail',
    component: AssignmentDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: Attendance,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const userRole = store.getters['auth/userRole']
  
  // Проверка авторизации
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'Login' })
    } else {
      // Проверка роли пользователя
      if (to.meta.roles && !to.meta.roles.includes(userRole)) {
        next({ name: 'Home' }) // Перенаправление на главную, если нет доступа
      } else {
        next()
      }
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (isAuthenticated) {
      next({ name: 'Home' }) // Если пользователь уже авторизован, перенаправляем на главную
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router