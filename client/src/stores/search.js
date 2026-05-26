import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const results = ref([]);
  const loading = ref(false);
  const open = ref(false);
  let searchRequestId = 0;

  async function search(q, options = {}) {
    const requestId = ++searchRequestId;
    loading.value = true;
    try {
      const params = { q, limit: 20 };
      if (options.boardId) params.board_id = options.boardId;
      const response = await api.get('/search', { params });
      if (requestId === searchRequestId) results.value = response.data.results || [];
    } catch {
      if (requestId === searchRequestId) results.value = [];
    } finally {
      if (requestId === searchRequestId) loading.value = false;
    }
  }

  function clear() {
    searchRequestId += 1;
    query.value = '';
    results.value = [];
    loading.value = false;
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
