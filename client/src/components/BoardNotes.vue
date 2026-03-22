<template>
  <div class="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Board Notes">
    <div class="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in" @click="$emit('close')" aria-hidden="true" />

    <div class="relative ml-auto w-full max-w-lg bg-white dark:bg-zinc-900 shadow-drawer flex flex-col h-full animate-slide-in-right">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <button
            v-if="activeNote"
            @click="backToList"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            aria-label="Back to notes"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {{ activeNote ? (isEditing ? (editTitle || 'Untitled') : (activeNote.title || 'Untitled')) : 'Notes' }}
            </h2>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{{ boardName }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <!-- Edit / Done toggle (only when viewing a saved note with edit permission) -->
          <button
            v-if="activeNote && !isNew && canEdit"
            @click="toggleEditing"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            :aria-label="isEditing ? 'View note' : 'Edit note'"
          >
            <!-- Pencil icon when viewing -->
            <svg v-if="!isEditing" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <!-- Eye icon when editing -->
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Note list -->
      <div v-if="!activeNote" class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="notesStore.loading" class="px-6 py-8 space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!notesStore.notes.length" class="px-6 py-12 text-center">
          <svg class="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">No notes yet</p>
          <p class="text-xs text-zinc-400 dark:text-zinc-500">
            {{ canEdit ? 'Create a note to share knowledge with your team.' : 'Notes will appear here once created.' }}
          </p>
        </div>

        <!-- Notes list -->
        <ul v-else class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <li
            v-for="note in notesStore.notes"
            :key="note._id"
            @click="openNote(note)"
            class="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ note.title }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {{ note.username }} · {{ formatDate(note.updated_at) }}
              </p>
            </div>
            <button
              v-if="canDeleteNote(note)"
              @click.stop="confirmDelete(note)"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              aria-label="Delete note"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </li>
        </ul>

        <!-- Add note button -->
        <div v-if="canEdit" class="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <button
            @click="startCreate"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Note
          </button>
        </div>
      </div>

      <!-- Note view / editor -->
      <div v-else class="flex-1 overflow-y-auto flex flex-col">
        <div class="px-6 py-4 space-y-3 flex-1 flex flex-col">
          <!-- Error banner -->
          <div
            v-if="errorMsg"
            role="alert"
            class="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-lg"
          >
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Editing mode -->
          <template v-if="isEditing">
            <input
              v-model="editTitle"
              type="text"
              class="w-full text-lg font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 p-0 focus:ring-0"
              placeholder="Note title"
              @input="errorMsg = ''"
            />

            <div class="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <span>{{ activeNote.username }}</span>
              <span>·</span>
              <span>Updated {{ formatDate(activeNote.updated_at) }}</span>
            </div>

            <textarea
              ref="contentEl"
              v-model="editContent"
              class="input resize-none text-sm flex-1 min-h-[200px] leading-relaxed font-mono"
              placeholder="Write your note in Markdown…"
            />
          </template>

          <!-- View mode (rendered Markdown) -->
          <template v-else>
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ activeNote.title }}</h3>

            <div class="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <span>{{ activeNote.username }}</span>
              <span>·</span>
              <span>Updated {{ formatDate(activeNote.updated_at) }}</span>
            </div>

            <div
              v-if="renderedContent"
              class="note-prose flex-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed"
              v-html="renderedContent"
            />
            <p v-else class="text-sm text-zinc-400 dark:text-zinc-500 italic">No content</p>
          </template>
        </div>

        <!-- Save bar (editing mode only) -->
        <div v-if="isEditing && canEdit" class="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-3 flex-shrink-0">
          <span v-if="notesStore.saving" class="text-xs text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1">
            <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Saving…
          </span>
          <span v-else-if="saveSuccess" class="text-xs text-emerald-500 dark:text-emerald-400">Saved</span>
          <span v-else class="text-xs text-zinc-400 dark:text-zinc-500">{{ isNew ? 'New note' : 'Markdown supported' }}</span>
          <button
            @click="handleSave"
            :disabled="notesStore.saving"
            class="ml-auto text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-800 text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            {{ isNew ? 'Create' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div v-if="pendingDelete" class="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Delete note">
        <div class="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" @click="pendingDelete = null" aria-hidden="true" />
        <div class="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Delete Note</h3>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete <span class="font-medium text-zinc-800 dark:text-zinc-200">"{{ pendingDelete.title }}"</span>? This cannot be undone.
          </p>
          <div class="flex items-center gap-3 pt-1">
            <button type="button" @click="pendingDelete = null" class="btn-secondary flex-1">Cancel</button>
            <button type="button" @click="handleDelete" class="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNotesStore } from '@/stores/notes';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
});

defineEmits(['close']);

const notesStore = useNotesStore();
const authStore = useAuthStore();
const canEdit = inject('canEdit', computed(() => props.isOwner));

const activeNote = ref(null);
const isNew = ref(false);
const isEditing = ref(false);
const editTitle = ref('');
const editContent = ref('');
const saveSuccess = ref(false);
const errorMsg = ref('');
const pendingDelete = ref(null);
const contentEl = ref(null);

let savedTimer = null;

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

const currentUserId = computed(() => authStore.user?.sub || authStore.user?._id);

const renderedContent = computed(() => {
  const content = activeNote.value?.content;
  if (!content) return '';
  const raw = marked.parse(content);
  return DOMPurify.sanitize(raw);
});

onMounted(() => {
  notesStore.fetchNotes(props.boardId);
});

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function openNote(note) {
  activeNote.value = note;
  isNew.value = false;
  isEditing.value = false;
  editTitle.value = note.title;
  editContent.value = note.content || '';
  errorMsg.value = '';
}

