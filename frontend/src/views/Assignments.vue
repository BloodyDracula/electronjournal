<template>
  <div class="assignments-container">
    <h1 class="mb-4">Управление заданиями</h1>
    
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
    
    <!-- Панель управления для преподавателя -->
    <div v-if="userRole === 'teacher' || userRole === 'admin'" class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Мои задания</h5>
          <button class="btn btn-primary" @click="openCreateModal">
            <i class="bi bi-plus-circle me-1"></i> Создать задание
          </button>
        </div>
      </div>
    </div>
    
    <!-- Фильтры -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">Фильтры</h5>
        <div class="row g-3">
          <!-- Фильтр по предмету -->
          <div class="col-md-4">
            <label for="subjectFilter" class="form-label">Предмет</label>
            <select class="form-select" id="subjectFilter" v-model="filters.subjectId">
              <option value="">Все предметы</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
          
          <!-- Фильтр по типу задания -->
          <div class="col-md-4">
            <label for="typeFilter" class="form-label">Тип задания</label>
            <select class="form-select" id="typeFilter" v-model="filters.type">
              <option value="">Все типы</option>
              <option value="task">Задание</option>
              <option value="test">Тест</option>
            </select>
          </div>
          
          <!-- Фильтр по статусу (для преподавателя) -->
          <div class="col-md-4" v-if="userRole === 'teacher' || userRole === 'admin'">
            <label for="statusFilter" class="form-label">Статус</label>
            <select class="form-select" id="statusFilter" v-model="filters.status">
              <option value="">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>
          
          <!-- Фильтр по статусу выполнения (для студента) -->
          <div class="col-md-4" v-if="userRole === 'student'">
            <label for="completionFilter" class="form-label">Статус выполнения</label>
            <select class="form-select" id="completionFilter" v-model="filters.completion">
              <option value="">Все задания</option>
              <option value="not_submitted">Не выполнено</option>
              <option value="submitted">Отправлено</option>
              <option value="graded">Оценено</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Список заданий для преподавателя -->
    <div v-if="(userRole === 'teacher' || userRole === 'admin') && filteredAssignments.length > 0" class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">Список заданий</h5>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Название</th>
                <th>Предмет</th>
                <th>Тип</th>
                <th>Срок сдачи</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in filteredAssignments" :key="assignment.id">
                <td>{{ assignment.title }}</td>
                <td>{{ assignment.subject ? assignment.subject.name : 'Не указан' }}</td>
                <td>{{ assignment.type === 'task' ? 'Задание' : 'Тест' }}</td>
                <td>{{ assignment.dueDate ? formatDate(assignment.dueDate) : 'Не указан' }}</td>
                <td>
                  <span :class="getStatusBadgeClass(assignment.status)">
                    {{ assignment.status === 'draft' ? 'Черновик' : 'Опубликовано' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" @click="viewAssignment(assignment.id)">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="openEditModal(assignment)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="openDeleteModal(assignment)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Список заданий для студента -->
    <div v-if="userRole === 'student'" class="row">
      <div v-for="assignment in filteredStudentAssignments" :key="assignment.id" class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span :class="getAssignmentTypeClass(assignment.type)">
              {{ assignment.type === 'task' ? 'Задание' : 'Тест' }}
            </span>
            <span :class="getSubmissionStatusClass(assignment)">
              {{ getSubmissionStatusText(assignment) }}
            </span>
          </div>
          <div class="card-body">
            <h5 class="card-title">{{ assignment.title }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ assignment.subject ? assignment.subject.name : 'Предмет не указан' }}</h6>
            <p class="card-text">{{ truncateText(assignment.description, 100) }}</p>
            
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">
                <i class="bi bi-calendar"></i> 
                {{ assignment.dueDate ? `Срок: ${formatDate(assignment.dueDate)}` : 'Без срока сдачи' }}
              </small>
              <button class="btn btn-primary btn-sm" @click="viewAssignment(assignment.id)">
                {{ hasSubmission(assignment) ? 'Просмотреть' : 'Выполнить' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Если нет заданий -->
      <div v-if="filteredStudentAssignments.length === 0" class="col-12">
        <div class="alert alert-info" role="alert">
          У вас пока нет заданий. Возможно, вы можете изменить фильтры для поиска.
        </div>
      </div>
    </div>
    
    <!-- Если нет заданий для преподавателя -->
    <div v-if="(userRole === 'teacher' || userRole === 'admin') && filteredAssignments.length === 0" class="alert alert-info" role="alert">
      Заданий не найдено. Вы можете создать новое задание, нажав на кнопку "Создать задание".
    </div>
    
    <!-- Модальное окно создания/редактирования задания -->
    <div class="modal fade" id="assignmentModal" tabindex="-1" aria-labelledby="assignmentModalLabel" aria-hidden="true" v-if="showCreateModal || showEditModal" ref="assignmentModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="assignmentModalLabel">
              {{ showEditModal ? 'Редактирование задания' : 'Создание нового задания' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModals"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="showEditModal ? updateAssignment() : handleCreateAssignment()">
              <div class="mb-3">
                <label for="title" class="form-label">Название задания</label>
                <input type="text" class="form-control" id="title" v-model="assignmentForm.title" required>
              </div>
              
              <div class="mb-3">
                <label for="description" class="form-label">Описание задания</label>
                <textarea class="form-control" id="description" rows="5" v-model="assignmentForm.description" required></textarea>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="type" class="form-label">Тип задания</label>
                  <select class="form-select" id="type" v-model="assignmentForm.type" required>
                    <option value="task">Задание</option>
                    <option value="test">Тест</option>
                  </select>
                </div>
                
                <div class="col-md-6">
                  <label for="subject" class="form-label">Предмет</label>
                  <select class="form-select" id="subject" v-model="assignmentForm.subjectId" required>
                    <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                      {{ subject.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="dueDate" class="form-label">Срок сдачи</label>
                  <input type="datetime-local" class="form-control" id="dueDate" v-model="assignmentForm.dueDate">
                </div>
                
                <div class="col-md-6">
                  <label for="maxScore" class="form-label">Максимальный балл</label>
                  <input type="number" class="form-control" id="maxScore" v-model="assignmentForm.maxScore" min="1" max="100" required>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="groups" class="form-label">Группы</label>
                <select multiple class="form-select" id="groups" v-model="assignmentForm.groupIds" required>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
                <small class="form-text text-muted">Удерживайте Ctrl для выбора нескольких групп</small>
              </div>
              
              <div class="mb-3">
                <label for="status" class="form-label">Статус</label>
                <select class="form-select" id="status" v-model="assignmentForm.status" required>
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовать</option>
                </select>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModals">Отмена</button>
                <button type="submit" class="btn btn-primary">
                  {{ showEditModal ? 'Сохранить изменения' : 'Создать задание' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно подтверждения удаления -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true" v-if="showDeleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">Подтверждение удаления</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Вы действительно хотите удалить задание "{{ assignmentToDelete ? assignmentToDelete.title : '' }}"?</p>
            <p class="text-danger">Это действие нельзя отменить.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="handleDeleteAssignment">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as bootstrap from 'bootstrap'

export default {
  name: 'Assignments',
  setup() {
    const router = useRouter()
    
    // Состояние компонента
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const assignmentToDelete = ref(null)
    const assignmentToEdit = ref(null)
    const assignmentModalRef = ref(null)
    const deleteModalRef = ref(null)
    const filters = ref({
      subjectId: '',
      type: '',
      status: '',
      completion: ''
    })
    const assignmentForm = ref({
      title: '',
      description: '',
      type: 'task',
      dueDate: '',
      maxScore: 5,
      subjectId: '',
      groupIds: [],
      status: 'draft'
    })
    
    // Методы
    const openCreateModal = () => {
      showCreateModal.value = true
      resetForm()
      // Используем setTimeout, чтобы дать Vue время отрендерить модальное окно
      setTimeout(() => {
        const modalElement = document.getElementById('assignmentModal')
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement)
          modal.show()
        }
      }, 100)
    }
    
    const openEditModal = (assignment) => {
      editAssignment(assignment)
      assignmentToEdit.value = assignment
      showEditModal.value = true
      // Используем setTimeout, чтобы дать Vue время отрендерить модальное окно
      setTimeout(() => {
        const modalElement = document.getElementById('assignmentModal')
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement)
          modal.show()
        }
      }, 100)
    }
    
    const openDeleteModal = (assignment) => {
      assignmentToDelete.value = assignment
      showDeleteModal.value = true
      // Используем setTimeout, чтобы дать Vue время отрендерить модальное окно
      setTimeout(() => {
        const modalElement = document.getElementById('deleteModal')
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement)
          modal.show()
        }
      }, 100)
    }
    
    const closeModals = () => {
      // Закрываем модальное окно через Bootstrap API
      const modalElement = document.getElementById('assignmentModal')
      if (modalElement) {
        const bsModal = bootstrap.Modal.getInstance(modalElement)
        if (bsModal) bsModal.hide()
      }
      showCreateModal.value = false
      showEditModal.value = false
      resetForm()
    }
    
    const resetForm = () => {
      assignmentForm.value = {
        title: '',
        description: '',
        type: 'task',
        dueDate: '',
        maxScore: 5,
        subjectId: '',
        groupIds: [],
        status: 'draft'
      }
    }
    
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    
    const truncateText = (text, maxLength) => {
      if (text.length <= maxLength) return text
      return text.slice(0, maxLength) + '...'
    }
    
    const getStatusBadgeClass = (status) => {
      return status === 'draft' ? 'badge bg-secondary' : 'badge bg-success'
    }
    
    const getAssignmentTypeClass = (type) => {
      return type === 'task' ? 'badge bg-primary' : 'badge bg-info text-dark'
    }
    
    const getSubmissionStatusClass = (assignment) => {
      if (!assignment.submissions || assignment.submissions.length === 0) {
        return 'badge bg-warning text-dark'
      }
      
      const submission = assignment.submissions[0]
      switch (submission.status) {
        case 'not_submitted':
          return 'badge bg-warning text-dark'
        case 'submitted':
          return 'badge bg-info text-dark'
        case 'graded':
          return 'badge bg-success'
        default:
          return 'badge bg-secondary'
      }
    }
    
    const getSubmissionStatusText = (assignment) => {
      if (!assignment.submissions || assignment.submissions.length === 0) {
        return 'Не выполнено'
      }
      
      const submission = assignment.submissions[0]
      switch (submission.status) {
        case 'not_submitted':
          return 'Не выполнено'
        case 'submitted':
          return 'Отправлено'
        case 'graded':
          return `Оценка: ${submission.score}`
        default:
          return 'Неизвестно'
      }
    }
    
    const hasSubmission = (assignment) => {
      return assignment.submissions && 
             assignment.submissions.length > 0 && 
             assignment.submissions[0].status !== 'not_submitted'
    }
    
    const viewAssignment = (id) => {
      router.push(`/assignments/${id}`)
    }
    
    const editAssignment = (assignment) => {
      assignmentForm.value = {
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
        maxScore: assignment.maxScore,
        subjectId: assignment.subjectId,
        groupIds: assignment.groups ? assignment.groups.map(g => g.id) : [],
        status: assignment.status
      }
      showEditModal.value = true
    }
    
    const confirmDelete = (assignment) => {
      assignmentToDelete.value = assignment
      showDeleteModal.value = true
    }
    
    return {
      showCreateModal,
      showEditModal,
      showDeleteModal,
      assignmentToDelete,
      assignmentToEdit,
      filters,
      assignmentForm,
      openCreateModal,
      openEditModal,
      openDeleteModal,
      closeModals,
      resetForm,
      formatDate,
      truncateText,
      getStatusBadgeClass,
      getAssignmentTypeClass,
      getSubmissionStatusClass,
      getSubmissionStatusText,
      hasSubmission,
      viewAssignment,
      editAssignment,
      confirmDelete
    }
  },
  computed: {
    ...mapGetters('auth', ['userRole']),
    ...mapGetters('subjects', ['allSubjects']),
    ...mapGetters('groups', ['allGroups']),
    ...mapGetters('assignments', [
      'allAssignments',
      'studentAssignments',
      'assignmentsLoading',
      'assignmentsError'
    ]),
    
    subjects() {
      return this.allSubjects || []
    },
    
    groups() {
      return this.allGroups || []
    },
    
    loading() {
      return this.assignmentsLoading
    },
    
    error() {
      return this.assignmentsError
    },
    
    filteredAssignments() {
      return this.allAssignments.filter(assignment => {
        // Фильтр по предмету
        if (this.filters.subjectId && assignment.subjectId !== parseInt(this.filters.subjectId)) {
          return false
        }
        
        // Фильтр по типу
        if (this.filters.type && assignment.type !== this.filters.type) {
          return false
        }
        
        // Фильтр по статусу
        if (this.filters.status && assignment.status !== this.filters.status) {
          return false
        }
        
        return true
      })
    },
    
    filteredStudentAssignments() {
      return this.studentAssignments.filter(assignment => {
        // Фильтр по предмету
        if (this.filters.subjectId && assignment.subjectId !== parseInt(this.filters.subjectId)) {
          return false
        }
        
        // Фильтр по типу
        if (this.filters.type && assignment.type !== this.filters.type) {
          return false
        }
        
        // Фильтр по статусу выполнения
        if (this.filters.completion) {
          const hasSubmission = assignment.submissions && assignment.submissions.length > 0
          
          if (!hasSubmission && this.filters.completion !== 'not_submitted') {
            return false
          }
          
          if (hasSubmission && assignment.submissions[0].status !== this.filters.completion) {
            return false
          }
        }
        
        return true
      })
    }
  },
  methods: {
    ...mapActions('assignments', [
      'fetchAssignments',
      'fetchStudentAssignments',
      'createAssignment',
      'updateAssignment',
      'deleteAssignment'
    ]),
    ...mapActions('subjects', ['fetchSubjects']),
    ...mapActions('groups', ['fetchGroups']),
    
    async handleCreateAssignment() {
      try {
        // Используем метод из mapActions, но через this в методах компонента
        await this.createAssignment(this.assignmentForm)
        this.closeModals()
        this.$toast.success('Задание успешно создано')
      } catch (error) {
        const errorMessage = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : (error.message || 'Неизвестная ошибка');
        this.$toast.error('Ошибка при создании задания: ' + errorMessage);
        console.error(error)
      }
    },
    
    async updateAssignment() {
      try {
        await this.updateAssignment({
          id: assignmentToEdit.value.id,
          assignmentData: assignmentForm.value
        })
        closeModals()
        this.$toast.success('Задание успешно обновлено')
      } catch (error) {
        this.$toast.error('Ошибка при обновлении задания')
        console.error(error)
      }
    },
    
    async handleDeleteAssignment() {
      try {
        if (!this.assignmentToDelete) {
          this.$toast.error('Задание для удаления не найдено')
          this.showDeleteModal = false
          return
        }
        await this.deleteAssignment(this.assignmentToDelete.id)
        this.showDeleteModal = false
        this.assignmentToDelete = null
        this.$toast.success('Задание успешно удалено')
      } catch (error) {
        this.$toast.error('Ошибка при удалении задания: ' + (error.message || 'Неизвестная ошибка'))
        console.error(error)
      }
    }
  },
  async mounted() {
    try {
      // Загрузка данных в зависимости от роли пользователя
      if (this.userRole === 'teacher' || this.userRole === 'admin') {
        await this.fetchAssignments()
      } else if (this.userRole === 'student') {
        await this.fetchStudentAssignments()
      }
      
      // Загрузка предметов и групп для форм
      await this.fetchSubjects()
      await this.fetchGroups()
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
    }
  }
}
</script>

<style scoped>
.card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.modal-dialog {
  max-width: 700px;
}

.badge {
  font-size: 0.8rem;
  padding: 0.35em 0.65em;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.btn-group .btn i {
  font-size: 0.9rem;
}

.form-select[multiple] {
  height: 100px;
}
</style>