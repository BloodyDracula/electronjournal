<template>
  <div class="grades">
    <h2>Grades</h2>
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Grade</th>
        <th>Student</th>
        <th>Subject</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="grade in grades" :key="grade.id">
        <td>{{ grade.id }}</td>
        <td>{{ grade.grade }}</td>
        <td>{{ grade.studentId }}</td>
        <td>{{ grade.subjectId }}</td>
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
      grades: [],
    };
  },
  async created() {
    try {
      const response = await api.getGrades();
      this.grades = response.data;
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  },
};
</script>

<style scoped>
.grades {
  padding: 20px;
}
</style>