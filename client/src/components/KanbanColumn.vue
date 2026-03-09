<template>
  <div class="flex flex-col w-96 flex-shrink-0">
    <!-- Column header -->
    <div :class="['flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-2', headerStyle]">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-sm" :class="headerTextColor">{{ title }}</h3>
        <span class="text-xs font-medium bg-white/70 dark:bg-zinc-800/70 rounded-full px-2 py-0.5 text-zinc-600 dark:text-zinc-300 tabular-nums">
          {{ tasks.length }}
        </span>
      </div>
      <button
        v-if="canEdit"
        @click="$emit('add', status)"
        :class="['w-7 h-7 rounded-lg flex items-center justify-center text-base font-medium transition-colors', addBtnStyle]"
        :aria-label="`Add task to ${title}`"
      >
        +
      </button>
    </div>

    <!-- Cards container -->
    <div
      :class="['flex flex-col gap-2 p-2 rounded-b-xl min-h-24 flex-1 transition-colors', columnBg, dragOver ? 'ring-2 ring-inset ring-brand-400 brightness-95' : '']"
      @dragover.prevent="dragOver = true"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="loading && tasks.length === 0" aria-busy="true" aria-label="Loading tasks" class="space-y-2">
        <div v-for="i in 2" :key="i" class="h-16 rounded-xl bg-white/60 dark:bg-zinc-700/60 animate-pulse" aria-hidden="true" />
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
        v-if="!loading && canEdit"
        @click="$emit('add', status)"
        :class="['w-full py-2 mt-auto text-xs font-medium rounded-xl transition-colors border border-dashed', addAreaStyle]"
        :aria-label="`Add task to ${title}`"
      >
        + Add task
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
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

const STYLES = {
  'todo': {
    headerStyle: 'border-zinc-400 bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-700/80',
    headerTextColor: 'text-zinc-700 dark:text-zinc-300',
    columnBg: 'bg-zinc-100/60 dark:bg-zinc-700/50',
    addBtnStyle: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-600',
    addAreaStyle: 'border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-600/60 dark:hover:border-zinc-500',
  },
  'in-progress': {
    headerStyle: 'border-brand-500 bg-brand-50/80 dark:border-brand-600 dark:bg-brand-900/40',
    headerTextColor: 'text-brand-800 dark:text-brand-300',
    columnBg: 'bg-brand-50/50 dark:bg-brand-900/25',
    addBtnStyle: 'text-brand-400 hover:text-brand-700 hover:bg-brand-100 dark:text-brand-500 dark:hover:text-brand-300 dark:hover:bg-brand-900/50',
    addAreaStyle: 'border-brand-200 text-brand-400 hover:text-brand-700 hover:bg-brand-100/60 hover:border-brand-300 dark:border-brand-700 dark:text-brand-500 dark:hover:text-brand-300 dark:hover:bg-brand-900/50 dark:hover:border-brand-600',
  },
  'done': {
    headerStyle: 'border-emerald-500 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-900/40',
    headerTextColor: 'text-emerald-800 dark:text-emerald-300',
    columnBg: 'bg-emerald-50/50 dark:bg-emerald-900/25',
    addBtnStyle: 'text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/50',
    addAreaStyle: 'border-emerald-200 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100/60 hover:border-emerald-300 dark:border-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-600',
  },
};

const s = computed(() => STYLES[props.status] || STYLES['todo']);
const headerStyle = computed(() => s.value.headerStyle);
const headerTextColor = computed(() => s.value.headerTextColor);
const columnBg = computed(() => s.value.columnBg);
const addBtnStyle = computed(() => s.value.addBtnStyle);
const addAreaStyle = computed(() => s.value.addAreaStyle);
</script>
