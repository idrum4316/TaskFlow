import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useSharesStore = defineStore('shares', () => {
  const shares = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchShares(boardId) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get(`/boards/${boardId}/shares`);
      shares.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load shares';
    } finally {
      loading.value = false;
    }
  }

  async function inviteUser(boardId, email, access) {
    const { data } = await api.post(`/boards/${boardId}/shares`, { email, access });
    shares.value.push(data);
    return data;
  }

  async function updateAccess(boardId, userId, access) {
    const { data } = await api.patch(`/boards/${boardId}/shares/${userId}`, { access });
    const i = shares.value.findIndex((s) => s.user_id === userId);
    if (i !== -1) shares.value[i] = data;
  }

  async function revokeAccess(boardId, userId) {
    await api.delete(`/boards/${boardId}/shares/${userId}`);
    shares.value = shares.value.filter((s) => s.user_id !== userId);
  }

  function clearShares() {
    shares.value = [];
    error.value = null;
  }

  return { shares, loading, error, fetchShares, inviteUser, updateAccess, revokeAccess, clearShares };
});
