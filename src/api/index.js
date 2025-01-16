import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен в заголовки
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default {
    login(credentials) {
        return apiClient.post('/auth/login', credentials);
    },
    getStudents() {
        return apiClient.get('/students');
    },
    getGroups() {
        return apiClient.get('/groups');
    },
    getSubjects() {
        return apiClient.get('/subjects');
    },
    getGrades() {
        return apiClient.get('/grades');
    },
    addGrade(grade) {
        return apiClient.post('/grades', grade);
    },

    // Создать нового студента
    createStudent(student) {
        return apiClient.post('/students', student);
    },

    // Обновить студента
    updateStudent(id, student) {
        return apiClient.put(`/students/${id}`, student);
    },

    // Удалить студента
    deleteStudent(id) {
        return apiClient.delete(`/students/${id}`);
    },
};