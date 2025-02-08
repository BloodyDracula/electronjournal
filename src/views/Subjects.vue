<template>
  <div class="subjects">
    <h2>Subjects</h2>

    <!-- Форма для создания нового предмета -->
    <div v-if="isAdmin" class="mb-4">
      <h3>Create New Subject</h3>
      <form @submit.prevent="createSubject">
        <div class="mb-3">
          <label for="subjectName" class="form-label">Subject Name:</label>
          <input
              type="text"
              id="subjectName"
              v-model="newSubject.name"
              class="form-control"
              required
          />
        </div>
        <div class="mb-3">
          <label for="subjectTeacherId" class="form-label">Teacher:</label>
          <select
              id="subjectTeacherId"
              v-model="newSubject.teacherId"
              class="form-select"
          >
            <option :value="null">Select a teacher</option>
            <option
                v-for="teacher in teachers"
                :key="teacher.id"
                :value="teacher.id"
            >
              {{ teacher.name }}
            </option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Create Subject</button>
      </form>
    </div>

    <!-- Таблица со списком предметов -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Teacher</th>
        <th v-if="isAdmin">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="subject in subjects" :key="subject.id">
        <td>{{ subject.id }}</td>
        <td>
          <span v-if="!subject.isEditing">{{ subject.name }}</span>
          <input
              v-else
              type="text"
              v-model="subject.editedName"
              class="form-control"
          />
        </td>
        <td>
          <span v-if="!subject.isEditing">{{ subject.Teacher?.name || 'No teacher' }}</span>
          <select
              v-else
              v-model="subject.editedTeacherId"
              class="form-select"
          >
            <option :value="null">No teacher</option>
            <option
                v-for="teacher in teachers"
                :key="teacher.id"
                :value="teacher.id"
            >
              {{ teacher.name }}
            </option>
          </select>
        </td>
        <td v-if="isAdmin">
          <button
              v-if="!subject.isEditing"
              @click="startEdit(subject)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              v-else
              @click="saveEdit(subject)"
              class="btn btn-sm btn-success me-2"
          >
            Save
          </button>
          <button
              @click="deleteSubject(subject.id)"
              class="btn btn-sm btn-danger"
          >
            Delete
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import api from '@/api';

export default {
  data() {
    return {
      subjects: [], // Список предметов
      teachers: [], // Список преподавателей
      newSubject: {
        name: '',
        teacherId: null,
      },
      isAdmin: false, // Проверка роли пользователя
    };
  },
  async created() {
    await this.fetchSubjects();
    await this.fetchTeachers();
    this.checkAdminRole();
  },
  methods: {
    // Получение списка предметов
    async fetchSubjects() {
      try {
        const response = await api.getSubjects({include: ['Teacher']});
        if (response.data && Array.isArray(response.data.subjects)) {
          this.subjects = response.data.subjects.map((subject) => ({
            ...subject,
            isEditing: false,
            editedName: subject.name,
            editedTeacherId: subject.teacherId,
          }));
        } else {
          console.error('Invalid response format:', response);
          alert('Invalid response from server. Please try again later.');
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        alert('Failed to fetch subjects. Please try again later.');
      }
    },

    // Получение списка преподавателей
    async fetchTeachers() {
      try {
        const response = await api.getTeachers();
        this.teachers = response.data || [];
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        alert('Failed to fetch teachers. Please try again later.');
      }
    },

    // Создание нового предмета
    async createSubject() {
      try {
        const response = await api.createSubject(this.newSubject);
        if (response.data) {
          this.subjects.push({
            ...response.data,
            isEditing: false,
            editedName: response.data.name,
            editedTeacherId: response.data.teacherId,
            Teacher: this.teachers.find(
                (teacher) => teacher.id === response.data.teacherId
            ),
          });
          this.newSubject = {name: '', teacherId: null}; // Очистка формы
          alert('Subject created successfully!');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to create subject:', error);
        alert('Failed to create subject. Please check the data and try again.');
      }
    },

    // Начало редактирования предмета
    startEdit(subject) {
      subject.isEditing = true;
    },

    // Сохранение изменений предмета
    async saveEdit(subject) {
      try {
        const updatedSubject = {
          name: subject.editedName,
          teacherId: subject.editedTeacherId,
        };
        await api.updateSubject(subject.id, updatedSubject);
        subject.name = updatedSubject.name;
        subject.teacherId = updatedSubject.teacherId;
        subject.Teacher = this.teachers.find(
            (teacher) => teacher.id === updatedSubject.teacherId
        );
        subject.isEditing = false;
        alert('Subject updated successfully!');
      } catch (error) {
        console.error('Failed to update subject:', error);
        alert('Failed to update subject. Please try again later.');
      }
    },

    // Удаление предмета
    async deleteSubject(subjectId) {
      try {
        await api.deleteSubject(subjectId);
        this.subjects = this.subjects.filter(
            (subject) => subject.id !== subjectId
        );
        alert('Subject deleted successfully!');
      } catch (error) {
        console.error('Failed to delete subject:', error);
        alert('Failed to delete subject. Please try again later.');
      }
    },

    // Проверка роли пользователя
    checkAdminRole() {
      const user = JSON.parse(localStorage.getItem('user'));
      this.isAdmin = user && user.role === 'admin';
    },
  },
};
</script>

<style scoped>
.subjects {
  padding: 20px;
}
</style>