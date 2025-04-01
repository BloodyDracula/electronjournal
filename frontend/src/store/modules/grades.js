import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// Функция для получения токена авторизации из localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

const state = {
  grades: [],
  studentGrades: [],
  loading: false,
  error: null
}

const getters = {
  allGrades: (state) => state.grades,
  studentGrades: (state) => state.studentGrades,
  getGradeById: (state) => (id) => state.grades.find(grade => grade.id === id),
  gradesLoading: (state) => state.loading,
  gradesError: (state) => state.error
}

const actions = {
  // Получение всех оценок (для админа или преподавателя)
  async fetchGrades({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/grades`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setGrades', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении оценок'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение оценок конкретного студента
  async fetchStudentGrades({ commit }, studentId) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/grades/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setStudentGrades', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении оценок студента'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение оценок по предмету
  async fetchGradesBySubject({ commit }, subjectId) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/grades/subject/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setGrades', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении оценок по предмету'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание новой оценки (только для преподавателя)
  async createGrade({ commit }, gradeData) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.post(`${API_URL}/grades`, gradeData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('addGrade', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при создании оценки'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление оценки (только для преподавателя, который ее поставил)
  async updateGrade({ commit }, { id, gradeData }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.put(`${API_URL}/grades/${id}`, gradeData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('updateGradeInList', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при обновлении оценки'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление оценки (только для преподавателя, который ее поставил)
  async deleteGrade({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      await axios.delete(`${API_URL}/grades/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('removeGrade', id)
      return true
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при удалении оценки'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setGrades: (state, grades) => {
    state.grades = grades
  },
  setStudentGrades: (state, grades) => {
    state.studentGrades = grades
  },
  addGrade: (state, grade) => {
    state.grades.push(grade)
  },
  updateGradeInList: (state, updatedGrade) => {
    const index = state.grades.findIndex(grade => grade.id === updatedGrade.id)
    if (index !== -1) {
      state.grades.splice(index, 1, updatedGrade)
    }
  },
  removeGrade: (state, gradeId) => {
    state.grades = state.grades.filter(grade => grade.id !== gradeId)
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