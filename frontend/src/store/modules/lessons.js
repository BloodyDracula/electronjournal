import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

const state = {
  lessons: [],
  currentLesson: null,
  loading: false,
  error: null
}

const getters = {
  allLessons: state => state.lessons,
  currentLesson: state => state.currentLesson,
  isLoading: state => state.loading,
  error: state => state.error,
  
  // Получение занятий для конкретного дня
  getLessonsByDate: state => date => {
    const formattedDate = date.toISOString().split('T')[0]
    return state.lessons.filter(lesson => {
      return lesson.date.split('T')[0] === formattedDate
    })
  },
  
  // Получение занятий для конкретной группы
  getLessonsByGroup: state => groupId => {
    return state.lessons.filter(lesson => lesson.groupId === groupId)
  },
  
  // Получение занятий для конкретного предмета
  getLessonsBySubject: state => subjectId => {
    return state.lessons.filter(lesson => lesson.subjectId === subjectId)
  }
}

const actions = {
  // Получение всех занятий
  async fetchLessons({ commit }) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.get(`${API_URL}/lessons`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      commit('setLessons', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при получении занятий')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретного занятия
  async fetchLesson({ commit }, lessonId) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.get(`${API_URL}/lessons/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      commit('setCurrentLesson', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при получении занятия')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание нового занятия
  async createLesson({ commit }, lessonData) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.post(`${API_URL}/lessons`, lessonData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Добавляем новое занятие в список
      commit('addLesson', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при создании занятия')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление занятия
  async updateLesson({ commit }, { id, lessonData }) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const response = await axios.put(`${API_URL}/lessons/${id}`, lessonData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Обновляем занятие в списке
      commit('updateLesson', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при обновлении занятия')
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление занятия
  async deleteLesson({ commit }, lessonId) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      await axios.delete(`${API_URL}/lessons/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Удаляем занятие из списка
      commit('removeLesson', lessonId)
      return true
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Ошибка при удалении занятия')
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setLessons(state, lessons) {
    state.lessons = lessons
  },
  setCurrentLesson(state, lesson) {
    state.currentLesson = lesson
  },
  setLoading(state, status) {
    state.loading = status
  },
  setError(state, error) {
    state.error = error
  },
  addLesson(state, lesson) {
    state.lessons.unshift(lesson)
  },
  updateLesson(state, updatedLesson) {
    const index = state.lessons.findIndex(lesson => lesson.id === updatedLesson.id)
    if (index !== -1) {
      state.lessons.splice(index, 1, updatedLesson)
    }
    if (state.currentLesson && state.currentLesson.id === updatedLesson.id) {
      state.currentLesson = updatedLesson
    }
  },
  removeLesson(state, lessonId) {
    state.lessons = state.lessons.filter(lesson => lesson.id !== lessonId)
    if (state.currentLesson && state.currentLesson.id === lessonId) {
      state.currentLesson = null
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