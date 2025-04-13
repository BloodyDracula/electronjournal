<template>
  <div class="login-container">
    <div class="row justify-content-center">
      <div class="col-md-20 col-lg-15">
        <div class="card shadow">
          <div class="card-header bg-primary text-white text-center">
            <img src="../assets/ranepa-logo.svg" alt="РАНХиГС" class="ranepa-logo mb-2">
            <h4>Вход в систему</h4>
          </div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>
            
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="login" class="form-label">Логин</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="login" 
                  v-model="loginForm.login" 
                  required
                  autocomplete="username"
                >
              </div>
              
              <div class="mb-3">
                <label for="password" class="form-label">Пароль</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password" 
                  v-model="loginForm.password" 
                  required
                  autocomplete="current-password"
                >
              </div>
              
              <div class="mb-3 form-check">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  id="rememberMe" 
                  v-model="loginForm.rememberMe"
                >
                <label class="form-check-label" for="rememberMe">Запомнить меня</label>
              </div>
              
              <div class="d-grid gap-2">
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        login: '',
        password: '',
        rememberMe: false
      }
    }
  },
  computed: {
    ...mapGetters('auth', [
      'authLoading',
      'authError'
    ]),
    loading() {
      return this.authLoading
    },
    error() {
      return this.authError
    }
  },
  methods: {
    ...mapActions('auth', [
      'login'
    ]),
    async handleLogin() {
      try {
        await this.login(this.loginForm)
        this.$router.push('/')
      } catch (error) {
        // Ошибка уже обрабатывается в хранилище
        console.error('Login error:', error)
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  min-width: 600px;
}

.ranepa-logo {
  height: 50px;
  margin-bottom: 10px;
}

.card {
  border: none;
  border-radius: 8px;
}

.card-header {
  background-color: var(--ranepa-blue) !important;
  border-radius: 8px 8px 0 0 !important;
  padding: 1.5rem 1rem;
}

.btn-primary {
  background-color: var(--ranepa-blue) !important;
  border-color: var(--ranepa-blue) !important;
  padding: 0.6rem 1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--ranepa-light-blue) !important;
  border-color: var(--ranepa-light-blue) !important;
}

.form-control:focus {
  border-color: var(--ranepa-light-blue);
  box-shadow: 0 0 0 0.25rem rgba(0, 58, 107, 0.25);
}
</style>