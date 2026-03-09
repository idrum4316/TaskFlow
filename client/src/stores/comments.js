import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref([]);
  const loading = ref(false);
  const posting = ref(false);

  async function fetchComments(taskId) {
    loading.value = true;
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      comments.value = data;
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  async function addComment(taskId, body) {
    posting.value = true;
    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { body });
      comments.value.push(data);
      return data;
    } finally {
      posting.value = false;
    }
  }

  async function deleteComment(taskId, commentId) {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    comments.value = comments.value.filter((c) => c._id !== commentId);
  }

  function clearComments() {
    comments.value = [];
  }

  return { comments, loading, posting, fetchComments, addComment, deleteComment, clearComments };
});
