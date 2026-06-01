import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useAccountStore = defineStore('account', () => {
  const mfaEnabled = ref(false);
  const mfaSetup = ref(null); // { secret, qr, otpauth_url }
  const preferences = ref({});

  async function changePassword(current_password, new_password) {
    await api.put('/account/password', { current_password, new_password });
  }

  async function fetchMfaStatus() {
    const { data } = await api.get('/account/mfa/status');
    mfaEnabled.value = data.mfa_enabled;
  }

  async function startMfaSetup() {
    const { data } = await api.post('/account/mfa/setup');
    mfaSetup.value = data;
    return data;
  }

  async function verifyMfaSetup(code) {
    const { data } = await api.post('/account/mfa/verify', { code });
    mfaEnabled.value = data.mfa_enabled;
    mfaSetup.value = null;
    return data;
  }

  async function disableMfa(code) {
    const { data } = await api.post('/account/mfa/disable', { code });
    mfaEnabled.value = data.mfa_enabled;
    return data;
  }

  async function fetchPreferences() {
    const { data } = await api.get('/account/preferences');
    preferences.value = data;
    return data;
  }

  async function updatePreferences(patch) {
    const { data } = await api.put('/account/preferences', patch);
    preferences.value = data;
    return data;
  }

  return {
    mfaEnabled, mfaSetup, preferences,
    changePassword, fetchMfaStatus, startMfaSetup, verifyMfaSetup, disableMfa,
    fetchPreferences, updatePreferences,
  };
});
