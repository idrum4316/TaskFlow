import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/client';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([]);
  const loading = ref(false);
  const saving = ref(false);

  function sortNotes() {
    notes.value = [...notes.value].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });
  }

  function upsertNote(note) {
    const idx = notes.value.findIndex((n) => n._id === note._id);
    if (idx === -1) notes.value.unshift(note);
    else notes.value[idx] = note;
    sortNotes();
  }

  function removeNote(noteId) {
    notes.value = notes.value.filter((n) => n._id !== noteId);
  }

  async function fetchNotes(boardId) {
    loading.value = true;
    try {
      const { data } = await api.get(`/boards/${boardId}/notes`);
      notes.value = data;
      sortNotes();
    } catch {
      // non-critical
    } finally {
      loading.value = false;
    }
  }

  async function fetchNote(boardId, noteId) {
    const { data } = await api.get(`/boards/${boardId}/notes/${noteId}`);
    upsertNote(data);
    return data;
  }

  async function createNote(boardId, payload) {
    saving.value = true;
    try {
      const { data } = await api.post(`/boards/${boardId}/notes`, payload);
      upsertNote(data);
      return data;
    } finally {
      saving.value = false;
    }
  }

  async function updateNote(boardId, noteId, payload) {
    saving.value = true;
    try {
      const { data } = await api.put(`/boards/${boardId}/notes/${noteId}`, payload);
      upsertNote(data);
      return data;
    } finally {
      saving.value = false;
    }
  }

  async function deleteNote(boardId, noteId) {
    await api.delete(`/boards/${boardId}/notes/${noteId}`);
    removeNote(noteId);
  }

  function clearNotes() {
    notes.value = [];
  }

  return { notes, loading, saving, fetchNotes, fetchNote, createNote, updateNote, deleteNote, clearNotes, upsertNote, removeNote, sortNotes };
});
