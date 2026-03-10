<template>
  <div class="flex gap-3 sm:gap-5 p-3 sm:p-5 overflow-x-auto flex-1 items-start scroll-smooth">
    <KanbanColumn
      v-for="col in columns"
      :key="col.status"
      :title="col.title"
      :status="col.status"
      :color="col.color"
      :tasks="tasksByStatus[col.status] || []"
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

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
});

defineEmits(['add', 'edit', 'delete', 'status-change']);

const columns = computed(() => {
  const s = props.statuses.length ? props.statuses : DEFAULT_STATUSES;
  return s.map((st) => ({ status: st.id, title: st.label, color: st.color }));
});

const tasksByStatus = computed(() => {
  const map = {};
  for (const col of columns.value) {
    map[col.status] = [];
  }
  for (const task of props.tasks) {
    if (map[task.status]) {
      map[task.status].push(task);
    } else {
      // Tasks with a status that no longer exists — put in first column
      const first = columns.value[0]?.status;
      if (first && map[first]) map[first].push(task);
    }
  }
  return map;
});
</script>
