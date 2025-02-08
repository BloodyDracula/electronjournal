<template>
  <div class="groups">
    <h2>Groups</h2>

    <!-- Форма для создания новой группы -->
    <div v-if="isAdmin" class="mb-4">
      <h3>Create New Group</h3>
      <form @submit.prevent="createGroup">
        <div class="mb-3">
          <label for="groupName" class="form-label">Group Name:</label>
          <input
              type="text"
              id="groupName"
              v-model="newGroup.name"
              class="form-control"
              required
          />
        </div>
        <button type="submit" class="btn btn-primary">Create Group</button>
      </form>
    </div>

    <!-- Таблица со списком групп -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Students</th>
        <th v-if="isAdmin">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="group in groups" :key="group.id">
        <td>{{ group.id }}</td>
        <td>
          <span v-if="!group.isEditing">{{ group.name }}</span>
          <input
              v-else
              type="text"
              v-model="group.editedName"
              class="form-control"
          />
        </td>
        <td>
          <ul>
            <li v-for="student in group.students || []" :key="student.id">
              {{ student.name }}
              <button
                  v-if="isAdmin"
                  @click="removeStudentFromGroup(group.id, student.id)"
                  class="btn btn-sm btn-danger ms-2"
              >
                Remove
              </button>
            </li>
          </ul>
          <div v-if="isAdmin && group.isEditing">
            <select v-model="group.selectedStudentId" class="form-select">
              <option :value="null">Select a student</option>
              <option
                  v-for="student in availableStudents"
                  :key="student.id"
                  :value="student.id"
              >
                {{ student.name }}
              </option>
            </select>
            <button
                @click="addStudentToGroup(group.id)"
                class="btn btn-sm btn-success mt-2"
            >
              Add Student
            </button>
          </div>
        </td>
        <td v-if="isAdmin">
          <button
              v-if="!group.isEditing"
              @click="startEdit(group)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              v-else
              @click="saveEdit(group)"
              class="btn btn-sm btn-success me-2"
          >
            Save
          </button>
          <button
              @click="deleteGroup(group.id)"
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
      groups: [], // Список групп
      students: [], // Список всех студентов
      newGroup: {
        name: '',
      },
      isAdmin: false, // Проверка роли пользователя
    };
  },
  async created() {
    await this.fetchGroups();
    await this.fetchStudents();
    this.checkAdminRole();
  },
  computed: {
    // Список студентов, которые не привязаны к группам
    availableStudents() {
      const studentsInGroups = this.groups.flatMap((group) =>
          group.students?.map((student) => student.id) || []
      );
      return this.students.filter(
          (student) => !studentsInGroups.includes(student.id)
      );
    },
  },
  methods: {
    // Получение списка групп
    async fetchGroups() {
      try {
        console.log('Fetching groups...');
        const response = await api.getGroups();
        console.log('Groups response:', response);

        // Проверяем, что response.data.groups существует и является массивом
        if (response.data && Array.isArray(response.data.groups)) {
          this.groups = response.data.groups.map((group) => ({
            ...group,
            isEditing: false,
            editedName: group.name,
            selectedStudentId: null,
            students: group.students || [], // Добавляем пустой массив студентов, если его нет
          }));
        } else {
          console.error('Invalid response format:', response);
          alert('Invalid response from server. Please try again later.');
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
        alert('Failed to fetch groups. Please try again later.');
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

    // Создание новой группы
    async createGroup() {
      try {
        const response = await api.createGroup(this.newGroup);
        if (response.data) {
          this.groups.push({
            ...response.data,
            isEditing: false,
            editedName: response.data.name,
            students: [],
            selectedStudentId: null,
          });
          this.newGroup = {name: ''}; // Очистка формы
          alert('Group created successfully!');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to create group:', error);
        alert('Failed to create group. Please check the data and try again.');
      }
    },

    // Начало редактирования группы
    startEdit(group) {
      group.isEditing = true;
    },

    // Сохранение изменений группы
    async saveEdit(group) {
      try {
        const updatedGroup = {
          name: group.editedName,
        };
        await api.updateGroup(group.id, updatedGroup);
        group.name = updatedGroup.name;
        group.isEditing = false;
        alert('Group updated successfully!');
      } catch (error) {
        console.error('Failed to update group:', error);
        alert('Failed to update group. Please try again later.');
      }
    },

    // Удаление группы
    async deleteGroup(groupId) {
      try {
        await api.deleteGroup(groupId);
        this.groups = this.groups.filter((group) => group.id !== groupId);
        alert('Group deleted successfully!');
      } catch (error) {
        console.error('Failed to delete group:', error);
        alert('Failed to delete group. Please try again later.');
      }
    },

    // Добавление студента в группу
    async addStudentToGroup(groupId) {
      const group = this.groups.find((group) => group.id === groupId);
      if (!group || !group.selectedStudentId) {
        alert('Please select a student.');
        return;
      }

      try {
        await api.addStudentToGroup(groupId, group.selectedStudentId);
        const student = this.students.find(
            (student) => student.id === group.selectedStudentId
        );
        if (student) {
          group.students.push(student);
          group.selectedStudentId = null;
          alert('Student added to group successfully!');
        } else {
          throw new Error('Student not found');
        }
      } catch (error) {
        console.error('Failed to add student to group:', error);
        alert('Failed to add student to group. Please try again later.');
      }
    },

    // Удаление студента из группы
    async removeStudentFromGroup(groupId, studentId) {
      try {
        await api.removeStudentFromGroup(groupId, studentId);
        const group = this.groups.find((group) => group.id === groupId);
        if (group) {
          group.students = group.students.filter(
              (student) => student.id !== studentId
          );
          alert('Student removed from group successfully!');
        } else {
          throw new Error('Group not found');
        }
      } catch (error) {
        console.error('Failed to remove student from group:', error);
        alert('Failed to remove student from group. Please try again later.');
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
.groups {
  padding: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 5px 0;
}
</style>