<template>
  <li class="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow border-l-[3px]" :style="{ borderLeftColor: statusColor }">
    <!-- Priority indicator / Recurrence checkbox -->
    <div class="flex-shrink-0 mt-0.5">
      <button
        v-if="task.recurrence && task.due_date"
        @click.stop="completeOccurrence"
        :disabled="completing"
        class="group/complete w-6 h-6 rounded-full border-2 border-gray-300 dark:border-zinc-500 flex items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-400 dark:hover:bg-brand-900/40 hover:scale-110 transition-all duration-150 disabled:opacity-50"
        title="Mark complete"
      >
        <svg class="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 opacity-0 group-hover/complete:opacity-100 transition-opacity duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </button>
      <span v-else :class="['w-2.5 h-2.5 rounded-full block mt-1', priorityColor]" :title="task.priority" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <h3
          :class=\"['font-medium text-gray-900 truncate', isDone && 'line-through text-gray-400']\"
        >
          {{ task.title }}          <span
            v-if="task.recurrence"
            class="inline-flex items-center ml-1 text-brand-500 dark:text-brand-400"
            :title="describeRecurrence(task.recurrence)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.652v4.992" />
            </svg>
          </span>        </h3>
        <span class="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" :style="statusStyle">
          {{ statusLabel }}
        </span>
      </div>

      <p v-if="task.description" class="mt-1 text-sm text-gray-500 line-clamp-2">{{ task.description }}</p>

      <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span v-if="task.due_date">Due {{ formatDate(task.due_date) }}</span>
        <span class="capitalize">{{ task.priority }} priority</span>
      </div>

      <!-- Labels -->
      <div v-if="taskLabels.length" class="mt-2 flex flex-wrap gap-1">
        <span
          v-for="l in taskLabels"
          :key="l.id"
          class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
          :style="{ backgroundColor: l.color }"
        >
          {{ l.name }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex-shrink-0 flex flex-col gap-1">
      <button
        @click="$emit('edit')"
        class="text-xs text-gray-400 hover:text-brand-600 transition-colors px-2 py-1 rounded hover:bg-brand-50"
      >
        Edit
      </button>
      <button
        @click="$emit('delete')"
        class="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  </li>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { describeRecurrence } from '@/utils/recurrence';
import { useTasksStore } from '@/stores/tasks';

const props = defineProps({
  task: { type: Object, required: true },
  statuses: { type: Array, default: () => [] },
});
defineEmits(['edit', 'delete']);

const tasksStore = useTasksStore();
const completing = ref(false);

async function completeOccurrence() {
  if (completing.value) return;
  completing.value = true;
  try {
    await tasksStore.completeOccurrence(props.task._id);
  } finally {
    completing.value = false;
  }
}

const doneStatusIds = inject('doneStatusIds', computed(() => new Set(['done'])));
const isDone = computed(() => doneStatusIds.value.has(props.task.status));

const boardLabels = inject('boardLabels', computed(() => []));

const labelMap = computed(() => {
  const map = {};
  for (const l of boardLabels.value) map[l.id] = l;
  return map;
});

const taskLabels = computed(() =>
  (props.task.labels || []).map((id) => labelMap.value[id]).filter(Boolean)
);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const statusList = computed(() =>
  props.statuses.length ? props.statuses : DEFAULT_STATUSES
);

const statusMap = computed(() => {
  const map = {};
  for (const s of statusList.value) map[s.id] = s;
  return map;
});

const priorityColor = computed(() => ({
  low: 'bg-gray-300',
  medium: 'bg-yellow-400',
  high: 'bg-red-500',
}[props.task.priority] || 'bg-gray-300'));

const statusLabel = computed(() => {
  return statusMap.value[props.task.status]?.label || props.task.status;
});

const statusStyle = computed(() => {
  const s = statusMap.value[props.task.status];
  if (!s) return { backgroundColor: '#f4f4f5', color: '#71717a' };
  return { backgroundColor: s.color + '30', color: s.color };
});

const statusColor = computed(() => {
  const s = statusMap.value[props.task.status];
  return s?.color || '#a1a1aa';
});

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
