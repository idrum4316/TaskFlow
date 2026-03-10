import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useBoardsStore = defineStore('boards', () => {
  const boards = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchBoards() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get('/boards');
      boards.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load boards';
    } finally {
      loading.value = false;
    }
  }

  async function createBoard(name) {
    const { data } = await api.post('/boards', { name });
    boards.value.push(data);
    return data;
  }

  async function renameBoard(id, name) {
    const { data } = await api.put(`/boards/${id}`, { name });
    const index = boards.value.findIndex((b) => b._id === id);
    if (index !== -1) boards.value[index] = data;
    return data;
  }

  async function updateBoard(id, payload) {
    const { data } = await api.put(`/boards/${id}`, payload);
    const index = boards.value.findIndex((b) => b._id === id);
    if (index !== -1) boards.value[index] = data;
    return data;
  }

  async function deleteBoard(id) {
    await api.delete(`/boards/${id}`);
    boards.value = boards.value.filter((b) => b._id !== id);
  }

  return { boards, loading, error, fetchBoards, createBoard, renameBoard, updateBoard, deleteBoard };
});
