<template>
  <div class="app-container">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div class="container">
        <router-link class="navbar-brand" to="/">
          <img src="./assets/ranepa-logo.svg" alt="РАНХиГС" height="40">
          <span class="ms-2">Электронный журнал</span>
        </router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <!-- Отображаем пункты меню в зависимости от роли пользователя -->
            <template v-if="isAuthenticated">
              <!-- Для всех авторизованных пользователей -->
              <li class="nav-item">
                <router-link class="nav-link" to="/grades">Оценки</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/assignments">Задания</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/attendance">Посещаемость</router-link>
              </li>
              
              <!-- Для администраторов и преподавателей -->
              <template v-if="userRole === 'admin' || userRole === 'teacher'">
                <li class="nav-item">
                  <router-link class="nav-link" to="/students">Студенты</router-link>
                </li>
                <li class="nav-item">
                  <router-link class="nav-link" to="/groups">Группы</router-link>
                </li>
                <li class="nav-item">
                  <router-link class="nav-link" to="/subjects">Предметы</router-link>
                </li>
              </template>
              
              <!-- Только для администраторов -->
              <li class="nav-item" v-if="userRole === 'admin'">
                <router-link class="nav-link" to="/users">Пользователи</router-link>
              </li>
            </template>
          </ul>
          
          <!-- Блок авторизации -->
          <div class="d-flex">
            <template v-if="isAuthenticated">
              <span class="navbar-text me-3">
                {{ currentUser.firstName }} {{ currentUser.lastName }} ({{ userRoleText }})
              </span>
              <button class="btn btn-outline-light" @click="logout">Выйти</button>
            </template>
            <template v-else>
              <router-link class="btn btn-outline-light" to="/login">Войти</router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters('auth', [
      'isAuthenticated',
      'currentUser',
      'userRole'
    ]),
    userRoleText() {
      const roles = {
        admin: 'Администратор',
        teacher: 'Преподаватель',
        student: 'Студент'
      }
      return roles[this.userRole] || ''
    }
  },
  methods: {
    ...mapActions('auth', ['logout'])
  }
}
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
}
</style>