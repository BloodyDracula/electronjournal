import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

const state = {
  subjects: [],
  currentSubject: null,
  loading: false,
  error: null
}

const getters = {
  allSubjects: (state) => state.subjects,
  getSubjectById: (state) => (id) => state.subjects.find(subject => subject.id === id),
  subjectsLoading: (state) => state.loading,
  subjectsError: (state) => state.error
}

const actions = {
  // Получение всех предметов
  async fetchSubjects({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.get(`${API_URL}/subjects`)
      commit('setSubjects', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении предметов'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретного предмета
  async fetchSubject({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.get(`${API_URL}/subjects/${id}`)
      commit('setCurrentSubject', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении предмета'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание нового предмета (только для админа)
  async createSubject({ commit }, subjectData) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.post(`${API_URL}/subjects`, subjectData)
      commit('addSubject', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при создании предмета'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление предмета (только для админа)
  async updateSubject({ commit }, { id, subjectData }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.put(`${API_URL}/subjects/${id}`, subjectData)
      commit('updateSubjectInList', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при обновлении предмета'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление предмета (только для админа)
  async deleteSubject({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      await axios.delete(`${API_URL}/subjects/${id}`)
      commit('removeSubject', id)
      return true
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при удалении предмета'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setSubjects: (state, subjects) => {
    state.subjects = subjects
  },
  setCurrentSubject: (state, subject) => {
    state.currentSubject = subject
  },
  addSubject: (state, subject) => {
    state.subjects.push(subject)
  },
  updateSubjectInList: (state, updatedSubject) => {
    const index = state.subjects.findIndex(subject => subject.id === updatedSubject.id)
    if (index !== -1) {
      state.subjects.splice(index, 1, updatedSubject)
    }
  },
  removeSubject: (state, subjectId) => {
    state.subjects = state.subjects.filter(subject => subject.id !== subjectId)
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