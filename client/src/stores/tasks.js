import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchTasks(status = null) {
    loading.value = true;
    error.value = null;
    try {
      const params = status ? { status } : {};
      const { data } = await api.get('/tasks', { params });
      tasks.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load tasks';
    } finally {
      loading.value = false;
    }
  }

  async function createTask(payload) {
    const { data } = await api.post('/tasks', payload);
    tasks.value.unshift(data);
    return data;
  }

  async function updateTask(id, payload) {
    const { data } = await api.put(`/tasks/${id}`, payload);
    const index = tasks.value.findIndex((t) => t._id === id);
    if (index !== -1) tasks.value[index] = data;
    return data;
  }

  async function deleteTask(id) {
    await api.delete(`/tasks/${id}`);
    tasks.value = tasks.value.filter((t) => t._id !== id);
  }

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask };
});