function startCreate() {
  activeNote.value = { _id: null, username: authStore.user?.username || '', updated_at: new Date().toISOString() };
  isNew.value = true;
  isEditing.value = true;
  editTitle.value = '';
  editContent.value = '';
  errorMsg.value = '';
  nextTick(() => contentEl.value?.focus());
}

function toggleEditing() {
  if (isEditing.value) {
    // Switching to view mode — sync edits into activeNote for rendering
    activeNote.value = { ...activeNote.value, title: editTitle.value, content: editContent.value };
  } else {
    // Switching to edit mode — populate fields
    editTitle.value = activeNote.value.title;
    editContent.value = activeNote.value.content || '';
  }
  isEditing.value = !isEditing.value;
  errorMsg.value = '';
}

function backToList() {
  activeNote.value = null;
  isNew.value = false;
  isEditing.value = false;
  editTitle.value = '';
  editContent.value = '';
  saveSuccess.value = false;
  errorMsg.value = '';
  clearTimeout(savedTimer);
}

function canDeleteNote(note) {
  return props.isOwner || note.user_id === currentUserId.value;
}

function confirmDelete(note) {
  pendingDelete.value = note;
}

async function handleDelete() {
  const note = pendingDelete.value;
  if (!note) return;
  try {
    await notesStore.deleteNote(props.boardId, note._id);
    pendingDelete.value = null;
    if (activeNote.value?._id === note._id) backToList();
  } catch {
    // silent
  }
}

async function handleSave() {
  if (!editTitle.value.trim()) {
    errorMsg.value = 'A title is required.';
    return;
  }
  errorMsg.value = '';
  const payload = { title: editTitle.value.trim(), content: editContent.value.trim() };

  try {
    if (isNew.value) {
      const created = await notesStore.createNote(props.boardId, payload);
      activeNote.value = created;
      isNew.value = false;
      isEditing.value = false;
    } else {
      const updated = await notesStore.updateNote(props.boardId, activeNote.value._id, payload);
      activeNote.value = updated;
      isEditing.value = false;
    }
    saveSuccess.value = true;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { saveSuccess.value = false; }, 2000);
  } catch {
    errorMsg.value = 'Failed to save note. Please try again.';
  }
}
</script>

<style scoped>
.note-prose :deep(h1) { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
.note-prose :deep(h2) { font-size: 1.125rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
.note-prose :deep(h3) { font-size: 1rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.375rem; }
.note-prose :deep(p) { margin-bottom: 0.5rem; }
.note-prose :deep(ul) { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; }
.note-prose :deep(ol) { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.5rem; }
.note-prose :deep(li) { font-size: 0.875rem; margin-bottom: 0.125rem; }
.note-prose :deep(code) { font-size: 0.75rem; font-family: ui-monospace, monospace; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
.note-prose :deep(pre) { border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.5rem; overflow-x: auto; }
.note-prose :deep(pre code) { padding: 0; }
.note-prose :deep(blockquote) { border-left: 4px solid; padding-left: 0.75rem; font-style: italic; margin-bottom: 0.5rem; }
.note-prose :deep(a) { text-decoration: underline; }
.note-prose :deep(hr) { margin: 1rem 0; }
.note-prose :deep(table) { width: 100%; font-size: 0.875rem; border-collapse: collapse; margin-bottom: 0.5rem; }
.note-prose :deep(th),
.note-prose :deep(td) { padding: 0.375rem 0.75rem; text-align: left; }
.note-prose :deep(img) { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }

/* Light mode colors */
.note-prose :deep(code) { background: rgb(244 244 245); color: rgb(219 39 119); }
.note-prose :deep(pre) { background: rgb(244 244 245); }
.note-prose :deep(pre code) { background: transparent; color: rgb(39 39 42); }
.note-prose :deep(blockquote) { border-color: rgb(212 212 216); color: rgb(113 113 122); }
.note-prose :deep(a) { color: rgb(124 58 237); }
.note-prose :deep(a:hover) { color: rgb(109 40 217); }
.note-prose :deep(hr) { border-color: rgb(228 228 231); }
.note-prose :deep(th) { background: rgb(250 250 250); border: 1px solid rgb(212 212 216); font-weight: 600; }
.note-prose :deep(td) { border: 1px solid rgb(212 212 216); }

/* Dark mode colors */
:root.dark .note-prose :deep(code),
.dark .note-prose :deep(code) { background: rgb(39 39 42); color: rgb(244 114 182); }
:root.dark .note-prose :deep(pre),
.dark .note-prose :deep(pre) { background: rgb(39 39 42); }
:root.dark .note-prose :deep(pre code),
.dark .note-prose :deep(pre code) { background: transparent; color: rgb(228 228 231); }
:root.dark .note-prose :deep(blockquote),
.dark .note-prose :deep(blockquote) { border-color: rgb(82 82 91); color: rgb(161 161 170); }
:root.dark .note-prose :deep(a),
.dark .note-prose :deep(a) { color: rgb(167 139 250); }
:root.dark .note-prose :deep(a:hover),
.dark .note-prose :deep(a:hover) { color: rgb(196 181 253); }
:root.dark .note-prose :deep(hr),
.dark .note-prose :deep(hr) { border-color: rgb(63 63 70); }
:root.dark .note-prose :deep(th),
.dark .note-prose :deep(th) { background: rgb(39 39 42); border-color: rgb(82 82 91); }
:root.dark .note-prose :deep(td),
.dark .note-prose :deep(td) { border-color: rgb(82 82 91); }
</style>
