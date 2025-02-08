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
          <label for="studentUserId" class="form-label">User ID:</label>
          <input
              type="number"
              id="studentUserId"
              v-model="newStudent.userId"
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
        <th>User ID</th>
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
          <span v-if="!student.isEditing">{{ student.userId }}</span>
          <input
              v-else
              type="number"
              v-model="student.editedUserId"
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
        userId: null,
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
        this.students = response.data.map((student) => ({
          ...student,
          isEditing: false,
          editedName: student.name,
          editedUserId: student.userId,
          editedGroupId: student.groupId,
        }));
      } catch (error) {
        console.error('Failed to fetch students:', error);
        alert('Failed to fetch students. Please try again later.');
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
          editedUserId: response.data.userId,
          editedGroupId: response.data.groupId,
        });
        this.newStudent = {name: '', userId: null, groupId: null}; // Очистка формы
        alert('Student created successfully!');
      } catch (error) {
        console.error('Failed to create student:', error);
        alert('Failed to create student. Please check the data and try again.');
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
          userId: student.editedUserId,
          groupId: student.editedGroupId,
        };
        await api.updateStudent(student.id, updatedStudent);
        student.name = updatedStudent.name;
        student.userId = updatedStudent.userId;
        student.groupId = updatedStudent.groupId;
        student.isEditing = false;
        alert('Student updated successfully!');
      } catch (error) {
        console.error('Failed to update student:', error);
        alert('Failed to update student. Please try again later.');
      }
    },

    // Удаление студента
    async deleteStudent(studentId) {
      try {
        await api.deleteStudent(studentId);
        this.students = this.students.filter(
            (student) => student.id !== studentId
        );
        alert('Student deleted successfully!');
      } catch (error) {
        console.error('Failed to delete student:', error);
        alert('Failed to delete student. Please try again later.');
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
.students {
  padding: 20px;
}
</style>