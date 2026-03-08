<template>
  <div class="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
    <KanbanColumn
      v-for="col in columns"
      :key="col.status"
      :title="col.title"
      :status="col.status"
      :tasks="tasksByStatus[col.status]"
      :loading="loading"
      @add="$emit('add', col.status)"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @status-change="$emit('status-change', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KanbanColumn from './KanbanColumn.vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['add', 'edit', 'delete', 'status-change']);

const columns = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

const tasksByStatus = computed(() => {
  const map = { todo: [], 'in-progress': [], done: [] };
  for (const task of props.tasks) {
    if (map[task.status]) map[task.status].push(task);
  }
  return map;
});
</script>
