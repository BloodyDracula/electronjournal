<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <p>Welcome to the Electronic Journal!</p>
    <router-link to="/students" class="btn btn-primary">Students</router-link>
    <router-link to="/grades" class="btn btn-primary">Grades</router-link>
    <button @click="logout" class="btn btn-danger">Logout</button>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      localStorage.removeItem('token'); // Удаляем токен
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
</style>