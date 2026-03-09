import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useInvitationsStore = defineStore('invitations', () => {
  const invitations = ref([]);
  const loading = ref(false);

  async function fetchInvitations() {
    loading.value = true;
    try {
      const { data } = await api.get('/invitations');
      invitations.value = data;
    } catch {
      // non-critical, silently ignore
    } finally {
      loading.value = false;
    }
  }

  async function accept(boardId) {
    await api.post(`/invitations/${boardId}/accept`);
    invitations.value = invitations.value.filter((i) => i.board_id !== boardId);
  }

  async function decline(boardId) {
    await api.post(`/invitations/${boardId}/decline`);
    invitations.value = invitations.value.filter((i) => i.board_id !== boardId);
  }

  return { invitations, loading, fetchInvitations, accept, decline };
});
