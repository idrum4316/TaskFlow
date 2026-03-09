import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/client';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const mfaChallenge = ref(null); // { mfa_token }

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => !!user.value?.is_admin);

  function setSession(data) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  async function register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setSession(data);
    router.push({ name: 'boards' });
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.mfa_required) {
      mfaChallenge.value = { mfa_token: data.mfa_token };
      return { mfa_required: true };
    }
    setSession(data);
    router.push({ name: 'boards' });
    return { mfa_required: false };
  }

  async function verifyMfa(code) {
    if (!mfaChallenge.value) throw new Error('No MFA challenge pending');
    const { data } = await api.post('/auth/mfa-verify', {
      mfa_token: mfaChallenge.value.mfa_token,
      code,
    });
    mfaChallenge.value = null;
    setSession(data);
    router.push({ name: 'boards' });
  }

  function cancelMfa() {
    mfaChallenge.value = null;
  }

  function logout() {
    token.value = null;
    user.value = null;
    mfaChallenge.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push({ name: 'login' });
  }

  return { token, user, mfaChallenge, isAuthenticated, isAdmin, register, login, verifyMfa, cancelMfa, logout };
});
