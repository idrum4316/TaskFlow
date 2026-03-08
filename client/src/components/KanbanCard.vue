<template>
  <div
    class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    @click="$emit('edit')"
  >
    <!-- Priority bar -->
    <div class="flex items-start gap-2 mb-2">
      <span :class="['mt-1 w-2 h-2 rounded-full flex-shrink-0', priorityColor]" :title="task.priority" />
      <p class="text-sm font-medium text-gray-900 leading-snug flex-1">{{ task.title }}</p>
    </div>

    <p v-if="task.description" class="text-xs text-gray-500 mb-2 line-clamp-2 ml-4">
      {{ task.description }}
    </p>

    <!-- Footer: due date + actions -->
    <div class="flex items-center mt-2 ml-4 gap-2">
      <span v-if="task.due_date" :class="['text-xs flex-1', overdue ? 'text-red-500' : 'text-gray-400']">
        {{ overdue ? '⚠ ' : '' }}Due {{ formatDate(task.due_date) }}
      </span>
      <span v-else class="flex-1" />

      <!-- Status move buttons (visible on hover) -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
        <button
          v-for="target in moveTargets"
          :key="target.status"
          @click="$emit('status-change', target.status)"
          :title="`Move to ${target.label}`"
          class="text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors"
        >
          {{ target.label }}
        </button>
        <button
          @click="$emit('delete')"
          title="Delete"
          class="text-xs text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ task: { type: Object, required: true } });
defineEmits(['edit', 'delete', 'status-change']);

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };

const priorityColor = computed(() => ({
  low: 'bg-gray-300',
  medium: 'bg-yellow-400',
  high: 'bg-red-500',
}[props.task.priority] || 'bg-gray-300'));

const overdue = computed(() => {
  if (!props.task.due_date) return false;
  return new Date(props.task.due_date) < new Date() && props.task.status !== 'done';
});

// Show buttons to move to the other two statuses
const moveTargets = computed(() =>
  Object.entries(STATUS_LABELS)
    .filter(([s]) => s !== props.task.status)
    .map(([status, label]) => ({ status, label }))
);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
