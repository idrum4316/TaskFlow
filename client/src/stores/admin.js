import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useAdminStore = defineStore('admin', () => {
  const users = ref([]);
  const settings = ref({ registration_enabled: true });
  const loading = ref(false);
  const inviteTokens = ref([]);
  const emailSettings = ref({ smtp_host: '', smtp_port: '', smtp_secure: false, smtp_user: '', smtp_pass: '', email_from: '' });

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

  async function fetchInviteTokens() {
    const { data } = await api.get('/admin/invite-tokens');
    inviteTokens.value = data;
  }

  async function createInviteToken(email) {
    const { data } = await api.post('/admin/invite-tokens', { email });
    inviteTokens.value.unshift({ ...data, used: false });
    return data;
  }

  async function revokeInviteToken(token) {
    await api.delete(`/admin/invite-tokens/${token}`);
    inviteTokens.value = inviteTokens.value.filter((t) => t.token !== token);
  }

  async function fetchEmailSettings() {
    const { data } = await api.get('/admin/email-settings');
    emailSettings.value = data;
  }

  async function updateEmailSettings(patch) {
    const { data } = await api.put('/admin/email-settings', patch);
    emailSettings.value = data;
    return data;
  }

  async function sendTestEmail(to) {
    const { data } = await api.post('/admin/email-settings/test', { to });
    return data;
  }

  async function reindexSearch() {
    const { data } = await api.post('/admin/search/reindex');
    return data;
  }

  return {
    users, settings, loading, inviteTokens, emailSettings,
    fetchUsers, resetPassword, toggleAdmin, fetchSettings, updateSettings,
    fetchInviteTokens, createInviteToken, revokeInviteToken,
    fetchEmailSettings, updateEmailSettings, sendTestEmail, reindexSearch,
  };
});
