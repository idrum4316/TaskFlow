import axios from 'axios';
import { ref } from 'vue';

const api = axios.create({ baseURL: '/api' });

export const sessionExpired = ref(false);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      sessionExpired.value = true;
    }
    return Promise.reject(error);
  }
);

export default api;
