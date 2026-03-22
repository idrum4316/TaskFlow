<template>
  <div data-drag-scroll class="flex gap-3 sm:gap-5 p-3 sm:p-5 overflow-x-auto flex-1 min-h-0 overflow-y-hidden scroll-smooth">
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
      @reorder="$emit('reorder', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KanbanColumn from './KanbanColumn.vue';
import { useTouchDropHandler } from '@/composables/useTouchDragDrop';

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

const emit = defineEmits(['add', 'edit', 'delete', 'reorder']);

useTouchDropHandler((payload) => emit('reorder', payload));

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
  // Sort each column by position
  for (const col of columns.value) {
    map[col.status].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }
  return map;
});
</script>
