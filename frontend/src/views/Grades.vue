<template>
  <div class="grades-container">
    <h1 class="mb-4">Управление оценками</h1>
    
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
    
    <!-- Фильтры -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">Фильтры</h5>
        <div class="row g-3">
          <!-- Фильтр по студенту (только для преподавателей и админов) -->
          <div class="col-md-4" v-if="userRole !== 'student'">
            <label for="studentFilter" class="form-label">Студент</label>
            <select class="form-select" id="studentFilter" v-model="filters.studentId">
              <option value="">Все студенты</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.lastName }} {{ student.firstName }} {{ student.middleName }}
              </option>
            </select>
          </div>
          
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
          
          <!-- Фильтр по дате -->
          <div class="col-md-4">
            <label for="dateFilter" class="form-label">Период</label>
            <select class="form-select" id="dateFilter" v-model="filters.period">
              <option value="all">Весь период</option>
              <option value="week">Последняя неделя</option>
              <option value="month">Последний месяц</option>
              <option value="semester">Текущий семестр</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Кнопка добавления оценки (только для преподавателей и админов) -->
    <div class="mb-4" v-if="userRole === 'admin' || userRole === 'teacher'">
      <button class="btn btn-success" @click="showAddGradeModal = true">
        <i class="bi bi-plus-circle me-2"></i> Добавить оценку
      </button>
    </div>
    
    <!-- Таблица оценок -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-primary">
          <tr>
            <th>Дата</th>
            <th v-if="userRole !== 'student'">Студент</th>
            <th>Предмет</th>
            <th>Оценка</th>
            <th>Преподаватель</th>
            <th>Комментарий</th>
            <th v-if="userRole === 'admin' || userRole === 'teacher'">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grade in filteredGrades" :key="grade.id">
            <td>{{ formatDate(grade.date) }}</td>
            <td v-if="userRole !== 'student'">{{ grade.student.lastName }} {{ grade.student.firstName }}</td>
            <td>{{ grade.subject.name }}</td>
            <td>
              <span class="badge" :class="getGradeClass(grade.value)">{{ grade.value }}</span>
            </td>
            <td>{{ grade.teacher.lastName }} {{ grade.teacher.firstName }}</td>
            <td>{{ grade.comment || '-' }}</td>
            <td v-if="userRole === 'admin' || (userRole === 'teacher' && grade.teacherId === currentUser.id)">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-primary" @click="editGrade(grade)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger" @click="confirmDeleteGrade(grade)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredGrades.length === 0">
            <td :colspan="userRole !== 'student' ? 7 : 6" class="text-center py-3">
              Оценки не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно добавления/редактирования оценки -->
    <div class="modal fade" :class="{ 'show d-block': showAddGradeModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактирование оценки' : 'Добавление оценки' }}</h5>
            <button type="button" class="btn-close" @click="closeGradeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveGrade">
              <!-- Выбор студента -->
              <div class="mb-3">
                <label for="student" class="form-label">Студент</label>
                <select class="form-select" id="student" v-model="gradeForm.studentId" required>
                  <option value="" disabled>Выберите студента</option>
                  <option v-for="student in students" :key="student.id" :value="student.id">
                    {{ student.lastName }} {{ student.firstName }} {{ student.middleName }}
                  </option>
                </select>
              </div>
              
              <!-- Выбор предмета -->
              <div class="mb-3">
                <label for="subject" class="form-label">Предмет</label>
                <select class="form-select" id="subject" v-model="gradeForm.subjectId" required>
                  <option value="" disabled>Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              
              <!-- Значение оценки -->
              <div class="mb-3">
                <label for="value" class="form-label">Оценка</label>
                <select class="form-select" id="value" v-model="gradeForm.value" required>
                  <option value="" disabled>Выберите оценку</option>
                  <option value="5">5 (Отлично)</option>
                  <option value="4">4 (Хорошо)</option>
                  <option value="3">3 (Удовлетворительно)</option>
                  <option value="2">2 (Неудовлетворительно)</option>
                  <option value="1">1 (Плохо)</option>
                </select>
              </div>
              
              <!-- Дата -->
              <div class="mb-3">
                <label for="date" class="form-label">Дата</label>
                <input type="date" class="form-control" id="date" v-model="gradeForm.date" required>
              </div>
              
              <!-- Комментарий -->
              <div class="mb-3">
                <label for="comment" class="form-label">Комментарий</label>
                <textarea class="form-control" id="comment" v-model="gradeForm.comment" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeGradeModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveGrade">Сохранить</button>
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
            <p>Вы действительно хотите удалить эту оценку?</p>
            <p v-if="selectedGrade">
              <strong>Студент:</strong> {{ selectedGrade.student.lastName }} {{ selectedGrade.student.firstName }}<br>
              <strong>Предмет:</strong> {{ selectedGrade.subject.name }}<br>
              <strong>Оценка:</strong> {{ selectedGrade.value }}<br>
              <strong>Дата:</strong> {{ formatDate(selectedGrade.date) }}
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="deleteGrade">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Grades',
  data() {
    return {
      filters: {
        studentId: this.$route.query.studentId || '',
        subjectId: '',
        period: 'all'
      },
      gradeForm: {
        studentId: '',
        subjectId: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        comment: ''
      },
      showAddGradeModal: false,
      showDeleteModal: false,
      isEditing: false,
      selectedGrade: null
    }
  },
  computed: {
    ...mapGetters('auth', [
      'userRole',
      'currentUser'
    ]),
    ...mapGetters('users', [
      'getUsersByRole'
    ]),
    ...mapGetters('subjects', [
      'allSubjects'
    ]),
    ...mapGetters('grades', [
      'allGrades',
      'studentGrades',
      'gradesLoading',
      'gradesError'
    ]),
    students() {
      return this.getUsersByRole('student')
    },
    subjects() {
      return this.allSubjects
    },
    loading() {
      return this.gradesLoading
    },
    error() {
      return this.gradesError
    },
    filteredGrades() {
      let grades = this.userRole === 'student' ? this.studentGrades : this.allGrades
      
      // Фильтр по студенту
      if (this.filters.studentId) {
        grades = grades.filter(grade => grade.studentId === parseInt(this.filters.studentId))
      }
      
      // Фильтр по предмету
      if (this.filters.subjectId) {
        grades = grades.filter(grade => grade.subjectId === parseInt(this.filters.subjectId))
      }
      
      // Фильтр по периоду
      if (this.filters.period !== 'all') {
        const now = new Date()
        let startDate
        
        switch (this.filters.period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            break
          case 'semester':
            // Примерно определяем текущий семестр (с сентября или с февраля)
            const month = now.getMonth() + 1
            if (month >= 9 || month <= 1) {
              // Осенний семестр (сентябрь - январь)
              startDate = new Date(month >= 9 ? now.getFullYear() : now.getFullYear() - 1, 8, 1)
            } else {
              // Весенний семестр (февраль - июнь)
              startDate = new Date(now.getFullYear(), 1, 1)
            }
            break
        }
        
        if (startDate) {
          grades = grades.filter(grade => new Date(grade.date) >= startDate)
        }
      }
      
      // Сортировка по дате (сначала новые)
      return grades.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  },
  methods: {
    ...mapActions('users', [
      'fetchUsersByRole'
    ]),
    ...mapActions('subjects', [
      'fetchSubjects'
    ]),
    ...mapActions('grades', [
      'fetchGrades',
      'fetchStudentGrades',
      'createGrade',
      'updateGrade',
      'removeGrade'
    ]),
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU')
    },
    getGradeClass(value) {
      const valueNum = parseInt(value)
      switch (valueNum) {
        case 5: return 'bg-success'
        case 4: return 'bg-primary'
        case 3: return 'bg-warning text-dark'
        default: return 'bg-danger'
      }
    },
    async loadData() {
      try {
        // Загрузка списка студентов (для преподавателей и админов)
        if (this.userRole !== 'student') {
          await this.fetchUsersByRole('student')
        }
        
        // Загрузка списка предметов
        await this.fetchSubjects()
        
        // Загрузка оценок в зависимости от роли
        if (this.userRole === 'student') {
          await this.fetchStudentGrades(this.currentUser.id)
        } else {
          // Если передан studentId в URL, загружаем оценки конкретного студента
          if (this.filters.studentId) {
            await this.fetchStudentGrades(this.filters.studentId)
          } else {
            await this.fetchGrades()
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    },
    editGrade(grade) {
      this.isEditing = true
      this.selectedGrade = grade
      this.gradeForm = {
        id: grade.id,
        studentId: grade.studentId,
        subjectId: grade.subjectId,
        value: grade.value.toString(),
        date: new Date(grade.date).toISOString().split('T')[0],
        comment: grade.comment || ''
      }
      this.showAddGradeModal = true
    },
    confirmDeleteGrade(grade) {
      this.selectedGrade = grade
      this.showDeleteModal = true
    },
    closeGradeModal() {
      this.showAddGradeModal = false
      this.isEditing = false
      this.resetForm()
    },
    resetForm() {
      this.gradeForm = {
        studentId: '',
        subjectId: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        comment: ''
      }
      this.selectedGrade = null
    },
    async saveGrade() {
      try {
        // Преобразование значений
        const gradeData = {
          ...this.gradeForm,
          studentId: parseInt(this.gradeForm.studentId),
          subjectId: parseInt(this.gradeForm.subjectId),
          value: parseInt(this.gradeForm.value)
        }
        
        if (this.isEditing) {
          // При редактировании передаем id оценки и данные оценки
          await this.updateGrade({ id: this.selectedGrade.id, gradeData })
        } else {
          await this.createGrade(gradeData)
        }
        
        this.closeGradeModal()
        
        // Перезагрузка данных
        if (this.userRole === 'student') {
          await this.fetchStudentGrades(this.currentUser.id)
        } else if (this.filters.studentId) {
          await this.fetchStudentGrades(this.filters.studentId)
        } else {
          await this.fetchGrades()
        }
      } catch (error) {
        console.error('Error saving grade:', error)
      }
    },
    async deleteGrade() {
      try {
        await this.removeGrade(this.selectedGrade.id)
        this.showDeleteModal = false
        
        // Перезагрузка данных
        if (this.userRole === 'student') {
          await this.fetchStudentGrades(this.currentUser.id)
        } else if (this.filters.studentId) {
          await this.fetchStudentGrades(this.filters.studentId)
        } else {
          await this.fetchGrades()
        }
      } catch (error) {
        console.error('Error deleting grade:', error)
      }
    }
  },
  created() {
    this.loadData()
  },
  watch: {
    // Отслеживание изменений параметров URL
    '$route.query.studentId': function(newVal) {
      this.filters.studentId = newVal || ''
      this.loadData()
    }
  }
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.badge {
  font-size: 1rem;
  padding: 0.5rem 0.7rem;
}
</style>