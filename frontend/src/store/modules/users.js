import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// Функция для получения токена авторизации из localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

const state = {
  users: [],
  currentUser: null,
  loading: false,
  error: null
}

const getters = {
  allUsers: (state) => state.users,
  getUserById: (state) => (id) => state.users.find(user => user.id === id),
  getUsersByRole: (state) => (role) => state.users.filter(user => user.role === role),
  usersLoading: (state) => state.loading,
  usersError: (state) => state.error
}

const actions = {
  // Получение всех пользователей
  async fetchUsers({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setUsers', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении пользователей'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение пользователей по роли
  async fetchUsersByRole({ commit }, role) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/users/role/${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setUsers', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : `Ошибка при получении пользователей с ролью ${role}`
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретного пользователя
  async fetchUser({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setCurrentUser', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении пользователя'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание нового пользователя
  async createUser({ commit }, userData) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('addUser', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при создании пользователя'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление пользователя
  async updateUser({ commit }, { id, userData }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.put(`${API_URL}/users/${id}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('updateUserData', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при обновлении пользователя'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление пользователя
  async deleteUser({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('removeUser', id)
      return true
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при удалении пользователя'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setUsers(state, users) {
    state.users = users
  },
  setCurrentUser(state, user) {
    state.currentUser = user
  },
  addUser(state, user) {
    state.users.push(user)
  },
  updateUserData(state, updatedUser) {
    const index = state.users.findIndex(user => user.id === updatedUser.id)
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser)
    }
    if (state.currentUser && state.currentUser.id === updatedUser.id) {
      state.currentUser = updatedUser
    }
  },
  removeUser(state, userId) {
    state.users = state.users.filter(user => user.id !== userId)
    if (state.currentUser && state.currentUser.id === userId) {
      state.currentUser = null
    }
  },
  setLoading(state, status) {
    state.loading = status
  },
  setError(state, error) {
    state.error = error
  },
  clearError(state) {
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