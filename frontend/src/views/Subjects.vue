<template>
  <div class="subjects-container">
    <h1 class="mb-4">Управление предметами</h1>
    
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
    
    <!-- Кнопка добавления нового предмета (только для админа) -->
    <div class="mb-4" v-if="userRole === 'admin'">
      <button class="btn btn-success" @click="showAddSubjectModal = true">
        <i class="bi bi-plus-circle me-2"></i> Добавить предмет
      </button>
    </div>
    
    <!-- Таблица предметов -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-primary">
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Описание</th>
            <th>Преподаватели</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>{{ subject.id }}</td>
            <td>{{ subject.name }}</td>
            <td>{{ subject.description || '-' }}</td>
            <td>
              <span v-if="subject.teachers && subject.teachers.length > 0">
                <span v-for="(teacher, index) in subject.teachers" :key="teacher.id">
                  {{ teacher.lastName }} {{ teacher.firstName }}
                  <span v-if="index < subject.teachers.length - 1">, </span>
                </span>
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <div class="btn-group btn-group-sm">
                <router-link :to="`/grades?subjectId=${subject.id}`" class="btn btn-info">
                  <i class="bi bi-journal-check"></i> Оценки
                </router-link>
                <button v-if="userRole === 'admin'" class="btn btn-primary" @click="editSubject(subject)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button v-if="userRole === 'admin'" class="btn btn-danger" @click="confirmDeleteSubject(subject)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно добавления/редактирования предмета -->
    <div class="modal fade" :class="{ 'show d-block': showAddSubjectModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактирование предмета' : 'Добавление предмета' }}</h5>
            <button type="button" class="btn-close" @click="closeSubjectModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveSubject">
              <div class="mb-3">
                <label for="name" class="form-label">Название предмета</label>
                <input type="text" class="form-control" id="name" v-model="subjectForm.name" required>
              </div>
              
              <div class="mb-3">
                <label for="description" class="form-label">Описание</label>
                <textarea class="form-control" id="description" v-model="subjectForm.description" rows="3"></textarea>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Преподаватели</label>
                <div class="form-check" v-for="teacher in teachers" :key="teacher.id">
                  <input class="form-check-input" type="checkbox" 
                         :id="`teacher-${teacher.id}`" 
                         :value="teacher.id" 
                         v-model="subjectForm.teacherIds">
                  <label class="form-check-label" :for="`teacher-${teacher.id}`">
                    {{ teacher.lastName }} {{ teacher.firstName }} {{ teacher.middleName }}
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeSubjectModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveSubject">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно подтверждения удаления -->
    <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Подтверждение удаления</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Вы действительно хотите удалить предмет "{{ selectedSubject ? selectedSubject.name : '' }}"?</p>
            <p class="text-danger">Внимание! Это действие также удалит все оценки, связанные с этим предметом.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="deleteSubject">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Subjects',
  data() {
    return {
      subjectForm: {
        name: '',
        description: '',
        teacherIds: []
      },
      showAddSubjectModal: false,
      showDeleteModal: false,
      isEditing: false,
      selectedSubject: null
    }
  },
  computed: {
    ...mapGetters('auth', [
      'userRole'
    ]),
    ...mapGetters('users', [
      'getUsersByRole'
    ]),
    ...mapGetters('subjects', [
      'allSubjects',
      'subjectsLoading',
      'subjectsError'
    ]),
    subjects() {
      return this.allSubjects
    },
    teachers() {
      return this.getUsersByRole('teacher')
    },
    loading() {
      return this.subjectsLoading
    },
    error() {
      return this.subjectsError
    }
  },
  methods: {
    ...mapActions('users', [
      'fetchUsersByRole'
    ]),
    ...mapActions('subjects', [
      'fetchSubjects',
      'createSubject',
      'updateSubject',
      'removeSubject'
    ]),
    async loadData() {
      try {
        // Загрузка списка преподавателей (для админа)
        if (this.userRole === 'admin') {
          await this.fetchUsersByRole('teacher')
        }
        
        // Загрузка списка предметов
        await this.fetchSubjects()
      } catch (error) {
        console.error('Error loading data:', error)
      }
    },
    editSubject(subject) {
      this.isEditing = true
      this.selectedSubject = subject
      
      // Подготовка формы для редактирования
      this.subjectForm = {
        id: subject.id,
        name: subject.name,
        description: subject.description || '',
        teacherIds: subject.teachers ? subject.teachers.map(teacher => teacher.id) : []
      }
      
      this.showAddSubjectModal = true
    },
    confirmDeleteSubject(subject) {
      this.selectedSubject = subject
      this.showDeleteModal = true
    },
    closeSubjectModal() {
      this.showAddSubjectModal = false
      this.isEditing = false
      this.resetForm()
    },
    resetForm() {
      this.subjectForm = {
        name: '',
        description: '',
        teacherIds: []
      }
      this.selectedSubject = null
    },
    async saveSubject() {
      try {
        if (this.isEditing) {
          await this.updateSubject(this.subjectForm)
        } else {
          await this.createSubject(this.subjectForm)
        }
        
        this.closeSubjectModal()
        await this.fetchSubjects()
      } catch (error) {
        console.error('Error saving subject:', error)
      }
    },
    async deleteSubject() {
      try {
        await this.removeSubject(this.selectedSubject.id)
        this.showDeleteModal = false
        await this.fetchSubjects()
      } catch (error) {
        console.error('Error deleting subject:', error)
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>