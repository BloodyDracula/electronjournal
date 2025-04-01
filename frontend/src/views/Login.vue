<template>
  <div class="login-container">
    <div class="row justify-content-center">
      <div class="col-md-20 col-lg-15">
        <div class="card shadow">
          <div class="card-header bg-primary text-white text-center">
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
        password: ''
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
</style>