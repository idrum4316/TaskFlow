import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useAttachmentsStore = defineStore('attachments', () => {
  const attachments = ref([]);
  const loading = ref(false);
  const uploading = ref(false);
  const error = ref(null);

  async function fetchAttachments(taskId) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get(`/tasks/${taskId}/attachments`);
      attachments.value = data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load attachments';
    } finally {
      loading.value = false;
    }
  }

  async function uploadAttachment(taskId, file) {
    uploading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      attachments.value.push(data);
      return data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to upload file';
      throw err;
    } finally {
      uploading.value = false;
    }
  }

  async function deleteAttachment(taskId, attachmentId) {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    attachments.value = attachments.value.filter((a) => a._id !== attachmentId);
  }

  async function getDownloadUrl(taskId, attachmentId) {
    const { data } = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`);
    return data.url;
  }

  function clearAttachments() {
    attachments.value = [];
    error.value = null;
  }

  return {
    attachments,
    loading,
    uploading,
    error,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    getDownloadUrl,
    clearAttachments,
  };
});
