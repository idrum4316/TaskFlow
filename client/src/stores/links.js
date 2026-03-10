import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useLinksStore = defineStore('links', () => {
  const links = ref([]);
  const loading = ref(false);

  async function fetchLinks(taskId) {
    loading.value = true;
    try {
      const { data } = await api.get(`/tasks/${taskId}/links`);
      links.value = data;
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  async function addLink(taskId, targetId, relation) {
    const { data } = await api.post(`/tasks/${taskId}/links`, {
      target_id: targetId,
      relation,
    });
    links.value.push(data);
    return data;
  }

  async function deleteLink(taskId, linkId) {
    await api.delete(`/tasks/${taskId}/links/${linkId}`);
    links.value = links.value.filter((l) => l._id !== linkId);
  }

  function clearLinks() {
    links.value = [];
  }

  return { links, loading, fetchLinks, addLink, deleteLink, clearLinks };
});
