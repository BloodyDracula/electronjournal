<template>
  <div class="users">
    <h2>Users</h2>

    <!-- Форма для фильтрации и сортировки -->
    <div class="mb-4">
      <h3>Filter and Sort</h3>
      <form @submit.prevent="fetchUsers">
        <div class="row">
          <div class="col-md-3">
            <label for="role" class="form-label">Role:</label>
            <select
                id="role"
                v-model="filters.role"
                class="form-select"
            >
              <option :value="null">All</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="sortBy" class="form-label">Sort By:</label>
            <select
                id="sortBy"
                v-model="filters.sortBy"
                class="form-select"
            >
              <option value="username">Username</option>
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

    <!-- Кнопка для создания нового пользователя -->
    <div class="mb-4">
      <button @click="openCreateUserModal" class="btn btn-success">
        Create New User
      </button>
    </div>

    <!-- Таблица со списком пользователей -->
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Username</th>
        <th>Role</th>
        <th>Created At</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.id }}</td>
        <td>{{ user.username }}</td>
        <td>{{ user.role }}</td>
        <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
        <td>
          <button
              @click="viewUserDetails(user.id)"
              class="btn btn-sm btn-info me-2"
          >
            Details
          </button>
          <button
              @click="editUser(user)"
              class="btn btn-sm btn-warning me-2"
          >
            Edit
          </button>
          <button
              @click="deleteUser(user.id)"
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

    <!-- Модальное окно для создания пользователя -->
    <div v-if="isCreateUserModalOpen" class="modal fade show" style="display: block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New User</h5>
            <button type="button" class="btn-close" @click="closeCreateUserModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createUser">
              <div class="mb-3">
                <label for="username" class="form-label">Username:</label>
                <input
                    type="text"
                    id="username"
                    v-model="newUser.username"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password:</label>
                <input
                    type="password"
                    id="password"
                    v-model="newUser.password"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="firstName" class="form-label">First Name:</label>
                <input
                    type="text"
                    id="firstName"
                    v-model="newUser.firstName"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="lastName" class="form-label">Last Name:</label>
                <input
                    type="text"
                    id="lastName"
                    v-model="newUser.lastName"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="role" class="form-label">Role:</label>
                <select
                    id="role"
                    v-model="newUser.role"
                    class="form-select"
                    required
                    @change="handleRoleChange"
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <!-- Поле для выбора группы (только для студентов) -->
              <div v-if="newUser.role === 'student'" class="mb-3">
                <label for="groupId" class="form-label">Group:</label>
                <select
                    id="groupId"
                    v-model="newUser.groupId"
                    class="form-select"
                    required
                >
                  <option :value="null">Select a group</option>
                  <option
                      v-for="group in groups"
                      :key="group.id"
                      :value="group.id"
                  >
                    {{ group.name }}
                  </option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для редактирования пользователя -->
    <div v-if="editingUser" class="modal fade show" style="display: block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit User</h5>
            <button type="button" class="btn-close" @click="editingUser = null"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="mb-3">
                <label for="username" class="form-label">Username:</label>
                <input
                    type="text"
                    id="username"
                    v-model="editingUser.username"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password:</label>
                <input
                    type="password"
                    id="password"
                    v-model="editingUser.password"
                    class="form-control"
                />
              </div>
              <div class="mb-3">
                <label for="firstName" class="form-label">First Name:</label>
                <input
                    type="text"
                    id="firstName"
                    v-model="editingUser.firstName"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="lastName" class="form-label">Last Name:</label>
                <input
                    type="text"
                    id="lastName"
                    v-model="editingUser.lastName"
                    class="form-control"
                    required
                />
              </div>
              <div class="mb-3">
                <label for="role" class="form-label">Role:</label>
                <select
                    id="role"
                    v-model="editingUser.role"
                    class="form-select"
                    required
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Save</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api';

export default {
  data() {
    return {
      users: [], // Список пользователей
      groups: [], // Список групп
      newUser: {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student', // Роль по умолчанию
        groupId: null, // ID группы (только для студентов)
      },
      editingUser: null, // Пользователь для редактирования
      isCreateUserModalOpen: false, // Открыто ли модальное окно создания
      filters: {
        role: null,
        sortBy: 'username',
        sortOrder: 'ASC',
      },
      currentPage: 1,
      totalPages: 1,
    };
  },
  async created() {
    await this.fetchUsers();
    await this.fetchGroups(); // Загружаем список групп
  },
  methods: {
    // Получение списка пользователей
    async fetchUsers() {
      try {
        const response = await api.getUsers({
          ...this.filters,
          page: this.currentPage,
        });
        this.users = response.data.users; // Обновляем список пользователей
        this.totalPages = response.data.totalPages; // Обновляем общее количество страниц
      } catch (error) {
        console.error('Failed to fetch users:', error);
        alert('Failed to fetch users. Please try again later.');
      }
    },

    // Получение списка групп
    async fetchGroups() {
      try {
        const response = await api.getGroups();
        this.groups = response.data.groups || [];
      } catch (error) {
        console.error('Failed to fetch groups:', error);
        alert('Failed to fetch groups. Please try again later.');
      }
    },

    // Открытие модального окна для создания пользователя
    openCreateUserModal() {
      this.isCreateUserModalOpen = true;
    },

    // Закрытие модального окна для создания пользователя
    closeCreateUserModal() {
      this.isCreateUserModalOpen = false;
      this.newUser = {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student',
        groupId: null,
      }; // Сброс формы
    },

    // Обработка изменения роли
    handleRoleChange() {
      if (this.newUser.role !== 'student') {
        this.newUser.groupId = null; // Сбрасываем выбор группы, если роль не "student"
      }
    },

    // Создание нового пользователя
    async createUser() {
      try {
        // Создаем пользователя
        const userResponse = await api.createUser({
          username: this.newUser.username,
          password: this.newUser.password,
          firstName: this.newUser.firstName,
          lastName: this.newUser.lastName,
          role: this.newUser.role,
        });

        // Если роль - студент, создаем запись в таблице Students
        if (this.newUser.role === 'student' && this.newUser.groupId) {
          await api.createStudent({
            userId: userResponse.data.id,
            groupId: this.newUser.groupId,
            name: `${this.newUser.firstName} ${this.newUser.lastName}`, // Формируем имя
          });
        }

        // Если роль - преподаватель, создаем запись в таблице Teachers
        if (this.newUser.role === 'teacher') {
          await api.createTeacher({
            userId: userResponse.data.id,
          });
        }

        this.closeCreateUserModal();
        await this.fetchUsers(); // Ожидаем обновления списка пользователей
        alert('User created successfully!');
      } catch (error) {
        console.error('Failed to create user:', error.response?.data || error.message);
        alert('Failed to create user. Please check the data and try again.');
      }
    },

    // Начало редактирования пользователя
    editUser(user) {
      this.editingUser = { ...user };
    },

    // Сохранение изменений пользователя
    async saveUser() {
      try {
        await api.updateUser(this.editingUser.id, this.editingUser);
        this.editingUser = null;
        this.fetchUsers(); // Обновляем список пользователей
        alert('User updated successfully!');
      } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user. Please try again later.');
      }
    },

    // Удаление пользователя
    async deleteUser(userId) {
      try {
        await api.deleteUser(userId);
        this.fetchUsers(); // Обновляем список пользователей
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again later.');
      }
    },

    // Смена страницы
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchUsers();
      }
    },
  },
};
</script>

<style scoped>
.users {
  padding: 20px;
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>