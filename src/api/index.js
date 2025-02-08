import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен в заголовки
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default {
    login(credentials) {
        return api.post('/auth/login', credentials);
    },

    // Методы для работы с группами
    createGroup(groupData) {
        return api.post('/groups', groupData);
    },
    getGroups(params) {
        return api.get('/groups', { params });
    },
    updateGroup(groupId, groupData) {
        return api.put(`/groups/${groupId}`, groupData);
    },
    deleteGroup(groupId) {
        return api.delete(`/groups/${groupId}`);
    },
    addStudentToGroup(groupId, studentId) {
        return api.post(`/groups/${groupId}/students`, { studentId });
    },
    removeStudentFromGroup(groupId, studentId) {
        return api.delete(`/groups/${groupId}/students/${studentId}`);
    },

    // Методы для работы со студентами
    getStudents() {
        return api.get('/students');
    },
    createStudent(studentData) {
        return api.post('/students', studentData);
    },
    updateStudent(studentId, studentData) {
        return api.put(`/students/${studentId}`, studentData);
    },
    deleteStudent(studentId) {
        return api.delete(`/students/${studentId}`);
    },

    // Методы для работы с преподавателями
    getTeachers() {
        return api.get('/teachers');
    },
    createTeacher(teacherData) {
        return api.post('/teachers', teacherData);
    },
    updateTeacher(teacherId, teacherData) {
        return api.put(`/teachers/${teacherId}`, teacherData);
    },
    deleteTeacher(teacherId) {
        return api.delete(`/teachers/${teacherId}`);
    },

    // Методы для работы с предметами
    getSubjects() {
        return api.get('/subjects');
    },
    createSubject(subjectData) {
        return api.post('/subjects', subjectData);
    },
    updateSubject(subjectId, subjectData) {
        return api.put(`/subjects/${subjectId}`, subjectData);
    },
    deleteSubject(subjectId) {
        return api.delete(`/subjects/${subjectId}`);
    },

    // Методы для работы с оценками
    getGrades() {
        return api.get('/grades');
    },
    createGrade(gradeData) {
        return api.post('/grades', gradeData);
    },
    updateGrade(gradeId, gradeData) {
        return api.put(`/grades/${gradeId}`, gradeData);
    },
    deleteGrade(gradeId) {
        return api.delete(`/grades/${gradeId}`);
    },

    // Методы для работы с пользователями
    getUsers(params) {
        return api.get('/users', { params });
    },
    createUser(userData) {
        return api.post('/auth/register', userData);
    },
    updateUser(userId, userData) {
        return api.put(`/users/${userId}`, userData);
    },
    deleteUser(userId) {
        return api.delete(`/users/${userId}`);
    },
    assignStudentToGroup(userId, groupId) {
        return api.post(`/users/${userId}/assign-group`, { groupId });
    },
    assignTeacherToSubject(userId, subjectId) {
        return api.post(`/users/${userId}/assign-subject`, { subjectId });
    },
};