import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

const state = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null
}

const getters = {
  allGroups: (state) => state.groups,
  getGroupById: (state) => (id) => state.groups.find(group => group.id === id),
  groupsLoading: (state) => state.loading,
  groupsError: (state) => state.error
}

const actions = {
  // Получение всех групп
  async fetchGroups({ commit }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.get(`${API_URL}/groups`)
      commit('setGroups', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении групп'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Получение конкретной группы
  async fetchGroup({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.get(`${API_URL}/groups/${id}`)
      commit('setCurrentGroup', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при получении группы'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Создание новой группы (только для админа)
  async createGroup({ commit }, groupData) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.post(`${API_URL}/groups`, groupData)
      commit('addGroup', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при создании группы'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Обновление группы (только для админа)
  async updateGroup({ commit }, { id, groupData }) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      const response = await axios.put(`${API_URL}/groups/${id}`, groupData)
      commit('updateGroupInList', response.data)
      return response.data
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при обновлении группы'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  // Удаление группы (только для админа)
  async deleteGroup({ commit }, id) {
    commit('setLoading', true)
    commit('clearError')
    
    try {
      await axios.delete(`${API_URL}/groups/${id}`)
      commit('removeGroup', id)
      return true
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Ошибка при удалении группы'
      
      commit('setError', errorMessage)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setGroups: (state, groups) => {
    state.groups = groups
  },
  setCurrentGroup: (state, group) => {
    state.currentGroup = group
  },
  addGroup: (state, group) => {
    state.groups.push(group)
  },
  updateGroupInList: (state, updatedGroup) => {
    const index = state.groups.findIndex(group => group.id === updatedGroup.id)
    if (index !== -1) {
      state.groups.splice(index, 1, updatedGroup)
    }
  },
  removeGroup: (state, groupId) => {
    state.groups = state.groups.filter(group => group.id !== groupId)
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