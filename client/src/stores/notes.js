import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([]);
  const loading = ref(false);
  const saving = ref(false);

  async function fetchNotes(boardId) {
    loading.value = true;
    try {
      const { data } = await api.get(`/boards/${boardId}/notes`);
      notes.value = data;
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  async function fetchNote(boardId, noteId) {
    const { data } = await api.get(`/boards/${boardId}/notes/${noteId}`);
    const idx = notes.value.findIndex((n) => n._id === noteId);
    if (idx === -1) notes.value.unshift(data);
    else notes.value[idx] = data;
    return data;
  }

  async function createNote(boardId, payload) {
    saving.value = true;
    try {
      const { data } = await api.post(`/boards/${boardId}/notes`, payload);
      notes.value.unshift(data);
      return data;
    } finally {
      saving.value = false;
    }
  }

  async function updateNote(boardId, noteId, payload) {
    saving.value = true;
    try {
      const { data } = await api.put(`/boards/${boardId}/notes/${noteId}`, payload);
      const idx = notes.value.findIndex((n) => n._id === noteId);
      if (idx !== -1) notes.value[idx] = data;
      return data;
    } finally {
      saving.value = false;
    }
  }

  async function deleteNote(boardId, noteId) {
    await api.delete(`/boards/${boardId}/notes/${noteId}`);
    notes.value = notes.value.filter((n) => n._id !== noteId);
  }

  function clearNotes() {
    notes.value = [];
  }

  return { notes, loading, saving, fetchNotes, fetchNote, createNote, updateNote, deleteNote, clearNotes };
});
