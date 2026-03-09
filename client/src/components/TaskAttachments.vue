<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Attachments
        <span class="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-1">({{ attachments.length }}/{{ maxAttachments }})</span>
      </label>
    </div>

    <!-- Upload area -->
    <div
      v-if="!readOnly"
      class="relative"
    >
      <div
        :class="[
          'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
        ]"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
      >
        <svg class="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 5.345A4.5 4.5 0 0118 19.5H6.75z" />
        </svg>
        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span v-if="uploading" class="text-indigo-600 dark:text-indigo-400">Uploading…</span>
          <span v-else>Drop a file here or <span class="text-indigo-600 dark:text-indigo-400 font-medium">browse</span></span>
        </p>
        <p class="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
          PDF, Office, images, TXT, CSV · Max 25 MB
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="acceptTypes"
        @change="handleFileSelect"
      />
    </div>

    <!-- Upload error -->
    <div
      v-if="error"
      class="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg"
      role="alert"
    >
      <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <svg class="w-5 h-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- File list -->
    <ul v-else-if="attachments.length" class="space-y-2">
      <li
        v-for="att in attachments"
        :key="att._id"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 group"
      >
        <!-- File icon -->
        <div class="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center" :class="fileIconBg(att.mimetype)">
          <component :is="fileIconSvg(att.mimetype)" class="w-4 h-4 text-white" />
        </div>

        <!-- File info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ att.filename }}</p>
          <p class="text-[10px] text-zinc-400 dark:text-zinc-500">{{ formatSize(att.size) }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click.stop="download(att)"
            class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
            title="Download"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
          <button
            v-if="!readOnly"
            type="button"
            @click.stop="remove(att)"
            class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <p v-else class="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
      No attachments yet
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useAttachmentsStore } from '@/stores/attachments';

const props = defineProps({
  taskId: { type: String, required: true },
  readOnly: { type: Boolean, default: false },
});

const store = useAttachmentsStore();
const fileInput = ref(null);
const dragOver = ref(false);
const maxAttachments = 10;
const deleting = ref(new Set());

const acceptTypes = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg';

const attachments = computed(() => store.attachments);
const loading = computed(() => store.loading);
const uploading = computed(() => store.uploading);
const error = computed(() => store.error);

onMounted(() => {
  store.fetchAttachments(props.taskId);
});

onUnmounted(() => {
  store.clearAttachments();
});

async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) await uploadFile(file);
  if (fileInput.value) fileInput.value.value = '';
}

function handleDrop(e) {
  dragOver.value = false;
  const file = e.dataTransfer.files?.[0];
  if (file) uploadFile(file);
}

async function uploadFile(file) {
  try {
    await store.uploadAttachment(props.taskId, file);
  } catch {
    // error is set in store
  }
}

async function download(att) {
  try {
    const url = await store.getDownloadUrl(props.taskId, att._id);
    window.open(url, '_blank');
  } catch {
    // silently fail
  }
}

async function remove(att) {
  if (deleting.value.has(att._id)) return;
  deleting.value.add(att._id);
  try {
    await store.deleteAttachment(props.taskId, att._id);
  } catch {
    // silently fail
  } finally {
    deleting.value.delete(att._id);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileIconBg(mimetype) {
  if (mimetype?.startsWith('image/')) return 'bg-purple-500';
  if (mimetype === 'application/pdf') return 'bg-red-500';
  if (mimetype?.includes('spreadsheet') || mimetype?.includes('excel') || mimetype === 'text/csv') return 'bg-green-600';
  if (mimetype?.includes('word') || mimetype === 'application/msword') return 'bg-blue-600';
  return 'bg-zinc-500';
}

// Simple inline SVG icons as render functions
const ImageIcon = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z' })]) };
const DocIcon = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' })]) };

function fileIconSvg(mimetype) {
  if (mimetype?.startsWith('image/')) return ImageIcon;
  return DocIcon;
}
</script>
