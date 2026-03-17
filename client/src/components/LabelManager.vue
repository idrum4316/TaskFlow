<template>
  <div class="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Manage labels">
    <div class="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in" @click="$emit('close')" aria-hidden="true" />

    <div class="relative ml-auto w-full max-w-md bg-white dark:bg-zinc-900 shadow-drawer flex flex-col h-full animate-slide-in-right">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Manage Labels</h2>
          <p class="text-xs mt-0.5">
            <span v-if="saving" class="text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1">
              <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Saving…
            </span>
            <span v-else-if="saved" class="text-emerald-500 dark:text-emerald-400">Saved</span>
            <span v-else class="text-zinc-400 dark:text-zinc-500">Create labels to categorise tasks</span>
          </p>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Label list -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <div
          v-for="(label, index) in localLabels"
          :key="label.id"
          class="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3"
        >
          <!-- Color picker -->
          <label class="flex-shrink-0 cursor-pointer">
            <input
              type="color"
              :value="label.color"
              @input="label.color = $event.target.value"
              class="sr-only"
            />
            <span
              class="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm block ring-1 ring-zinc-200 dark:ring-zinc-600"
              :style="{ backgroundColor: label.color }"
              :title="`Color: ${label.color}`"
            />
          </label>

          <!-- Name -->
          <input
            v-model="label.name"
            type="text"
            class="flex-1 min-w-0 text-sm font-medium bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            placeholder="Label name"
          />

          <!-- Move buttons -->
          <div class="flex flex-col gap-0.5 flex-shrink-0">
            <button
              :disabled="index === 0"
              @click="moveUp(index)"
              class="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-default"
              aria-label="Move up"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
            </button>
            <button
              :disabled="index === localLabels.length - 1"
              @click="moveDown(index)"
              class="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-default"
              aria-label="Move down"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          </div>

          <!-- Delete -->
          <button
            @click="removeLabel(index)"
            class="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
            aria-label="Remove label"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Empty state -->
        <p v-if="localLabels.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">
          No labels yet. Add one to get started.
        </p>

        <!-- Add new -->
        <button
          @click="addLabel"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Label
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onUnmounted } from 'vue';

const props = defineProps({
  labels: { type: Array, default: () => [] },
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
  saveFn: { type: Function, required: true },
});

const emit = defineEmits(['close']);

const saving = ref(false);
const saved = ref(false);
const localLabels = reactive(props.labels.map((l) => ({ ...l })));

let saveTimer = null;
let savedTimer = null;

const isValid = computed(() => {
  const ids = new Set();
  for (const l of localLabels) {
    if (!l.id || !l.name.trim() || !l.color) return false;
    if (ids.has(l.id)) return false;
    ids.add(l.id);
  }
  return true;
});

// Auto-save watcher
watch(localLabels, () => {
  if (!isValid.value) return;
  scheduleSave();
}, { deep: true });

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 800);
}

async function doSave() {
  if (!isValid.value || saving.value) return;
  saving.value = true;
  saved.value = false;
  clearTimeout(savedTimer);
  try {
    await props.saveFn({
      labels: localLabels.map((l) => ({ id: l.id, name: l.name.trim(), color: l.color })),
    });
    saved.value = true;
    savedTimer = setTimeout(() => { saved.value = false; }, 2000);
  } finally {
    saving.value = false;
  }
}

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    if (isValid.value && !saving.value) {
      props.saveFn({
        labels: localLabels.map((l) => ({ id: l.id, name: l.name.trim(), color: l.color })),
      });
    }
  }
  clearTimeout(savedTimer);
});

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a1a1aa'];

function addLabel() {
  const num = localLabels.length + 1;
  let id = `label-${num}`;
  const existingIds = new Set(localLabels.map((l) => l.id));
  let counter = num;
  while (existingIds.has(id)) {
    counter++;
    id = `label-${counter}`;
  }
  localLabels.push({
    id,
    name: '',
    color: COLORS[localLabels.length % COLORS.length],
  });
}

function removeLabel(index) {
  localLabels.splice(index, 1);
}

function moveUp(index) {
  if (index > 0) {
    const item = localLabels.splice(index, 1)[0];
    localLabels.splice(index - 1, 0, item);
  }
}

function moveDown(index) {
  if (index < localLabels.length - 1) {
    const item = localLabels.splice(index, 1)[0];
    localLabels.splice(index + 1, 0, item);
  }
}
</script>
