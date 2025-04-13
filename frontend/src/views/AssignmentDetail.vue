<template>
  <div class="assignment-detail-container">
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
    
    <!-- Содержимое задания -->
    <div v-if="assignment && !loading" class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <span :class="getAssignmentTypeClass(assignment.type)" class="me-2">
            {{ assignment.type === 'task' ? 'Задание' : 'Тест' }}
          </span>
          <span v-if="userRole !== 'student'" :class="getStatusBadgeClass(assignment.status)">
            {{ assignment.status === 'draft' ? 'Черновик' : 'Опубликовано' }}
          </span>
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i> Назад
        </button>
      </div>
      
      <div class="card-body">
        <h2 class="card-title mb-3">{{ assignment.title }}</h2>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <p class="mb-1"><strong>Предмет:</strong> {{ assignment.subject ? assignment.subject.name : 'Не указан' }}</p>
            <p class="mb-1"><strong>Максимальный балл:</strong> {{ assignment.maxScore }}</p>
            <p class="mb-1" v-if="assignment.dueDate">
              <strong>Срок сдачи:</strong> {{ formatDate(assignment.dueDate) }}
              <span v-if="isPastDue(assignment.dueDate)" class="text-danger ms-2">(Срок истек)</span>
            </p>
          </div>
          
          <div class="col-md-6" v-if="userRole !== 'student'">
            <p class="mb-1"><strong>Группы:</strong> 
              <span v-if="assignment.groups && assignment.groups.length">
                {{ assignment.groups.map(g => g.name).join(', ') }}
              </span>
              <span v-else>Не указаны</span>
            </p>
            <p class="mb-1" v-if="userRole === 'admin'">
              <strong>Преподаватель:</strong> 
              {{ assignment.teacher ? `${assignment.teacher.lastName} ${assignment.teacher.firstName} ${assignment.teacher.middleName || ''}` : 'Не указан' }}
            </p>
            <p class="mb-1"><strong>Создано:</strong> {{ formatDate(assignment.createdAt) }}</p>
          </div>
        </div>
        
        <div class="assignment-description mb-4">
          <h5>Описание задания</h5>
          <div class="p-3 bg-light rounded">
            <p class="white-space-pre-wrap">{{ assignment.description }}</p>
          </div>
        </div>
        
        <!-- Для студента - форма отправки ответа -->
        <div v-if="userRole === 'student'" class="student-submission mt-4">
          <h5>Ваш ответ</h5>
          
          <!-- Если есть ответ и он оценен -->
          <div v-if="submission && submission.status === 'graded'" class="submission-graded mb-3">
            <div class="alert alert-success">
              <h6 class="alert-heading">Задание проверено</h6>
              <p class="mb-1"><strong>Оценка:</strong> {{ submission.score }} из {{ assignment.maxScore }}</p>
              <p class="mb-1" v-if="submission.feedback"><strong>Комментарий преподавателя:</strong></p>
              <p class="mb-0 white-space-pre-wrap" v-if="submission.feedback">{{ submission.feedback }}</p>
            </div>
            
            <div class="p-3 bg-light rounded mb-3">
              <h6>Ваш ответ:</h6>
              <p class="white-space-pre-wrap">{{ submission.answer }}</p>
            </div>
          </div>
          
          <!-- Если есть ответ, но он еще не оценен -->
          <div v-else-if="submission && submission.status === 'submitted'" class="submission-pending mb-3">
            <div class="alert alert-info">
              <h6 class="alert-heading">Ответ отправлен</h6>
              <p class="mb-0">Ваш ответ отправлен и ожидает проверки преподавателем.</p>
            </div>
            
            <div class="p-3 bg-light rounded mb-3">
              <h6>Ваш ответ:</h6>
              <p class="white-space-pre-wrap">{{ submission.answer }}</p>
            </div>
          </div>
          
          <!-- Если нет ответа или срок сдачи истек -->
          <form v-else @submit.prevent="submitAnswer" class="submission-form">
            <div class="mb-3">
              <textarea 
                class="form-control" 
                rows="6" 
                v-model="answerText" 
                placeholder="Введите ваш ответ здесь..."
                :disabled="isPastDue(assignment.dueDate)"
                required
              ></textarea>
            </div>
            
            <div v-if="isPastDue(assignment.dueDate)" class="alert alert-warning mb-3">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Срок сдачи задания истек. Отправка ответа невозможна.
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="isPastDue(assignment.dueDate) || submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Отправить ответ
            </button>
          </form>
        </div>
        
        <!-- Для преподавателя - список ответов студентов -->
        <div v-if="userRole === 'teacher' || userRole === 'admin'" class="teacher-view mt-4">
          <h5>Ответы студентов</h5>
          
          <div v-if="submissions.length === 0" class="alert alert-info">
            Пока нет ответов от студентов.
          </div>
          
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Дата отправки</th>
                  <th>Статус</th>
                  <th>Оценка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in submissions" :key="sub.id">
                  <td>{{ sub.student ? `${sub.student.lastName} ${sub.student.firstName} ${sub.student.middleName || ''}` : 'Неизвестно' }}</td>
                  <td>{{ formatDate(sub.submittedAt) }}</td>
                  <td>
                    <span :class="getSubmissionStatusBadgeClass(sub.status)">
                      {{ getSubmissionStatusText(sub.status) }}
                    </span>
                  </td>
                  <td>{{ sub.score !== null ? `${sub.score} / ${assignment.maxScore}` : '-' }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewSubmission(sub)">
                      {{ sub.status === 'graded' ? 'Просмотреть' : 'Проверить' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Кнопки управления для преподавателя -->
      <div v-if="(userRole === 'teacher' || userRole === 'admin') && assignment.teacherId === currentUser.id" class="card-footer d-flex justify-content-end gap-2">
        <button class="btn btn-outline-secondary" @click="editAssignment">
          <i class="bi bi-pencil me-1"></i> Редактировать
        </button>
        <button 
          v-if="assignment.status === 'draft'" 
          class="btn btn-success" 
          @click="publishAssignment"
        >
          <i class="bi bi-check-circle me-1"></i> Опубликовать
        </button>
      </div>
    </div>
    
    <!-- Модальное окно для просмотра и оценки ответа -->
    <div class="modal fade" id="submissionModal" tabindex="-1" aria-labelledby="submissionModalLabel" aria-hidden="true" v-if="showSubmissionModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="submissionModalLabel">Ответ студента</h5>
            <button type="button" class="btn-close" @click="showSubmissionModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedSubmission">
            <div class="mb-3">
              <h6>Студент:</h6>
              <p>{{ selectedSubmission.student ? `${selectedSubmission.student.lastName} ${selectedSubmission.student.firstName} ${selectedSubmission.student.middleName || ''}` : 'Неизвестно' }}</p>
            </div>
            
            <div class="mb-3">
              <h6>Дата отправки:</h6>
              <p>{{ formatDate(selectedSubmission.submittedAt) }}</p>
            </div>
            
            <div class="mb-3">
              <h6>Ответ студента:</h6>
              <div class="p-3 bg-light rounded">
                <p class="white-space-pre-wrap">{{ selectedSubmission.answer }}</p>
              </div>
            </div>
            
            <form @submit.prevent="gradeSubmission">
              <div class="mb-3">
                <label for="score" class="form-label">Оценка (максимум {{ assignment.maxScore }} баллов):</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="score" 
                  v-model="gradeForm.score" 
                  :min="0" 
                  :max="assignment.maxScore" 
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="feedback" class="form-label">Комментарий к оценке:</label>
                <textarea 
                  class="form-control" 
                  id="feedback" 
                  rows="4" 
                  v-model="gradeForm.feedback"
                  placeholder="Напишите комментарий к оценке (необязательно)"
                ></textarea>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showSubmissionModal = false">Закрыть</button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="grading"
                >
                  <span v-if="grading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Сохранить оценку
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'AssignmentDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // Состояние компонента
    const assignment = ref(null)
    const submissions = ref([])
    const submission = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const answerText = ref('')
    const submitting = ref(false)
    const showSubmissionModal = ref(false)
    const selectedSubmission = ref(null)
    const grading = ref(false)
    const gradeForm = ref({
      score: 0,
      feedback: ''
    })
    
    // Методы
    const goBack = () => {
      router.push('/assignments')
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    
    const isPastDue = (dueDate) => {
      if (!dueDate) return false
      return new Date() > new Date(dueDate)
    }
    
    const getAssignmentTypeClass = (type) => {
      return type === 'task' ? 'badge bg-primary' : 'badge bg-info text-dark'
    }
    
    const getStatusBadgeClass = (status) => {
      return status === 'draft' ? 'badge bg-secondary' : 'badge bg-success'
    }
    
    const getSubmissionStatusBadgeClass = (status) => {
      switch (status) {
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
    
    const getSubmissionStatusText = (status) => {
      switch (status) {
        case 'not_submitted':
          return 'Не выполнено'
        case 'submitted':
          return 'На проверке'
        case 'graded':
          return 'Проверено'
        default:
          return 'Неизвестно'
      }
    }
    
    const viewSubmission = (sub) => {
      selectedSubmission.value = sub
      gradeForm.value.score = sub.score !== null ? sub.score : 0
      gradeForm.value.feedback = sub.feedback || ''
      showSubmissionModal.value = true
    }
    
    const editAssignment = () => {
      router.push(`/assignments/edit/${assignment.value.id}`)
    }
    
    return {
      assignment,
      submissions,
      submission,
      loading,
      error,
      answerText,
      submitting,
      showSubmissionModal,
      selectedSubmission,
      grading,
      gradeForm,
      goBack,
      formatDate,
      isPastDue,
      getAssignmentTypeClass,
      getStatusBadgeClass,
      getSubmissionStatusBadgeClass,
      getSubmissionStatusText,
      viewSubmission,
      editAssignment
    }
  },
  computed: {
    ...mapGetters('auth', ['userRole', 'currentUser']),
    assignmentId() {
      return this.$route.params.id
    }
  },
  methods: {
    ...mapActions('assignments', [
      'fetchAssignment',
      'submitAssignment',
      'fetchSubmissions',
      'fetchStudentSubmissions',
      'gradeSubmission',
      'updateAssignment'
    ]),
    
    async loadAssignment() {
      this.loading = true
      this.error = null
      
      try {
        // Загрузка задания
        const assignmentData = await this.fetchAssignment(this.assignmentId)
        this.assignment = assignmentData
        
        // Загрузка ответов в зависимости от роли
        if (this.userRole === 'teacher' || this.userRole === 'admin') {
          // Для преподавателя - загрузка всех ответов на это задание
          const submissionsData = await this.fetchSubmissions()
          this.submissions = submissionsData.filter(s => s.assignmentId === this.assignmentId)
        } else if (this.userRole === 'student') {
          // Для студента - загрузка своего ответа
          const submissionsData = await this.fetchStudentSubmissions()
          const studentSubmission = submissionsData.find(s => s.assignmentId === this.assignmentId)
          if (studentSubmission) {
            this.submission = studentSubmission
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке задания:', error)
        this.error = 'Не удалось загрузить задание. Пожалуйста, попробуйте позже.'
      } finally {
        this.loading = false
      }
    },
    
    async submitAnswer() {
      if (!this.answerText.trim()) {
        return
      }
      
      this.submitting = true
      
      try {
        const result = await this.submitAssignment({
          assignmentId: this.assignmentId,
          answer: this.answerText
        })
        
        this.submission = result
        this.answerText = ''
        this.$toast.success('Ответ успешно отправлен')
      } catch (error) {
        console.error('Ошибка при отправке ответа:', error)
        this.$toast.error('Не удалось отправить ответ. Пожалуйста, попробуйте позже.')
      } finally {
        this.submitting = false
      }
    },
    
    async gradeSubmission() {
      if (this.gradeForm.score < 0 || this.gradeForm.score > this.assignment.maxScore) {
        this.$toast.error(`Оценка должна быть от 0 до ${this.assignment.maxScore} баллов`)
        return
      }
      
      this.grading = true
      
      try {
        const result = await this.gradeSubmission({
          submissionId: this.selectedSubmission.id,
          score: this.gradeForm.score,
          feedback: this.gradeForm.feedback
        })
        
        // Обновление списка ответов
        const index = this.submissions.findIndex(s => s.id === result.id)
        if (index !== -1) {
          this.submissions.splice(index, 1, result)
        }
        
        this.showSubmissionModal = false
        this.$toast.success('Ответ успешно оценен')
      } catch (error) {
        console.error('Ошибка при оценивании ответа:', error)
        this.$toast.error('Не удалось сохранить оценку. Пожалуйста, попробуйте позже.')
      } finally {
        this.grading = false
      }
    },
    
    async publishAssignment() {
      try {
        await this.updateAssignment({
          id: this.assignmentId,
          assignmentData: { status: 'published' }
        })
        
        this.assignment.status = 'published'
        this.$toast.success('Задание успешно опубликовано')
      } catch (error) {
        console.error('Ошибка при публикации задания:', error)
        this.$toast.error('Не удалось опубликовать задание. Пожалуйста, попробуйте позже.')
      }
    }
  },
  mounted() {
    this.loadAssignment()
  },
  watch: {
    assignmentId() {
      this.loadAssignment()
    }
  }
}
</script>

<style scoped>
.assignment-detail-container {
  margin-bottom: 2rem;
}

.white-space-pre-wrap {
  white-space: pre-wrap;
}

.badge {
  font-size: 0.8rem;
  padding: 0.35em 0.65em;
}

.submission-form textarea {
  resize: vertical;
}

.modal-dialog {
  max-width: 700px;
}
</style>