<template>
  <div class="login">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="credentials.username" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="credentials.password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import api from '@/api';

export default {
  data() {
    return {
      credentials: {
        username: '',
        password: '',
      },
      error: '',
    };
  },
  methods: {
    async login() {
      try {
        const response = await api.login(this.credentials);
        localStorage.setItem('token', response.data.token); // Сохраняем токен
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Сохраняем данные пользователя
        this.$router.push({name: 'Dashboard'}); // Перенаправляем на Dashboard
      } catch (err) {
        this.error = 'Invalid username or password';
      }
    },
  },
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.error {
  color: red;
}
</style>