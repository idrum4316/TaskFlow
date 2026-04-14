import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useCompletionsStore = defineStore('completions', () => {
  const completions = ref([]);
  const loading = ref(false);
  const hasMore = ref(false);

  // Board-level completions for calendar
  const boardCompletions = ref([]);
  const boardCompletionsLoading = ref(false);

  async function fetchBoardCompletions(boardId, from, to) {
    boardCompletionsLoading.value = true;
    try {
      const { data } = await api.get(`/boards/${boardId}/completions`, {
        params: { from, to },
      });
      boardCompletions.value = data;
    } catch {
      // non-critical
    } finally {
      boardCompletionsLoading.value = false;
    }
  }

  async function fetchCompletions(taskId, limit = 20) {
    loading.value = true;
    try {
      const { data } = await api.get(`/tasks/${taskId}/completions`, {
        params: { limit: limit + 1 },
      });
      hasMore.value = data.length > limit;
      completions.value = data.slice(0, limit);
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(taskId, limit = 20) {
    const currentCount = completions.value.length;
    loading.value = true;
    try {
      const { data } = await api.get(`/tasks/${taskId}/completions`, {
        params: { limit: currentCount + limit + 1 },
      });
      hasMore.value = data.length > currentCount + limit;
      completions.value = data.slice(0, currentCount + limit);
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  function clearCompletions() {
    completions.value = [];
    hasMore.value = false;
    boardCompletions.value = [];
  }

  return { completions, loading, hasMore, fetchCompletions, loadMore, clearCompletions, boardCompletions, boardCompletionsLoading, fetchBoardCompletions };
});
