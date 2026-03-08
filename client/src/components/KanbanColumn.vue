<template>
  <div class="flex flex-col w-72 flex-shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span :class="['w-2.5 h-2.5 rounded-full', headerDot]" />
        <h3 class="font-semibold text-gray-700 text-sm">{{ title }}</h3>
        <span class="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {{ tasks.length }}
        </span>
      </div>
      <button
        @click="$emit('add', status)"
        class="text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg w-6 h-6 flex items-center justify-center transition-colors"
        title="Add task"
      >
        +
      </button>
    </div>

    <!-- Cards -->
    <div class="flex flex-col gap-2 min-h-[4rem]">
      <div v-if="loading && tasks.length === 0" class="text-xs text-gray-400 text-center py-4">Loading…</div>

      <KanbanCard
        v-for="task in tasks"
        :key="task._id"
        :task="task"
        @edit="$emit('edit', task)"
        @delete="$emit('delete', task._id)"
        @status-change="(s) => $emit('status-change', { id: task._id, status: s })"
      />

      <button
        v-if="!loading"
        @click="$emit('add', status)"
        class="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border-2 border-dashed border-gray-200 hover:border-gray-300"
      >
        + Add task
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KanbanCard from './KanbanCard.vue';

const props = defineProps({
  title: { type: String, required: true },
  status: { type: String, required: true },
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['add', 'edit', 'delete', 'status-change']);

const headerDot = computed(() => ({
  todo: 'bg-gray-400',
  'in-progress': 'bg-blue-500',
  done: 'bg-green-500',
}[props.status]));
</script>
