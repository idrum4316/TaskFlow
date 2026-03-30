<template>
  <div class="flex flex-col w-80 flex-shrink-0 min-h-0">
    <!-- Column header -->
    <div class="rounded-xl mb-2 flex-shrink-0 overflow-hidden" :style="{ backgroundColor: color + '0a' }">
      <div class="h-1 rounded-t-xl" :style="{ backgroundColor: color }" aria-hidden="true" />
      <div class="flex items-center justify-between px-3 py-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/80 dark:ring-zinc-900/80" :style="{ backgroundColor: color }" aria-hidden="true" />
          <h3 class="font-semibold text-sm text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">{{ title }}</h3>
          <span class="text-xs font-medium rounded-full px-2 py-0.5 tabular-nums min-w-[1.5rem] text-center" :style="{ backgroundColor: color + '18', color: color }">
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
    </div>

    <!-- Cards container -->
    <div
      ref="columnEl"
      :data-drop-status="status"
      :class="['flex flex-col gap-2.5 p-1.5 rounded-xl flex-1 min-h-0 overflow-y-auto transition-all duration-200', isHighlighted ? 'bg-brand-50/60 dark:bg-brand-900/20 ring-2 ring-brand-400/50 ring-inset' : 'bg-transparent']"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="loading && tasks.length === 0" aria-busy="true" aria-label="Loading tasks" class="space-y-2.5">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" aria-hidden="true" />
      </div>

      <template v-for="(task, idx) in tasks" :key="task._id">
        <!-- Drop indicator before this card -->
        <div
          v-if="dropIndex === idx"
          class="h-1 flex-shrink-0 rounded-full bg-brand-500 mx-1"
          aria-hidden="true"
        />
        <KanbanCard
          :task="task"
          :status-color="color"
          :data-task-id="task._id"
          @edit="$emit('edit', task)"
          @delete="$emit('delete', task._id)"
        />
      </template>
      <!-- Drop indicator at the end -->
      <div
        v-if="dropIndex === tasks.length"
        class="h-1 flex-shrink-0 rounded-full bg-brand-500 mx-1"
        aria-hidden="true"
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
import { touchDragState } from '@/composables/useTouchDragDrop';

const POSITION_GAP = 10000;
const canEdit = inject('canEdit', true);

const props = defineProps({
  title: { type: String, required: true },
  status: { type: String, required: true },
  color: { type: String, default: '#a1a1aa' },
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['add', 'edit', 'delete', 'reorder']);

const columnEl = ref(null);
const dragOver = ref(false);
const dropIndex = ref(null);
const touchHover = computed(() => touchDragState.dragging && touchDragState.hoverStatus === props.status);
const isHighlighted = computed(() => dragOver.value || touchHover.value);

function getDropIndex(y) {
  if (!columnEl.value) return props.tasks.length;
  const cards = columnEl.value.querySelectorAll('[data-task-id]');
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (y < midY) return i;
  }
  return props.tasks.length;
}

function computePosition(targetIndex) {
  const sorted = props.tasks;
  if (sorted.length === 0) return POSITION_GAP;
  if (targetIndex <= 0) return (sorted[0].position ?? 0) - POSITION_GAP;
  if (targetIndex >= sorted.length) return (sorted[sorted.length - 1].position ?? 0) + POSITION_GAP;
  const before = sorted[targetIndex - 1].position ?? 0;
  const after = sorted[targetIndex].position ?? 0;
  return Math.round((before + after) / 2);
}

function onDragOver(e) {
  dragOver.value = true;
  dropIndex.value = getDropIndex(e.clientY);
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    // When hovering over a native scrollbar, relatedTarget is null and a
    // dragleave fires even though the cursor is still inside the column.
    // Guard against that by checking the cursor is actually outside the rect.
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      return;
    }
    dragOver.value = false;
    dropIndex.value = null;
  }
}

function onDrop(e) {
  const idx = dropIndex.value ?? props.tasks.length;
  dragOver.value = false;
  dropIndex.value = null;
  const taskId = e.dataTransfer.getData('taskId');
  if (!taskId) return;

  // If dropping the same task in the same position, skip
  const currentIdx = props.tasks.findIndex((t) => t._id === taskId);
  if (currentIdx !== -1 && (currentIdx === idx || currentIdx === idx - 1)) return;

  // If the dragged task is from this column, adjust index
  let adjustedIdx = idx;
  if (currentIdx !== -1 && currentIdx < idx) adjustedIdx--;

  // Filter out the dragged task to compute position correctly
  const remaining = props.tasks.filter((t) => t._id !== taskId);
  const position = computePositionFromList(remaining, adjustedIdx);

  emit('reorder', { id: taskId, status: props.status, position });
}

function computePositionFromList(sortedTasks, targetIndex) {
  if (sortedTasks.length === 0) return POSITION_GAP;
  if (targetIndex <= 0) return (sortedTasks[0].position ?? 0) - POSITION_GAP;
  if (targetIndex >= sortedTasks.length) return (sortedTasks[sortedTasks.length - 1].position ?? 0) + POSITION_GAP;
  const before = sortedTasks[targetIndex - 1].position ?? 0;
  const after = sortedTasks[targetIndex].position ?? 0;
  return Math.round((before + after) / 2);
}
</script>
