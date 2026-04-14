import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  function sortByPosition() {
    tasks.value.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  async function fetchTasks(boardId) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get('/tasks', { params: { board_id: boardId } });
      tasks.value = data;
      sortByPosition();
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load tasks';
    } finally {
      loading.value = false;
    }
  }

  async function createTask(payload) {
    const { data } = await api.post('/tasks', payload);
    const exists = tasks.value.some((t) => t._id === data._id);
    if (!exists) tasks.value.push(data);
    sortByPosition();
    return data;
  }

  function clearTasks() {
    tasks.value = [];
  }

  async function updateTask(id, payload) {
    const { data } = await api.put(`/tasks/${id}`, payload);
    const index = tasks.value.findIndex((t) => t._id === id);
    if (index !== -1) tasks.value[index] = data;
    sortByPosition();
    return data;
  }

  async function reorderTask(id, status, position) {
    const { data } = await api.put(`/tasks/${id}/reorder`, { status, position });
    if (data.renumbered) {
      for (const r of data.renumbered) {
        const t = tasks.value.find((t) => t._id === r._id);
        if (t) {
          t.position = r.position;
          if (r._rev) t._rev = r._rev;
        }
      }
      delete data.renumbered;
    }
    const index = tasks.value.findIndex((t) => t._id === id);
    if (index !== -1) tasks.value[index] = data;
    sortByPosition();
    return data;
  }

  async function deleteTask(id) {
    await api.delete(`/tasks/${id}`);
    tasks.value = tasks.value.filter((t) => t._id !== id);
  }

  async function completeOccurrence(id) {
    const { data } = await api.post(`/tasks/${id}/complete-occurrence`);
    const index = tasks.value.findIndex((t) => t._id === id);
    if (index !== -1) tasks.value[index] = data;
    sortByPosition();
    return data;
  }

  return { tasks, loading, error, fetchTasks, createTask, updateTask, reorderTask, deleteTask, completeOccurrence, clearTasks, sortByPosition };
});
