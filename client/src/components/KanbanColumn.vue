<template>
  <div class="flex flex-col w-80 flex-shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between px-3 py-2 mb-2">
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full flex-shrink-0', statusDot]" aria-hidden="true" />
        <h3 class="font-semibold text-sm text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">{{ title }}</h3>
        <span class="text-xs font-medium bg-zinc-200/80 dark:bg-zinc-700 rounded-full px-2 py-0.5 text-zinc-500 dark:text-zinc-400 tabular-nums min-w-[1.5rem] text-center">
          {{ tasks.length }}
        </span>
      </div>
      <button
        v-if="canEdit"
        @click="$emit('add', status)"
        class="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        :aria-label="`Add task to ${title}`"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>

    <!-- Cards container -->
    <div
      :class="['flex flex-col gap-2.5 p-1.5 rounded-xl min-h-32 flex-1 transition-all duration-200', dragOver ? 'bg-brand-50/60 dark:bg-brand-900/20 ring-2 ring-brand-400/50 ring-inset' : 'bg-transparent']"
      @dragover.prevent="dragOver = true"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="loading && tasks.length === 0" aria-busy="true" aria-label="Loading tasks" class="space-y-2.5">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" aria-hidden="true" />
      </div>

      <KanbanCard
        v-for="task in tasks"
        :key="task._id"
        :task="task"
        @edit="$emit('edit', task)"
        @delete="$emit('delete', task._id)"
        @status-change="(s) => $emit('status-change', { id: task._id, status: s })"
      />

      <button
        v-if="!loading && canEdit && tasks.length === 0"
        @click="$emit('add', status)"
        class="w-full py-6 text-xs font-medium rounded-lg transition-colors border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
        :aria-label="`Add task to ${title}`"
      >
        + Add a task
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import KanbanCard from './KanbanCard.vue';

const canEdit = inject('canEdit', true);

const props = defineProps({
  title: { type: String, required: true },
  status: { type: String, required: true },
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['add', 'edit', 'delete', 'status-change']);

const dragOver = ref(false);

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) dragOver.value = false;
}

function onDrop(e) {
  dragOver.value = false;
  const taskId = e.dataTransfer.getData('taskId');
  if (taskId) emit('status-change', { id: taskId, status: props.status });
}

const statusDot = computed(() => ({
  'todo': 'bg-zinc-400 dark:bg-zinc-500',
  'in-progress': 'bg-brand-500',
  'done': 'bg-emerald-500',
}[props.status] || 'bg-zinc-400'));
</script>
