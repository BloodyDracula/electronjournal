import axios from 'axios'
import router from '../../router'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  rememberMe: !!localStorage.getItem('token'),
  loading: false,
  error: null
}

const getters = {
  isAuthenticated: (state) => !!state.token,
  currentUser: (state) => state.user,
  userRole: (state) => state.user ? state.user.role : null,
  authLoading: (state) => state.loading,
  authError: (state) => state.error
}

const actions = {
  // Вход пользователя
  async login({ commit }, { login, password, rememberMe = false }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { login, password })
      
      const { token, user } = response.data
      
      // Сохранение токена и пользователя в localStorage только если выбрано "Запомнить меня"
      if (rememberMe) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        // Удаляем данные из localStorage, если не выбрано "Запомнить меня"
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      
      // Установка токена в заголовки для всех последующих запросов
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      commit('setAuth', { token, user, rememberMe })
      return user
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при входе в систему'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Выход пользователя
  logout({ commit, state }) {
    // Удаление токена и пользователя из localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Удаление токена из заголовков
    delete axios.defaults.headers.common['Authorization']
    
    commit('clearAuth')
    
    // Перенаправление на страницу авторизации
    if (router) {
      router.push('/login')
    }
  },
  
  // Проверка текущего пользователя
  async checkCurrentUser({ commit, state }) {
    if (!state.token) {
      return null
    }
    
    commit('setLoading', true)
    commit('clearError')
    
    try {
      // Установка токена в заголовки
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      
      const response = await axios.get(`${API_URL}/auth/me`)
      const user = response.data
      
      // Обновление данных пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(user))
      
      commit('setUser', user)
      return user
    } catch (error) {
      console.error('Check current user error:', error)
      
      // Если токен недействителен, выходим из системы
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        commit('clearAuth')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
      }
      
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при проверке пользователя'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setAuth: (state, { token, user, rememberMe }) => {
    state.token = token
    state.user = user
    state.rememberMe = rememberMe
  },
  setUser: (state, user) => {
    state.user = user
  },
  clearAuth: (state) => {
    state.token = null
    state.user = null
  },
  setLoading: (state, status) => {
    state.loading = status
  },
  setError: (state, error) => {
    state.error = error
  },
  clearError: (state) => {
    state.error = null
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}