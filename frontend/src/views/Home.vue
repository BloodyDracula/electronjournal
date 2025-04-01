<template>
  <div class="home-container">
    <div class="jumbotron bg-light p-5 rounded">
      <h1 class="display-4">Добро пожаловать в электронный журнал!</h1>
      <p class="lead">Система электронного журнала для учебных заведений</p>
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
        </div>
      </div>
      
      <div v-else-if="userRole === 'teacher'">
        <p>Вы вошли как преподаватель. Вы можете:</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <router-link to="/students" class="btn btn-primary">Просмотр студентов</router-link>
          <router-link to="/groups" class="btn btn-primary">Просмотр групп</router-link>
          <router-link to="/subjects" class="btn btn-primary">Просмотр предметов</router-link>
          <router-link to="/grades" class="btn btn-primary">Управление оценками</router-link>
        </div>
      </div>
      
      <div v-else-if="userRole === 'student'">
        <p>Вы вошли как студент. Вы можете просматривать свои оценки:</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <router-link to="/grades" class="btn btn-primary">Мои оценки</router-link>
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
</style>