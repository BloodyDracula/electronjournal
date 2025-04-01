<template>
  <div class="groups-container">
    <h1 class="mb-4">Управление группами</h1>
    
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
    
    <!-- Кнопка добавления новой группы (только для админа) -->
    <div class="mb-4" v-if="userRole === 'admin'">
      <button class="btn btn-success" @click="showAddGroupModal = true">
        <i class="bi bi-plus-circle me-2"></i> Добавить группу
      </button>
    </div>
    
    <!-- Таблица групп -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-primary">
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Описание</th>
            <th>Кол-во студентов</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group.id">
            <td>{{ group.id }}</td>
            <td>{{ group.name }}</td>
            <td>{{ group.description }}</td>
            <td>{{ group.students ? group.students.length : 0 }}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-info" @click="viewStudents(group)">
                  <i class="bi bi-people"></i> Студенты
                </button>
                <button v-if="userRole === 'admin'" class="btn btn-primary" @click="editGroup(group)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button v-if="userRole === 'admin'" class="btn btn-danger" @click="confirmDeleteGroup(group)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно добавления/редактирования группы -->
    <div class="modal fade" :class="{ 'show d-block': showAddGroupModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактирование группы' : 'Добавление группы' }}</h5>
            <button type="button" class="btn-close" @click="closeGroupModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveGroup">
              <div class="mb-3">
                <label for="name" class="form-label">Название группы</label>
                <input type="text" class="form-control" id="name" v-model="groupForm.name" required>
              </div>
              
              <div class="mb-3">
                <label for="description" class="form-label">Описание</label>
                <textarea class="form-control" id="description" v-model="groupForm.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeGroupModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveGroup">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно просмотра студентов группы -->
    <div class="modal fade" :class="{ 'show d-block': showStudentsModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Студенты группы {{ selectedGroup ? selectedGroup.name : '' }}</h5>
            <button type="button" class="btn-close" @click="showStudentsModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedGroup && selectedGroup.students && selectedGroup.students.length > 0">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ФИО</th>
                    <th>Логин</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in selectedGroup.students" :key="student.id">
                    <td>{{ student.id }}</td>
                    <td>{{ student.lastName }} {{ student.firstName }} {{ student.middleName }}</td>
                    <td>{{ student.login }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="alert alert-info">
              В этой группе нет студентов
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showStudentsModal = false">Закрыть</button>
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
            <p>Вы действительно хотите удалить группу {{ groupToDelete ? groupToDelete.name : '' }}?</p>
            <div class="alert alert-warning">
              <strong>Внимание!</strong> Все студенты этой группы останутся в системе, но будут отвязаны от группы.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="deleteGroup">Удалить</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Затемнение фона при открытии модального окна -->
    <div class="modal-backdrop fade show" v-if="showAddGroupModal || showDeleteModal || showStudentsModal"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Groups',
  data() {
    return {
      showAddGroupModal: false,
      showDeleteModal: false,
      showStudentsModal: false,
      isEditing: false,
      groupToDelete: null,
      selectedGroup: null,
      groupForm: {
        name: '',
        description: ''
      }
    }
  },
  computed: {
    ...mapGetters('groups', [
      'allGroups',
      'groupsLoading',
      'groupsError'
    ]),
    ...mapGetters('auth', [
      'userRole'
    ]),
    groups() {
      return this.allGroups
    },
    loading() {
      return this.groupsLoading
    },
    error() {
      return this.groupsError
    }
  },
  methods: {
    ...mapActions('groups', [
      'fetchGroups',
      'fetchGroup',
      'createGroup',
      'updateGroup',
      'deleteGroup'
    ]),
    editGroup(group) {
      this.isEditing = true
      this.groupForm = {
        id: group.id,
        name: group.name,
        description: group.description || ''
      }
      this.showAddGroupModal = true
    },
    viewStudents(group) {
      this.selectedGroup = group
      this.showStudentsModal = true
    },
    confirmDeleteGroup(group) {
      this.groupToDelete = group
      this.showDeleteModal = true
    },
    async deleteGroup() {
      try {
        await this.deleteGroup(this.groupToDelete.id)
        this.showDeleteModal = false
        this.groupToDelete = null
      } catch (error) {
        console.error('Delete group error:', error)
      }
    },
    closeGroupModal() {
      this.showAddGroupModal = false
      this.resetForm()
    },
    resetForm() {
      this.isEditing = false
      this.groupForm = {
        name: '',
        description: ''
      }
    },
    async saveGroup() {
      try {
        if (this.isEditing) {
          await this.updateGroup({
            id: this.groupForm.id,
            groupData: {
              name: this.groupForm.name,
              description: this.groupForm.description
            }
          })
        } else {
          await this.createGroup({
            name: this.groupForm.name,
            description: this.groupForm.description
          })
        }
        this.closeGroupModal()
      } catch (error) {
        console.error('Save group error:', error)
      }
    }
  },
  async created() {
    try {
      await this.fetchGroups()
    } catch (error) {
      console.error('Error loading groups:', error)
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