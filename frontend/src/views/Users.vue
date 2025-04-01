<template>
  <div class="users-container">
    <h1 class="mb-4">Управление пользователями</h1>
    
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
    
    <!-- Кнопка добавления нового пользователя -->
    <div class="mb-4">
      <button class="btn btn-success" @click="showAddUserModal = true">
        <i class="bi bi-plus-circle me-2"></i> Добавить пользователя
      </button>
    </div>
    
    <!-- Таблица пользователей -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-primary">
          <tr>
            <th>ID</th>
            <th>Логин</th>
            <th>ФИО</th>
            <th>Роль</th>
            <th>Группа</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.login }}</td>
            <td>{{ user.lastName }} {{ user.firstName }} {{ user.middleName }}</td>
            <td>
              <span class="badge" :class="getRoleBadgeClass(user.role)">
                {{ getRoleText(user.role) }}
              </span>
            </td>
            <td>{{ user.group ? user.group.name : '-' }}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-primary" @click="editUser(user)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger" @click="confirmDeleteUser(user)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно добавления/редактирования пользователя -->
    <div class="modal fade" :class="{ 'show d-block': showAddUserModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактирование пользователя' : 'Добавление пользователя' }}</h5>
            <button type="button" class="btn-close" @click="closeUserModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="mb-3">
                <label for="login" class="form-label">Логин</label>
                <input type="text" class="form-control" id="login" v-model="userForm.login" required>
              </div>
              
              <div class="mb-3" v-if="!isEditing">
                <label for="password" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="password" v-model="userForm.password" required>
              </div>
              
              <div class="mb-3">
                <label for="firstName" class="form-label">Имя</label>
                <input type="text" class="form-control" id="firstName" v-model="userForm.firstName" required>
              </div>
              
              <div class="mb-3">
                <label for="lastName" class="form-label">Фамилия</label>
                <input type="text" class="form-control" id="lastName" v-model="userForm.lastName" required>
              </div>
              
              <div class="mb-3">
                <label for="middleName" class="form-label">Отчество</label>
                <input type="text" class="form-control" id="middleName" v-model="userForm.middleName">
              </div>
              
              <div class="mb-3">
                <label for="role" class="form-label">Роль</label>
                <select class="form-select" id="role" v-model="userForm.role" required>
                  <option value="admin">Администратор</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="student">Студент</option>
                </select>
              </div>
              
              <div class="mb-3" v-if="userForm.role === 'student'">
                <label for="groupId" class="form-label">Группа</label>
                <select class="form-select" id="groupId" v-model="userForm.groupId">
                  <option value="">Не выбрана</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
              
              <div class="mb-3" v-if="userForm.role === 'teacher'">
                <label class="form-label">Предметы</label>
                <div class="form-check" v-for="subject in subjects" :key="subject.id">
                  <input class="form-check-input" type="checkbox" 
                         :id="'subject-' + subject.id"
                         :value="subject.id"
                         v-model="userForm.subjectIds">
                  <label class="form-check-label" :for="'subject-' + subject.id">
                    {{ subject.name }}
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeUserModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveUser">Сохранить</button>
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
            <p>Вы действительно хотите удалить пользователя {{ userToDelete ? userToDelete.lastName + ' ' + userToDelete.firstName : '' }}?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="deleteUser">Удалить</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Затемнение фона при открытии модального окна -->
    <div class="modal-backdrop fade show" v-if="showAddUserModal || showDeleteModal"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Users',
  data() {
    return {
      showAddUserModal: false,
      showDeleteModal: false,
      isEditing: false,
      userToDelete: null,
      userForm: {
        login: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        role: 'student',
        groupId: '',
        subjectIds: []
      }
    }
  },
  computed: {
    ...mapGetters('users', [
      'allUsers',
      'usersLoading',
      'usersError'
    ]),
    ...mapGetters('groups', [
      'allGroups'
    ]),
    ...mapGetters('subjects', [
      'allSubjects'
    ]),
    users() {
      return this.allUsers
    },
    groups() {
      return this.allGroups
    },
    subjects() {
      return this.allSubjects
    },
    loading() {
      return this.usersLoading
    },
    error() {
      return this.usersError
    }
  },
  methods: {
    ...mapActions('users', [
      'fetchUsers',
      'createUser',
      'updateUser',
      'deleteUser'
    ]),
    ...mapActions('groups', [
      'fetchGroups'
    ]),
    ...mapActions('subjects', [
      'fetchSubjects'
    ]),
    getRoleText(role) {
      const roles = {
        admin: 'Администратор',
        teacher: 'Преподаватель',
        student: 'Студент'
      }
      return roles[role] || role
    },
    getRoleBadgeClass(role) {
      const classes = {
        admin: 'bg-danger',
        teacher: 'bg-success',
        student: 'bg-primary'
      }
      return classes[role] || 'bg-secondary'
    },
    editUser(user) {
      this.isEditing = true
      this.userForm = {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        role: user.role,
        groupId: user.groupId || '',
        subjectIds: user.subjects ? user.subjects.map(subject => subject.id) : []
      }
      this.showAddUserModal = true
    },
    confirmDeleteUser(user) {
      this.userToDelete = user
      this.showDeleteModal = true
    },
    async deleteUser() {
      try {
        await this.deleteUser(this.userToDelete.id)
        this.showDeleteModal = false
        this.userToDelete = null
      } catch (error) {
        console.error('Delete user error:', error)
      }
    },
    closeUserModal() {
      this.showAddUserModal = false
      this.resetForm()
    },
    resetForm() {
      this.isEditing = false
      this.userForm = {
        login: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        role: 'student',
        groupId: '',
        subjectIds: []
      }
    },
    async saveUser() {
      try {
        if (this.isEditing) {
          await this.updateUser({
            id: this.userForm.id,
            userData: {
              login: this.userForm.login,
              firstName: this.userForm.firstName,
              lastName: this.userForm.lastName,
              middleName: this.userForm.middleName,
              role: this.userForm.role,
              groupId: this.userForm.role === 'student' ? this.userForm.groupId : null,
              subjectIds: this.userForm.role === 'teacher' ? this.userForm.subjectIds : []
            }
          })
        } else {
          await this.createUser({
            login: this.userForm.login,
            password: this.userForm.password,
            firstName: this.userForm.firstName,
            lastName: this.userForm.lastName,
            middleName: this.userForm.middleName,
            role: this.userForm.role,
            groupId: this.userForm.role === 'student' ? this.userForm.groupId : null,
            subjectIds: this.userForm.role === 'teacher' ? this.userForm.subjectIds : []
          })
        }
        this.closeUserModal()
      } catch (error) {
        console.error('Save user error:', error)
      }
    }
  },
  async created() {
    try {
      await Promise.all([
        this.fetchUsers(),
        this.fetchGroups(),
        this.fetchSubjects()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.show {
  display: block;
}
</style>