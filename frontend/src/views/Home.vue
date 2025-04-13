<template>
  <div class="home-container">
    <div class="jumbotron bg-light p-5 rounded ranepa-jumbotron">
      <div class="text-center mb-4">
        <img src="../assets/ranepa-logo.svg" alt="РАНХиГС" class="ranepa-logo-large mb-3">
        <h1 class="display-4">Добро пожаловать в электронный журнал!</h1>
        <p class="lead">Система электронного журнала <span class="accent-red">РАНХиГС</span></p>
      </div>
      <hr class="my-4">
      
      <!-- Разное содержимое в зависимости от роли пользователя -->
      <div v-if="userRole === 'admin'">
        <p>Вы вошли как администратор. У вас есть доступ ко всем разделам системы:</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <router-link to="/users" class="btn btn-primary">Управление пользователями</router-link>
          <router-link to="/students" class="btn btn-primary">Управление студентами</router-link>
          <router-link to="/groups" class="btn btn-primary">Управление группами</router-link>
          <router-link to="/subjects" class="btn btn-primary">Управление предметами</router-link>
          <router-link to="/grades" class="btn btn-primary">Просмотр оценок</router-link>
          <router-link to="/assignments" class="btn btn-primary">Управление заданиями</router-link>
        </div>
      </div>
      
      <div v-else-if="userRole === 'teacher'">
        <p>Вы вошли как преподаватель. Вы можете:</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <router-link to="/students" class="btn btn-primary">Просмотр студентов</router-link>
          <router-link to="/groups" class="btn btn-primary">Просмотр групп</router-link>
          <router-link to="/subjects" class="btn btn-primary">Просмотр предметов</router-link>
          <router-link to="/grades" class="btn btn-primary">Управление оценками</router-link>
          <router-link to="/assignments" class="btn btn-primary">Создание заданий</router-link>
        </div>
      </div>
      
      <div v-else-if="userRole === 'student'">
        <p>Вы вошли как студент. Вы можете просматривать свои оценки:</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <router-link to="/grades" class="btn btn-primary">Мои оценки</router-link>
          <router-link to="/assignments" class="btn btn-primary">Мои задания</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapGetters('auth', [
      'userRole',
      'currentUser'
    ])
  }
}
</script>

<style scoped>
.home-container {
  margin-top: 2rem;
}

.ranepa-jumbotron {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 58, 107, 0.1);
  border-top: 4px solid var(--ranepa-blue);
  border-bottom: 4px solid var(--ranepa-red);
}

.ranepa-logo-large {
  height: 70px;
  margin-bottom: 1rem;
}

.accent-red {
  color: var(--ranepa-red);
  font-weight: bold;
}

.btn-primary {
  background-color: var(--ranepa-blue);
  border-color: var(--ranepa-blue);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--ranepa-light-blue);
  border-color: var(--ranepa-light-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 58, 107, 0.2);
}
</style>