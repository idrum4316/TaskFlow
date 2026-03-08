import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/client';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  function setSession(data) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  async function register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setSession(data);
    router.push({ name: 'tasks' });
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setSession(data);
    router.push({ name: 'tasks' });
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push({ name: 'login' });
  }

  return { token, user, isAuthenticated, register, login, logout };
});
