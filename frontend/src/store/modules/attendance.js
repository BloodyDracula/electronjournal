import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

const state = {
  attendances: [],
  studentAttendance: null,
  loading: false,
  error: null
}

const getters = {
  allAttendances: state => state.attendances,
  studentAttendance: state => state.studentAttendance,
  isLoading: state => state.loading,
  error: state => state.error,
  
  // Получение посещаемости по статусу
  getAttendancesByStatus: state => status => {
    return state.attendances.filter(attendance => attendance.status === status)
  },
  
  // Получение посещаемости для конкретного студента
  getAttendancesByStudent: state => studentId => {
    return state.attendances.filter(attendance => attendance.studentId === studentId)
  }
}

const actions = {
  // Получение записей о посещаемости для конкретного занятия
  async fetchAttendancesByLesson({ commit }, lessonId) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.get(`${API_URL}/attendance/lesson/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      commit('setAttendances', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при получении данных о посещаемости')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение записей о посещаемости для конкретного студента
  async fetchStudentAttendances({ commit }, studentId) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.get(`${API_URL}/attendance/student/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      commit('setAttendances', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при получении данных о посещаемости студента')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление записи о посещаемости
  async updateAttendance({ commit }, { id, status, comment }) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.put(`${API_URL}/attendance/${id}`, { status, comment }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Обновляем запись в списке
      commit('updateAttendance', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при обновлении данных о посещаемости')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Массовое обновление записей о посещаемости
  async bulkUpdateAttendances({ commit }, attendances) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      // Получаем lessonId из первой записи посещаемости
      if (!attendances || attendances.length === 0) {
        throw new Error('Нет данных для обновления')
      }
      
      // Предполагаем, что все записи относятся к одному занятию
      // Получаем lessonId из первой записи в store
      const firstAttendance = state.attendances.find(a => a.id === attendances[0].id)
      if (!firstAttendance || !firstAttendance.lessonId) {
        throw new Error('Не удалось определить занятие для обновления посещаемости')
      }
      
      const lessonId = firstAttendance.lessonId
      
      const response = await axios.put(`${API_URL}/attendance/lesson/${lessonId}/bulk`, { attendances }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Обновляем записи в списке
      commit('setAttendances', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при массовом обновлении данных о посещаемости')
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setAttendances(state, attendances) {
    state.attendances = attendances
  },
  setStudentAttendance(state, attendance) {
    state.studentAttendance = attendance
  },
  setLoading(state, status) {
    state.loading = status
  },
  setError(state, error) {
    state.error = error
  },
  updateAttendance(state, updatedAttendance) {
    const index = state.attendances.findIndex(attendance => attendance.id === updatedAttendance.id)
    if (index !== -1) {
      state.attendances.splice(index, 1, updatedAttendance)
    }
    if (state.studentAttendance && state.studentAttendance.id === updatedAttendance.id) {
      state.studentAttendance = updatedAttendance
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}