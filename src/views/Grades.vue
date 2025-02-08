<template>
  <div class="grades">
    <h2>Grades</h2>

    <!-- Форма для фильтрации и сортировки -->
    <div class="mb-4">
      <h3>Filter and Sort</h3>
      <form @submit.prevent="applyFilters">
        <div class="row">
          <div class="col-md-3">
            <label for="studentName" class="form-label">Student Surname:</label>
            <input
                type="text"
                id="studentName"
                v-model="filters.studentName"
                class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label for="subjectName" class="form-label">Subject Name:</label>
            <input
                type="text"
                id="subjectName"
                v-model="filters.subjectName"
                class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label for="sortBy" class="form-label">Sort By:</label>
            <select
                id="sortBy"
                v-model="filters.sortBy"
                class="form-select"
            >
              <option value="grade">Grade</option>
              <option value="createdAt">Date</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="sortOrder" class="form-label">Sort Order:</label>
            <select
                id="sortOrder"
                v-model="filters.sortOrder"
                class="form-select"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary mt-3">Apply Filters</button>
      </form>
    </div>

    <!-- Форма для создания новой оценки (только преподаватели) -->
    <div v-if="isTeacher" class="mb-4">
      <h3>Create New Grade</h3>
      <form @submit.prevent="createGrade">
        <div class="mb-3">
          <label for="gradeValue" class="form-label">Grade:</label>
          <input
              type="number"
              id="gradeValue"
              v-model="newGrade.grade"
              class="form-control"
              min="1"
              max="5"
              required
          />
        </div>
        <div class="mb-3">
          <label for="gradeStudentId" class="form-label">Student:</label>
          <select
              id="gradeStudentId"
              v-model="newGrade.studentId"
              class="form-select"
              required
          >
            <option :value="null">Select a student</option>
            <option
                v-for="student in students"
                :key="student.id"
                :value="student.id"
            >
              {{ student.name }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label for="gradeSubjectId" class="form-label">Subject:</label>
          <select
              id="gradeSubjectId"
              v-model="newGrade.subjectId"
              class="form-select"
              required
          >
            <option :value="null">Select a subject</option>
            <option
                v-for="subject in subjects"
                :key="subject.id"
                :value="subject.id"
            >
              {{ subject.name }}
            </option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Create Grade</button>
      </form>
    </div>

    <!-- Таблица со списком оценок -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Grade</th>
        <th>Student</th>
        <th>Subject</th>
        <th>Date</th>
        <th v-if="isTeacher">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="grade in filteredGrades" :key="grade.id">
        <td>{{ grade.id }}</td>
        <td>
          <span v-if="!grade.isEditing">{{ grade.grade }}</span>
          <input
              v-else
              type="number"
              v-model="grade.editedGrade"
              class="form-control"
              min="1"
              max="5"
          />
        </td>
        <td>{{ grade.Student?.name }}</td>
        <td>{{ grade.Subject?.name }}</td>
        <td>{{ new Date(grade.createdAt).toLocaleDateString() }}</td>
        <td v-if="isTeacher">
          <button
              v-if="!grade.isEditing"
              @click="startEdit(grade)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              v-else
              @click="saveEdit(grade)"
              class="btn btn-sm btn-success me-2"
          >
            Save
          </button>
          <button
              @click="deleteGrade(grade.id)"
              class="btn btn-sm btn-danger"
          >
            Delete
          </button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- Пагинация -->
    <nav>
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">Previous</button>
        </li>
        <li
            v-for="page in totalPages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
        >
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Next</button>
        </li>
      </ul>
    </nav>

    <!-- Средний балл -->
    <div class="mt-4">
      <h3>Average Grade</h3>
      <form @submit.prevent="fetchAverageGrade">
        <div class="row">
          <div class="col-md-3">
            <label for="averageStudentName" class="form-label">Student Surname:</label>
            <input
                type="text"
                id="averageStudentName"
                v-model="averageFilters.studentName"
                class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label for="averageSubjectName" class="form-label">Subject Name:</label>
            <input
                type="text"
                id="averageSubjectName"
                v-model="averageFilters.subjectName"
                class="form-control"
            />
          </div>
        </div>
        <button type="submit" class="btn btn-primary mt-3">Get Average</button>
      </form>
      <div v-if="averageGrade !== null" class="mt-3">
        <strong>Average Grade:</strong> {{ averageGrade }}
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api';

export default {
  data() {
    return {
      grades: [], // Список всех оценок
      students: [], // Список студентов
      subjects: [], // Список предметов
      newGrade: {
        grade: null,
        studentId: null,
        subjectId: null,
      },
      filters: {
        studentName: '', // Фильтр по фамилии студента
        subjectName: '', // Фильтр по названию предмета
        sortBy: 'grade', // Сортировка по оценке или дате
        sortOrder: 'ASC', // Порядок сортировки
      },
      averageFilters: {
        studentName: '', // Фильтр для среднего балла
        subjectName: '', // Фильтр для среднего балла
      },
      averageGrade: null, // Средний балл
      currentPage: 1, // Текущая страница
      totalPages: 1, // Общее количество страниц
      isTeacher: false, // Роль пользователя
    };
  },
  computed: {
    // Фильтрация и сортировка оценок
    filteredGrades() {
      let grades = this.grades;

      // Фильтрация по фамилии студента
      if (this.filters.studentName) {
        grades = grades.filter(grade =>
            grade.Student?.name.toLowerCase().includes(this.filters.studentName.toLowerCase())
        );
      }

      // Фильтрация по названию предмета
      if (this.filters.subjectName) {
        grades = grades.filter(grade =>
            grade.Subject?.name.toLowerCase().includes(this.filters.subjectName.toLowerCase())
        );
      }

      // Сортировка
      if (this.filters.sortBy) {
        grades.sort((a, b) => {
          if (this.filters.sortBy === 'grade') {
            return this.filters.sortOrder === 'ASC' ? a.grade - b.grade : b.grade - a.grade;
          } else if (this.filters.sortBy === 'createdAt') {
            return this.filters.sortOrder === 'ASC'
                ? new Date(a.createdAt) - new Date(b.createdAt)
                : new Date(b.createdAt) - new Date(a.createdAt);
          }
          return 0;
        });
      }

      return grades;
    },
  },
  async created() {
    await this.fetchGrades();
    await this.fetchStudents();
    await this.fetchSubjects();
    this.checkTeacherRole();
  },
  methods: {
    // Получение списка оценок
    async fetchGrades() {
      try {
        const response = await api.getGrades();
        this.grades = response.data.grades;
        this.totalPages = response.data.totalPages;
      } catch (error) {
        console.error('Failed to fetch grades:', error);
        alert('Failed to fetch grades. Please try again later.');
      }
    },
    // Получение списка студентов
    async fetchStudents() {
      try {
        const response = await api.getStudents();
        this.students = response.data || [];
      } catch (error) {
        console.error('Failed to fetch students:', error);
        alert('Failed to fetch students. Please try again later.');
      }
    },
    // Получение списка предметов
    async fetchSubjects() {
      try {
        const response = await api.getSubjects();
        this.subjects = response.data.subjects || [];
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        alert('Failed to fetch subjects. Please try again later.');
      }
    },
    // Создание новой оценки
    async createGrade() {
      try {
        const response = await api.createGrade(this.newGrade);
        this.grades.push(response.data);
        this.newGrade = {grade: null, studentId: null, subjectId: null}; // Очистка формы
        alert('Grade created successfully!');
      } catch (error) {
        console.error('Failed to create grade:', error);
        alert('Failed to create grade. Please check the data and try again.');
      }
    },
    // Применение фильтров
    applyFilters() {
      this.currentPage = 1; // Сброс пагинации
      this.fetchGrades(); // Перезагрузка данных
    },
    // Смена страницы
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchGrades();
      }
    },
    // Получение среднего балла
    async fetchAverageGrade() {   // Уберите "!" на этой строке, она уже в начале файла.
      try {      // Добавите "{" следуя содержимому метода и закройте двойные корышки после первичного блока }"   ---^--v-------// Уберите эту отступ в конце строки
        const response = await api.getAverageGrade(this.averageFilters);    // Добавите ";" перед именем объекта JSON (api)  -----^----~/ удалите колышек из нижнего правого экрана
        this.averageGrade = response.data.average_grade;   // Уберите все "this." перед своим объектом json и после имени метод (response)  --^--v-------// Замените .default на default убрали
      } catch(error){     // В конце сквозь закройте двойные корышки, а также добавдите "!" после метода и перед вторым блоком.  ---^--v-------// Уберите эту отступ
        console.error('Failed to fetch average grade:', error);   // Добавить ";" возле имени объекта json (console) --^----~/ удалите колышек из нижнего правого экрана, а также добавдите двойные корышки
        alert('Failed to fetch average grade. Please try again later.');  // Добавить "!" в конце строки и закройте скобку {} убрали
      }
    },
    // Проверка роли пользователя
    checkTeacherRole() {
      const user = JSON.parse(localStorage.getItem('user'));
      this.isTeacher = user && user.role === 'teacher';
    },
  },
};
</script>

<style scoped>
.grades {
  padding: 20px;
}
</style>