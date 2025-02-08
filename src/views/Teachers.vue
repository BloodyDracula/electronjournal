<template>
  <div class="teachers">
    <h2>Teachers</h2>

    <!-- Форма для создания нового преподавателя -->
    <div v-if="isAdmin" class="mb-4">
      <h3>Create New Teacher</h3>
      <form @submit.prevent="createTeacher">
        <div class="mb-3">
          <label for="teacherName" class="form-label">Name:</label>
          <input
              type="text"
              id="teacherName"
              v-model="newTeacher.name"
              class="form-control"
              required
          />
        </div>
        <div class="mb-3">
          <label for="teacherUserId" class="form-label">User ID:</label>
          <input
              type="number"
              id="teacherUserId"
              v-model="newTeacher.userId"
              class="form-control"
              required
          />
        </div>
        <button type="submit" class="btn btn-primary">Create Teacher</button>
      </form>
    </div>

    <!-- Таблица со списком преподавателей -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>User ID</th>
        <th v-if="isAdmin">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="teacher in teachers" :key="teacher.id">
        <td>{{ teacher.id }}</td>
        <td>
          <span v-if="!teacher.isEditing">{{ teacher.name }}</span>
          <input
              v-else
              type="text"
              v-model="teacher.editedName"
              class="form-control"
          />
        </td>
        <td>
          <span v-if="!teacher.isEditing">{{ teacher.userId }}</span>
          <input
              v-else
              type="number"
              v-model="teacher.editedUserId"
              class="form-control"
          />
        </td>
        <td v-if="isAdmin">
          <button
              v-if="!teacher.isEditing"
              @click="startEdit(teacher)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              v-else
              @click="saveEdit(teacher)"
              class="btn btn-sm btn-success me-2"
          >
            Save
          </button>
          <button
              @click="deleteTeacher(teacher.id)"
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
      teachers: [], // Список преподавателей
      newTeacher: {
        name: '',
        userId: null,
      },
      isAdmin: false, // Проверка роли пользователя
    };
  },
  async created() {
    await this.fetchTeachers();
    this.checkAdminRole();
  },
  methods: {
    // Получение списка преподавателей
    async fetchTeachers() {
      try {
        const response = await api.getTeachers();
        this.teachers = response.data.map((teacher) => ({
          ...teacher,
          isEditing: false,
          editedName: teacher.name,
          editedUserId: teacher.userId,
        }));
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        alert('Failed to fetch teachers. Please try again later.');
      }
    },

    // Создание нового преподавателя
    async createTeacher() {
      try {
        const response = await api.createTeacher(this.newTeacher);
        this.teachers.push({
          ...response.data,
          isEditing: false,
          editedName: response.data.name,
          editedUserId: response.data.userId,
        });
        this.newTeacher = { name: '', userId: null }; // Очистка формы
        alert('Teacher created successfully!');
      } catch (error) {
        console.error('Failed to create teacher:', error);
        alert('Failed to create teacher. Please check the data and try again.');
      }
    },

    // Начало редактирования преподавателя
    startEdit(teacher) {
      teacher.isEditing = true;
    },

    // Сохранение изменений преподавателя
    async saveEdit(teacher) {
      try {
        const updatedTeacher = {
          name: teacher.editedName,
          userId: teacher.editedUserId,
        };
        await api.updateTeacher(teacher.id, updatedTeacher);
        teacher.name = updatedTeacher.name;
        teacher.userId = updatedTeacher.userId;
        teacher.isEditing = false;
        alert('Teacher updated successfully!');
      } catch (error) {
        console.error('Failed to update teacher:', error);
        alert('Failed to update teacher. Please try again later.');
      }
    },

    // Удаление преподавателя
    async deleteTeacher(teacherId) {
      try {
        await api.deleteTeacher(teacherId);
        this.teachers = this.teachers.filter(
            (teacher) => teacher.id !== teacherId
        );
        alert('Teacher deleted successfully!');
      } catch (error) {
        console.error('Failed to delete teacher:', error);
        alert('Failed to delete teacher. Please try again later.');
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
.teachers {
  padding: 20px;
}
</style>