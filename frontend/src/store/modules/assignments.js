import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// Функция для получения токена авторизации из localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

const state = {
  assignments: [],
  studentAssignments: [],
  currentAssignment: null,
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null
}

const getters = {
  allAssignments: (state) => state.assignments,
  studentAssignments: (state) => state.studentAssignments,
  currentAssignment: (state) => state.currentAssignment,
  allSubmissions: (state) => state.submissions,
  currentSubmission: (state) => state.currentSubmission,
  assignmentsLoading: (state) => state.loading,
  assignmentsError: (state) => state.error
}

const actions = {
  // Получение всех заданий (для админа или преподавателя)
  async fetchAssignments({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setAssignments', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении заданий'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение заданий для студента
  async fetchStudentAssignments({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/assignments/student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setStudentAssignments', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении заданий'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретного задания по ID
  async fetchAssignment({ commit }, assignmentId) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setCurrentAssignment', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание нового задания
  async createAssignment({ commit }, assignmentData) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.post(`${API_URL}/assignments`, assignmentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      commit('addAssignment', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при создании задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление задания
  async updateAssignment({ commit }, { id, assignmentData }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.put(`${API_URL}/assignments/${id}`, assignmentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      commit('updateAssignmentInList', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при обновлении задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление задания
  async deleteAssignment({ commit }, assignmentId) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      await axios.delete(`${API_URL}/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('removeAssignment', assignmentId)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при удалении задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение всех ответов на задания (для преподавателя)
  async fetchSubmissions({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/submissions/teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setSubmissions', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении ответов на задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение ответов студента на задания
  async fetchStudentSubmissions({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/submissions/student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setSubmissions', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении ответов на задания'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретного ответа на задание
  async fetchSubmission({ commit }, submissionId) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/submissions/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      commit('setCurrentSubmission', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении ответа на задание'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Отправка ответа на задание (для студента)
  async submitAssignment({ commit }, { assignmentId, answer }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.post(`${API_URL}/submissions/${assignmentId}`, { answer }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      commit('setCurrentSubmission', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при отправке ответа на задание'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Оценивание ответа на задание (для преподавателя)
  async gradeSubmission({ commit }, { submissionId, score, feedback }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const token = getAuthToken()
      const response = await axios.put(`${API_URL}/submissions/${submissionId}/grade`, { score, feedback }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      commit('updateSubmissionInList', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при оценивании ответа на задание'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setAssignments(state, assignments) {
    state.assignments = assignments
  },
  setStudentAssignments(state, assignments) {
    state.studentAssignments = assignments
  },
  setCurrentAssignment(state, assignment) {
    state.currentAssignment = assignment
  },
  addAssignment(state, assignment) {
    state.assignments = [assignment, ...state.assignments]
  },
  updateAssignmentInList(state, updatedAssignment) {
    const index = state.assignments.findIndex(a => a.id === updatedAssignment.id)
    if (index !== -1) {
      state.assignments.splice(index, 1, updatedAssignment)
    }
    if (state.currentAssignment && state.currentAssignment.id === updatedAssignment.id) {
      state.currentAssignment = updatedAssignment
    }
  },
  removeAssignment(state, assignmentId) {
    state.assignments = state.assignments.filter(a => a.id !== assignmentId)
    if (state.currentAssignment && state.currentAssignment.id === assignmentId) {
      state.currentAssignment = null
    }
  },
  setSubmissions(state, submissions) {
    state.submissions = submissions
  },
  setCurrentSubmission(state, submission) {
    state.currentSubmission = submission
  },
  updateSubmissionInList(state, updatedSubmission) {
    const index = state.submissions.findIndex(s => s.id === updatedSubmission.id)
    if (index !== -1) {
      state.submissions.splice(index, 1, updatedSubmission)
    }
    if (state.currentSubmission && state.currentSubmission.id === updatedSubmission.id) {
      state.currentSubmission = updatedSubmission
    }
  },
  setLoading(state, loading) {
    state.loading = loading
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