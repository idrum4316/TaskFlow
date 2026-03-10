<template>
  <div class="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Manage statuses">
    <div class="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in" @click="$emit('close')" aria-hidden="true" />

    <div class="relative ml-auto w-full max-w-md bg-white dark:bg-zinc-900 shadow-drawer flex flex-col h-full animate-slide-in-right">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Manage Statuses</h2>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Add, remove, or reorder columns</p>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Status list -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <div
          v-for="(status, index) in localStatuses"
          :key="status.id"
          class="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3"
        >
          <!-- Color picker -->
          <label class="flex-shrink-0 cursor-pointer">
            <input
              type="color"
              :value="status.color"
              @input="status.color = $event.target.value"
              class="sr-only"
            />
            <span
              class="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm block ring-1 ring-zinc-200 dark:ring-zinc-600"
              :style="{ backgroundColor: status.color }"
              :title="`Color: ${status.color}`"
            />
          </label>

          <!-- Label -->
          <input
            v-model="status.label"
            type="text"
            class="flex-1 min-w-0 text-sm font-medium bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            placeholder="Status name"
          />

          <!-- Done toggle -->
          <label class="flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none" :title="status.done ? 'Treated as completed' : 'Mark as a completed state'">
            <input
              type="checkbox"
              v-model="status.done"
              class="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500/30"
            />
            <span class="text-[11px] font-medium" :class="status.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'">Done</span>
          </label>

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
              :disabled="index === localStatuses.length - 1"
              @click="moveDown(index)"
              class="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-default"
              aria-label="Move down"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          </div>

          <!-- Delete -->
          <button
            @click="removeStatus(index)"
            :disabled="localStatuses.length <= 1"
            class="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-default flex-shrink-0"
            aria-label="Remove status"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Add new -->
        <button
          @click="addStatus"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Status
        </button>

        <!-- Reassignment dialog -->
        <Teleport to="body">
          <div v-if="pendingDelete" class="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Reassign tasks">
            <div class="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" @click="cancelDelete" aria-hidden="true" />
            <div class="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Reassign Tasks</h3>
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                <span class="font-medium text-zinc-800 dark:text-zinc-200">"{{ pendingDelete.label }}"</span>
                has <span class="font-semibold">{{ pendingDelete.taskCount }}</span>
                {{ pendingDelete.taskCount === 1 ? 'task' : 'tasks' }}. Choose a status to move them to:
              </p>
              <select
                v-model="pendingDelete.targetStatusId"
                class="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
              >
                <option value="" disabled>Select a status…</option>
                <option
                  v-for="s in localStatuses.filter(st => st.id !== pendingDelete.statusId)"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.label || s.id }}
                </option>
              </select>
              <div class="flex items-center gap-3 pt-1">
                <button type="button" @click="cancelDelete" class="btn-secondary flex-1">Cancel</button>
                <button
                  type="button"
                  :disabled="!pendingDelete.targetStatusId"
                  @click="confirmReassignAndDelete"
                  class="btn-primary flex-1"
                >
                  Reassign &amp; Delete
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-3 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/50">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button
          type="button"
          :disabled="saving || !isValid"
          class="btn-primary flex-1"
          @click="handleSave"
        >
          <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ saving ? 'Saving…' : 'Save statuses' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

const props = defineProps({
  statuses: { type: Array, required: true },
  tasks: { type: Array, default: () => [] },
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
});

const emit = defineEmits(['close', 'save']);

const saving = ref(false);
const localStatuses = reactive(props.statuses.map((s) => ({ ...s })));
const originalIds = new Set(props.statuses.map((s) => s.id));

// Track reassignments: statusId -> targetStatusId
const reassignments = reactive({});

// Pending deletion that needs reassignment
const pendingDelete = ref(null); // { index, statusId, label, taskCount }

const taskCountByStatus = computed(() => {
  const counts = {};
  for (const t of props.tasks) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }
  return counts;
});

const removedStatusIds = computed(() => {
  const currentIds = new Set(localStatuses.map((s) => s.id));
  return [...originalIds].filter((id) => !currentIds.has(id));
});

const isValid = computed(() => {
  if (localStatuses.length === 0) return false;
  const ids = new Set();
  for (const s of localStatuses) {
    if (!s.id || !s.label.trim() || !s.color) return false;
    if (ids.has(s.id)) return false;
    ids.add(s.id);
  }
  return true;
});

const COLORS = ['#a1a1aa', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

function addStatus() {
  const num = localStatuses.length + 1;
  let id = `status-${num}`;
  const existingIds = new Set(localStatuses.map((s) => s.id));
  let counter = num;
  while (existingIds.has(id)) {
    counter++;
    id = `status-${counter}`;
  }
  localStatuses.push({
    id,
    label: '',
    color: COLORS[localStatuses.length % COLORS.length],
    done: false,
  });
}

function removeStatus(index) {
  if (localStatuses.length <= 1) return;
  const status = localStatuses[index];
  const count = taskCountByStatus.value[status.id] || 0;

  if (count === 0) {
    localStatuses.splice(index, 1);
    delete reassignments[status.id];
  } else {
    // Show reassignment picker
    pendingDelete.value = {
      index,
      statusId: status.id,
      label: status.label || status.id,
      taskCount: count,
      targetStatusId: '',
    };
  }
}

function confirmReassignAndDelete() {
  const pd = pendingDelete.value;
  if (!pd || !pd.targetStatusId) return;
  reassignments[pd.statusId] = pd.targetStatusId;
  localStatuses.splice(pd.index, 1);
  pendingDelete.value = null;
}

function cancelDelete() {
  pendingDelete.value = null;
}

function moveUp(index) {
  if (index > 0) {
    const item = localStatuses.splice(index, 1)[0];
    localStatuses.splice(index - 1, 0, item);
  }
}

function moveDown(index) {
  if (index < localStatuses.length - 1) {
    const item = localStatuses.splice(index, 1)[0];
    localStatuses.splice(index + 1, 0, item);
  }
}

async function handleSave() {
  if (!isValid.value) return;
  saving.value = true;
  try {
    await emit('save', {
      statuses: localStatuses.map((s) => ({ id: s.id, label: s.label.trim(), color: s.color, done: !!s.done })),
      reassignments: { ...reassignments },
    });
  } catch {
    saving.value = false;
  }
}
</script>
