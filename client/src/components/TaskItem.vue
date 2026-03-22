<template>
  <li class="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow border-l-[3px]" :style="{ borderLeftColor: statusColor }">
    <!-- Priority indicator -->
    <div class="flex-shrink-0 mt-0.5">
      <span :class="['w-2.5 h-2.5 rounded-full block mt-1', priorityColor]" :title="task.priority" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <h3
          :class=\"['font-medium text-gray-900 truncate', isDone && 'line-through text-gray-400']\"
        >
          {{ task.title }}
        </h3>
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
import { computed, inject } from 'vue';

const props = defineProps({
  task: { type: Object, required: true },
  statuses: { type: Array, default: () => [] },
});
defineEmits(['edit', 'delete']);

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
