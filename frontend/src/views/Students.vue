<template>
  <div class="students-container">
    <h1 class="mb-4">Управление студентами</h1>
    
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>
    
    <!-- Сообщение об ошибке -->
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    
    <!-- Фильтр по группам -->
    <div class="mb-4">
      <div class="row">
        <div class="col-md-4">
          <label for="groupFilter" class="form-label">Фильтр по группе</label>
          <select class="form-select" id="groupFilter" v-model="selectedGroupId">
            <option value="">Все группы</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Таблица студентов -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-primary">
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Логин</th>
            <th>Группа</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.id">
            <td>{{ student.id }}</td>
            <td>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</td>
            <td>{{ student.login }}</td>
            <td>{{ student.group ? student.group.name : '-' }}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <router-link :to="`/grades?studentId=${student.id}`" class="btn btn-info">
                  <i class="bi bi-journal-check"></i> Оценки
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Students',
  data() {
    return {
      selectedGroupId: ''
    }
  },
  computed: {
    ...mapGetters('users', [
      'getUsersByRole',
      'usersLoading',
      'usersError'
    ]),
    ...mapGetters('groups', [
      'allGroups'
    ]),
    students() {
      return this.getUsersByRole('student')
    },
    groups() {
      return this.allGroups
    },
    loading() {
      return this.usersLoading
    },
    error() {
      return this.usersError
    },
    filteredStudents() {
      if (!this.selectedGroupId) {
        return this.students
      }
      return this.students.filter(student => 
        student.groupId === parseInt(this.selectedGroupId)
      )
    }
  },
  methods: {
    ...mapActions('users', [
      'fetchUsersByRole'
    ]),
    ...mapActions('groups', [
      'fetchGroups'
    ])
  },
  async created() {
    try {
      await Promise.all([
        this.fetchUsersByRole('student'),
        this.fetchGroups()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }
}
</script>

<style scoped>
.students-container {
  margin-bottom: 2rem;
}
</style>