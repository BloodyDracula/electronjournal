<template>
  <div class="students">
    <h2>Students</h2>

    <!-- Форма для создания нового студента -->
    <div v-if="isAdmin" class="mb-4">
      <h3>Create New Student</h3>
      <form @submit.prevent="createStudent">
        <div class="mb-3">
          <label for="studentName" class="form-label">Name:</label>
          <input
              type="text"
              id="studentName"
              v-model="newStudent.name"
              class="form-control"
              required
          />
        </div>
        <div class="mb-3">
          <label for="studentGroupId" class="form-label">Group ID:</label>
          <input
              type="number"
              id="studentGroupId"
              v-model="newStudent.groupId"
              class="form-control"
              required
          />
        </div>
        <button type="submit" class="btn btn-primary">Create Student</button>
      </form>
    </div>

    <!-- Таблица со списком студентов -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Group ID</th>
        <th v-if="isAdmin">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="student in students" :key="student.id">
        <td>{{ student.id }}</td>
        <td>
          <span v-if="!student.isEditing">{{ student.name }}</span>
          <input
              v-else
              type="text"
              v-model="student.editedName"
              class="form-control"
          />
        </td>
        <td>
          <span v-if="!student.isEditing">{{ student.groupId }}</span>
          <input
              v-else
              type="number"
              v-model="student.editedGroupId"
              class="form-control"
          />
        </td>
        <td v-if="isAdmin">
          <button
              v-if="!student.isEditing"
              @click="startEdit(student)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              v-else
              @click="saveEdit(student)"
              class="btn btn-sm btn-success me-2"
          >
            Save
          </button>
          <button
              @click="deleteStudent(student.id)"
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
      students: [], // Список студентов
      newStudent: {
        name: '',
        groupId: null,
      },
      isAdmin: false, // Проверка роли пользователя
    };
  },
  async created() {
    await this.fetchStudents();
    this.checkAdminRole();
  },
  methods: {
    // Получение списка студентов
    async fetchStudents() {
      try {
        const response = await api.getStudents();
        console.log('Students:', response.data); // Проверка данных студентов
        this.students = response.data.map((student) => ({
          ...student,
          isEditing: false,
          editedName: student.name,
          editedGroupId: student.groupId,
        }));
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    },

    // Создание нового студента
    async createStudent() {
      try {
        const response = await api.createStudent(this.newStudent);
        this.students.push({
          ...response.data,
          isEditing: false,
          editedName: response.data.name,
          editedGroupId: response.data.groupId,
        });
        this.newStudent = { name: '', groupId: null }; // Очистка формы
      } catch (error) {
        console.error('Failed to create student:', error);
      }
    },

    // Начало редактирования студента
    startEdit(student) {
      student.isEditing = true;
    },

    // Сохранение изменений студента
    async saveEdit(student) {
      try {
        const updatedStudent = {
          name: student.editedName,
          groupId: student.editedGroupId,
        };
        await api.updateStudent(student.id, updatedStudent);
        student.name = updatedStudent.name;
        student.groupId = updatedStudent.groupId;
        student.isEditing = false;
      } catch (error) {
        console.error('Failed to update student:', error);
      }
    },

    // Удаление студента
    async deleteStudent(studentId) {
      try {
        await api.deleteStudent(studentId);
        this.students = this.students.filter(
            (student) => student.id !== studentId
        );
      } catch (error) {
        console.error('Failed to delete student:', error);
      }
    },

    // Проверка роли пользователя
    checkAdminRole() {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('User:', user); // Проверка данных пользователя
      this.isAdmin = user && user.role === 'admin';
    },
  },
};
</script>

<style scoped>
.students {
  padding: 20px;
}
</style>