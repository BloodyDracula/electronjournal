<template>
  <div class="attendance-container">
    <h1 class="mb-4">Учет посещаемости</h1>
    
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
    
    <!-- Календарь занятий -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">Календарь занятий</h5>
        
        <!-- Фильтры -->
        <div class="row g-3 mb-4">
          <!-- Фильтр по группе (для преподавателей и админов) -->
          <div class="col-md-3" v-if="userRole !== 'student'">
            <label for="groupFilter" class="form-label">Группа</label>
            <select class="form-select" id="groupFilter" v-model="filters.groupId">
              <option value="">Все группы</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
          
          <!-- Фильтр по предмету -->
          <div class="col-md-3">
            <label for="subjectFilter" class="form-label">Предмет</label>
            <select class="form-select" id="subjectFilter" v-model="filters.subjectId">
              <option value="">Все предметы</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
          
          <!-- Фильтр по месяцу -->
          <div class="col-md-3">
            <label for="monthFilter" class="form-label">Месяц</label>
            <select class="form-select" id="monthFilter" v-model="filters.month">
              <option value="0">Январь</option>
              <option value="1">Февраль</option>
              <option value="2">Март</option>
              <option value="3">Апрель</option>
              <option value="4">Май</option>
              <option value="5">Июнь</option>
              <option value="6">Июль</option>
              <option value="7">Август</option>
              <option value="8">Сентябрь</option>
              <option value="9">Октябрь</option>
              <option value="10">Ноябрь</option>
              <option value="11">Декабрь</option>
            </select>
          </div>
          
          <!-- Фильтр по году -->
          <div class="col-md-3">
            <label for="yearFilter" class="form-label">Год</label>
            <select class="form-select" id="yearFilter" v-model="filters.year">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Кнопка добавления занятия (только для преподавателей и админов) -->
        <div class="mb-4" v-if="userRole === 'admin' || userRole === 'teacher'">
          <button class="btn btn-success" @click="showAddLessonModal = true">
            <i class="bi bi-plus-circle me-2"></i> Добавить занятие
          </button>
        </div>
        
        <!-- Календарь -->
        <div class="calendar-container">
          <!-- Заголовок с днями недели -->
          <div class="calendar-header">
            <div class="calendar-cell header">Пн</div>
            <div class="calendar-cell header">Вт</div>
            <div class="calendar-cell header">Ср</div>
            <div class="calendar-cell header">Чт</div>
            <div class="calendar-cell header">Пт</div>
            <div class="calendar-cell header">Сб</div>
            <div class="calendar-cell header">Вс</div>
          </div>
          
          <!-- Сетка календаря -->
          <div class="calendar-grid">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index" 
              class="calendar-cell" 
              :class="{ 'other-month': day.otherMonth, 'today': day.isToday }"
            >
              <div class="day-number">{{ day.day }}</div>
              <div class="lessons-container">
                <div 
                  v-for="lesson in getLessonsForDay(day.fullDate)" 
                  :key="lesson.id" 
                  class="lesson-item"
                  @click="viewLesson(lesson)"
                >
                  <div class="lesson-time">{{ formatTime(lesson.startTime) }}</div>
                  <div class="lesson-title">{{ lesson.title }}</div>
                  <div class="lesson-subject">{{ lesson.subject.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно добавления/редактирования занятия -->
    <div class="modal fade" :class="{ 'show d-block': showAddLessonModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактирование занятия' : 'Добавление занятия' }}</h5>
            <button type="button" class="btn-close" @click="closeLessonModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLesson">
              <!-- Название занятия -->
              <div class="mb-3">
                <label for="title" class="form-label">Название занятия</label>
                <input type="text" class="form-control" id="title" v-model="lessonForm.title" required>
              </div>
              
              <!-- Дата -->
              <div class="mb-3">
                <label for="date" class="form-label">Дата</label>
                <input type="date" class="form-control" id="date" v-model="lessonForm.date" required>
              </div>
              
              <!-- Время начала -->
              <div class="mb-3">
                <label for="startTime" class="form-label">Время начала</label>
                <input type="time" class="form-control" id="startTime" v-model="lessonForm.startTime" required>
              </div>
              
              <!-- Время окончания -->
              <div class="mb-3">
                <label for="endTime" class="form-label">Время окончания</label>
                <input type="time" class="form-control" id="endTime" v-model="lessonForm.endTime" required>
              </div>
              
              <!-- Предмет -->
              <div class="mb-3">
                <label for="subjectId" class="form-label">Предмет</label>
                <select class="form-select" id="subjectId" v-model="lessonForm.subjectId" required>
                  <option value="">Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              
              <!-- Группа -->
              <div class="mb-3">
                <label for="groupId" class="form-label">Группа</label>
                <select class="form-select" id="groupId" v-model="lessonForm.groupId" required>
                  <option value="">Выберите группу</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
              
              <!-- Описание -->
              <div class="mb-3">
                <label for="description" class="form-label">Описание</label>
                <textarea class="form-control" id="description" v-model="lessonForm.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeLessonModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveLesson">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно просмотра занятия и отметки посещаемости -->
    <div class="modal fade" :class="{ 'show d-block': showLessonModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Информация о занятии</h5>
            <button type="button" class="btn-close" @click="showLessonModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedLesson">
            <div class="lesson-details mb-4">
              <h4>{{ selectedLesson.title }}</h4>
              <p><strong>Дата:</strong> {{ formatDate(selectedLesson.date) }}</p>
              <p><strong>Время:</strong> {{ formatTime(selectedLesson.startTime) }} - {{ formatTime(selectedLesson.endTime) }}</p>
              <p><strong>Предмет:</strong> {{ selectedLesson.subject.name }}</p>
              <p><strong>Группа:</strong> {{ selectedLesson.group.name }}</p>
              <p><strong>Преподаватель:</strong> {{ selectedLesson.teacher.lastName }} {{ selectedLesson.teacher.firstName }}</p>
              <p v-if="selectedLesson.description"><strong>Описание:</strong> {{ selectedLesson.description }}</p>
            </div>
            
            <!-- Таблица посещаемости (только для преподавателей и админов) -->
            <div v-if="userRole === 'admin' || (userRole === 'teacher' && selectedLesson.teacherId === currentUser.id)">
              <h5 class="mb-3">Отметка посещаемости</h5>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-primary">
                    <tr>
                      <th>Студент</th>
                      <th>Статус</th>
                      <th>Комментарий</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="attendance in attendances" :key="attendance.id">
                      <td>{{ attendance.student.lastName }} {{ attendance.student.firstName }} {{ attendance.student.middleName }}</td>
                      <td>
                        <select class="form-select form-select-sm" v-model="attendance.status">
                          <option value="present">Присутствует</option>
                          <option value="absent">Отсутствует</option>
                          <option value="late">Опоздал</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm" v-model="attendance.comment" placeholder="Комментарий">
                      </td>
                      <td>
                        <button class="btn btn-sm btn-primary" @click="saveAttendance(attendance)">
                          <i class="bi bi-check"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="d-flex justify-content-end mt-3">
                <button class="btn btn-success" @click="saveAllAttendances">Сохранить все</button>
              </div>
            </div>
            
            <!-- Информация о посещаемости для студента -->
            <div v-else-if="userRole === 'student' && studentAttendance">
              <h5 class="mb-3">Ваша посещаемость</h5>
              <p>
                <strong>Статус:</strong> 
                <span :class="getAttendanceStatusClass(studentAttendance.status)">
                  {{ getAttendanceStatusText(studentAttendance.status) }}
                </span>
              </p>
              <p v-if="studentAttendance.comment"><strong>Комментарий:</strong> {{ studentAttendance.comment }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showLessonModal = false">Закрыть</button>
            <button 
              v-if="userRole === 'admin' || (userRole === 'teacher' && selectedLesson && selectedLesson.teacherId === currentUser.id)" 
              type="button" 
              class="btn btn-primary" 
              @click="editLesson(selectedLesson)"
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Фоновая подложка для модальных окон -->
    <div class="modal-backdrop fade show" v-if="showAddLessonModal || showLessonModal"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Attendance',
  data() {
    const currentDate = new Date()
    return {
      filters: {
        groupId: '',
        subjectId: '',
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      },
      lessonForm: {
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:30',
        endTime: '10:00',
        description: '',
        subjectId: '',
        groupId: ''
      },
      showAddLessonModal: false,
      showLessonModal: false,
      isEditing: false,
      selectedLesson: null,
      attendances: [],
      studentAttendance: null
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
    ...mapGetters('groups', [
      'allGroups'
    ]),
    ...mapGetters('lessons', [
      'allLessons',
      'isLoading',
      'error',
      'getLessonsByDate'
    ]),
    ...mapGetters('attendance', [
      'allAttendances',
      'studentAttendance'
    ]),
    loading() {
      return this.isLoading
    },
    students() {
      return this.getUsersByRole('student')
    },
    groups() {
      return this.allGroups
    },
    subjects() {
      return this.allSubjects
    },
    availableYears() {
      const currentYear = new Date().getFullYear()
      return [currentYear - 1, currentYear, currentYear + 1]
    },
    calendarDays() {
      const year = parseInt(this.filters.year)
      const month = parseInt(this.filters.month)
      
      // Получаем первый день месяца
      const firstDay = new Date(year, month, 1)
      // Получаем последний день месяца
      const lastDay = new Date(year, month + 1, 0)
      
      // Определяем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, ...)
      let firstDayOfWeek = firstDay.getDay()
      // Преобразуем, чтобы понедельник был 0, воскресенье - 6
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      
      const days = []
      
      // Добавляем дни предыдущего месяца
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      for (let i = 0; i < firstDayOfWeek; i++) {
        const day = prevMonthLastDay - firstDayOfWeek + i + 1
        const date = new Date(year, month - 1, day)
        days.push({
          day,
          fullDate: date,
          otherMonth: true,
          isToday: this.isToday(date)
        })
      }
      
      // Добавляем дни текущего месяца
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i)
        days.push({
          day: i,
          fullDate: date,
          otherMonth: false,
          isToday: this.isToday(date)
        })
      }
      
      // Добавляем дни следующего месяца
      const remainingDays = 42 - days.length // 6 недель по 7 дней
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i)
        days.push({
          day: i,
          fullDate: date,
          otherMonth: true,
          isToday: this.isToday(date)
        })
      }
      
      return days
    }
  },
  methods: {
    ...mapActions('users', [
      'fetchUsersByRole'
    ]),
    ...mapActions('subjects', [
      'fetchSubjects'
    ]),
    ...mapActions('groups', [
      'fetchGroups'
    ]),
    ...mapActions('lessons', [
      'fetchLessons',
      'fetchLesson',
      'createLesson',
      'updateLesson',
      'deleteLesson'
    ]),
    ...mapActions('attendance', [
      'fetchAttendancesByLesson',
      'updateAttendance',
      'bulkUpdateAttendances'
    ]),
    isToday(date) {
      const today = new Date()
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear()
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU')
    },
    formatTime(timeString) {
      return timeString.substring(0, 5) // Обрезаем до формата HH:MM
    },
    getLessonsForDay(date) {
      // Используем геттер из модуля lessons
      return this.getLessonsByDate(date).filter(lesson => {
        // Применяем фильтр по группе
        if (this.filters.groupId && lesson.groupId !== parseInt(this.filters.groupId)) return false
        
        // Применяем фильтр по предмету
        if (this.filters.subjectId && lesson.subjectId !== parseInt(this.filters.subjectId)) return false
        
        return true
      })
    },
    async loadData() {
      try {
        // Загрузка списка студентов (для преподавателей и админов)
        if (this.userRole !== 'student') {
          await this.fetchUsersByRole('student')
        }
        
        // Загрузка списка предметов и групп
        await this.fetchSubjects()
        await this.fetchGroups()
        
        // Загрузка занятий
        await this.fetchLessons()
      } catch (error) {
        console.error('Error loading data:', error)
      }
    },
    async viewLesson(lesson) {
      try {
        // Загружаем полную информацию о занятии
        const lessonData = await this.fetchLesson(lesson.id)
        this.selectedLesson = lessonData
        
        // Загружаем информацию о посещаемости
        const attendancesData = await this.fetchAttendancesByLesson(lesson.id)
        
        if (this.userRole === 'student') {
          // Для студента находим его запись о посещаемости
          this.studentAttendance = attendancesData.find(a => a.studentId === this.currentUser.id) || null
        } else {
          // Для преподавателя и админа показываем все записи
          this.attendances = attendancesData
        }
        
        this.showLessonModal = true
      } catch (error) {
        console.error('Error viewing lesson:', error)
      }
    },
    editLesson(lesson) {
      this.isEditing = true
      this.lessonForm = {
        id: lesson.id,
        title: lesson.title,
        date: new Date(lesson.date).toISOString().split('T')[0],
        startTime: lesson.startTime.substring(0, 5),
        endTime: lesson.endTime.substring(0, 5),
        description: lesson.description || '',
        subjectId: lesson.subject.id,
        groupId: lesson.group.id
      }
      this.showLessonModal = false
      this.showAddLessonModal = true
    },
    closeLessonModal() {
      this.showAddLessonModal = false
      this.isEditing = false
      this.resetForm()
    },
    resetForm() {
      this.lessonForm = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:30',
        endTime: '10:00',
        description: '',
        subjectId: '',
        groupId: ''
      }
    },
    async saveLesson() {
      try {
        if (this.isEditing) {
          // Обновление существующего занятия
          await this.updateLesson({
            id: this.lessonForm.id,
            lessonData: {
              title: this.lessonForm.title,
              date: this.lessonForm.date,
              startTime: this.lessonForm.startTime,
              endTime: this.lessonForm.endTime,
              description: this.lessonForm.description,
              subjectId: parseInt(this.lessonForm.subjectId),
              groupId: parseInt(this.lessonForm.groupId)
            }
          })
        } else {
          // Создание нового занятия
          await this.createLesson({
            title: this.lessonForm.title,
            date: this.lessonForm.date,
            startTime: this.lessonForm.startTime,
            endTime: this.lessonForm.endTime,
            description: this.lessonForm.description,
            subjectId: parseInt(this.lessonForm.subjectId),
            groupId: parseInt(this.lessonForm.groupId),
            teacherId: this.currentUser.id
          })
        }
        
        this.closeLessonModal()
        
        // Перезагрузка данных
        await this.fetchLessons()
      } catch (error) {
        console.error('Error saving lesson:', error)
      }
    },
    async saveAttendance(attendance) {
      try {
        await this.updateAttendance({
          id: attendance.id,
          status: attendance.status,
          comment: attendance.comment
        })
      } catch (error) {
        console.error('Error saving attendance:', error)
      }
    },
    async saveAllAttendances() {
      try {
        // Подготавливаем данные для массового обновления
        const attendancesToUpdate = this.attendances.map(attendance => ({
          id: attendance.id,
          status: attendance.status,
          comment: attendance.comment
        }))
        
        // Проверяем, что у нас есть данные для обновления
        if (!attendancesToUpdate.length) {
          this.$store.commit('attendance/setError', 'Нет данных для обновления посещаемости')
          return
        }
        
        await this.bulkUpdateAttendances(attendancesToUpdate)
        
        // Показываем сообщение об успешном сохранении
        this.$store.commit('attendance/setError', null)
        alert('Данные о посещаемости успешно сохранены')
      } catch (error) {
        console.error('Error saving all attendances:', error)
        // Отображаем ошибку пользователю
        const errorMessage = error.response?.data?.message || 'Ошибка при сохранении данных о посещаемости'
        this.$store.commit('attendance/setError', errorMessage)
      }
    },
    getAttendanceStatusText(status) {
      switch (status) {
        case 'present': return 'Присутствовал'
        case 'absent': return 'Отсутствовал'
        case 'late': return 'Опоздал'
        default: return 'Неизвестно'
      }
    },
    getAttendanceStatusClass(status) {
      switch (status) {
        case 'present': return 'text-success'
        case 'absent': return 'text-danger'
        case 'late': return 'text-warning'
        default: return ''
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

.calendar-container {
  margin-top: 20px;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  background-color: #f8f9fa;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  border: 1px solid #dee2e6;
}

.calendar-cell {
  min-height: 100px;
  border: 1px solid #dee2e6;
  padding: 5px;
  position: relative;
}

.calendar-cell.header {
  min-height: auto;
  padding: 10px;
}

.calendar-cell.other-month {
  background-color: #f8f9fa;
  color: #6c757d;
}

.calendar-cell.today {
  background-color: #e8f4ff;
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
}

.lessons-container {
  overflow-y: auto;
  max-height: 80px;
}

.lesson-item {
  background-color: #e9ecef;
  border-radius: 4px;
  padding: 4px;
  margin-bottom: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lesson-item:hover {
  background-color: #dee2e6;
}

.lesson-time {
  font-weight: bold;
  font-size: 0.7rem;
}

.lesson-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-subject {
  font-size: 0.7rem;
  color: #6c757d;
}
</style>