import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useAdminStore = defineStore('admin', () => {
  const users = ref([]);
  const settings = ref({ registration_enabled: true });
  const loading = ref(false);

  async function fetchUsers() {
    loading.value = true;
    try {
      const { data } = await api.get('/admin/users');
      users.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(userId, password) {
    await api.put(`/admin/users/${userId}/reset-password`, { password });
  }

  async function toggleAdmin(userId) {
    const { data } = await api.put(`/admin/users/${userId}/toggle-admin`);
    const idx = users.value.findIndex((u) => (u._id || u.id) === userId);
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], is_admin: data.is_admin };
    }
    return data;
  }

  async function fetchSettings() {
    const { data } = await api.get('/admin/settings');
    settings.value = data;
  }

  async function updateSettings(patch) {
    const { data } = await api.put('/admin/settings', patch);
    settings.value = data;
  }

  return { users, settings, loading, fetchUsers, resetPassword, toggleAdmin, fetchSettings, updateSettings };
});
