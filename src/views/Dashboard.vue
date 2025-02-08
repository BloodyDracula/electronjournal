<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <p>Welcome to the Electronic Journal, {{ user.username }}!</p>

    <!-- Навигационные кнопки -->
    <div class="navigation-buttons">
      <router-link to="/students" class="btn btn-primary">Students</router-link>
      <router-link to="/users" class="btn btn-primary">Users</router-link>
      <router-link to="/groups" class="btn btn-primary">Groups</router-link>
      <router-link to="/teachers" class="btn btn-primary">Teachers</router-link>
      <router-link to="/subjects" class="btn btn-primary">Subjects</router-link>
      <router-link to="/grades" class="btn btn-primary">Grades</router-link>
    </div>

    <!-- Кнопка выхода -->
    <button @click="logout" class="btn btn-danger mt-3">Logout</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {}, // Данные текущего пользователя
    };
  },
  created() {
    this.loadUserData();
  },
  methods: {
    // Загрузка данных текущего пользователя
    loadUserData() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        this.user = user;
      } else {
        this.$router.push({ name: 'Login' }); // Перенаправление на страницу авторизации, если пользователь не авторизован
      }
    },

    // Выход из системы
    logout() {
      localStorage.removeItem('token'); // Удаляем токен
      localStorage.removeItem('user'); // Удаляем данные пользователя
      this.$router.push({ name: 'Login' }); // Перенаправляем на страницу авторизации
    },
  },
};
</script>

<style scoped>
.dashboard {
  text-align: center;
  padding: 20px;
}

.navigation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn {
  min-width: 120px;
  margin: 5px;
}
</style>