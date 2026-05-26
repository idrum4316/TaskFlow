import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const results = ref([]);
  const loading = ref(false);
  const open = ref(false);

  async function search(q) {
    loading.value = true;
    try {
      const response = await api.get('/search', { params: { q, limit: 20 } });
      results.value = response.data.results || [];
    } catch {
      results.value = [];
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    query.value = '';
    results.value = [];
  }

  function close() {
    open.value = false;
    clear();
  }

  function toggleOpen() {
    open.value = !open.value;
  }

  return { query, results, loading, open, search, clear, close, toggleOpen };
});
