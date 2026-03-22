<template>
  <article
    draggable="true"
    @dragstart="onDragStart"
    @dragend="dragging = false"
    @touchstart="onTouchStart"
    @click="$emit('edit')"
    :data-task-id="task._id"
    :data-task-position="task.position ?? 0"
    class="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-150 cursor-pointer group shadow-sm hover:shadow-md overflow-hidden border-l-[3px]"
    :style="{ borderLeftColor: statusColor }"
    :class="{ 'opacity-50': isDone, 'opacity-40 scale-[0.97]': dragging || touchDragging }"
  >
    <div class="p-3">
      <!-- Priority accent + Title -->
      <div class="flex items-start gap-2">
        <span :class="['w-1 h-5 rounded-full flex-shrink-0 mt-0.5', priorityBar]" aria-hidden="true" />
        <p
          :class="[
            'text-sm font-medium leading-snug flex-1',
            isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100',
          ]"
        >
          {{ task.title }}
        </p>
      </div>

      <!-- Description preview -->
      <p v-if="task.description" class="mt-1.5 ml-3 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
        {{ task.description }}
      </p>

      <!-- Labels -->
      <div v-if="taskLabels.length" class="flex flex-wrap gap-1 mt-2 ml-3">
        <span
          v-for="l in taskLabels"
          :key="l.id"
          class="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white leading-tight"
          :style="{ backgroundColor: l.color }"
        >
          {{ l.name }}
        </span>
      </div>

      <!-- Metadata row: due date, priority, indicators -->
      <div class="flex items-center flex-wrap gap-1.5 mt-2.5 ml-3">
        <!-- Due date chip -->
        <span
          v-if="task.due_date"
          :class="[
            'inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-1.5 py-0.5 leading-tight',
            overdue
              ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              : dueSoon
                ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/60',
          ]"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {{ formatDate(task.due_date) }}
        </span>

        <!-- Priority badge -->
        <span :class="['inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-1.5 py-0.5 leading-tight', priorityBadge]">
          <span :class="['w-1.5 h-1.5 rounded-full', priorityDot]" aria-hidden="true" />
          {{ task.priority }}
        </span>

        <div class="flex-1" />

        <!-- Comment count indicator -->
        <span
          v-if="task.comment_count"
          class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500"
          :title="`${task.comment_count} comment${task.comment_count !== 1 ? 's' : ''}`"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {{ task.comment_count }}
        </span>

        <!-- Attachment count indicator -->
        <span
          v-if="task.attachment_count"
          class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500"
          :title="`${task.attachment_count} attachment${task.attachment_count !== 1 ? 's' : ''}`"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          {{ task.attachment_count }}
        </span>

        <!-- Has description indicator (when no description shown) -->
        <span
          v-if="!task.description && hasSubtleDescription"
          class="inline-flex items-center text-[11px] text-zinc-300 dark:text-zinc-600"
          title="Has description"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { startTouchDrag, touchDragState } from '@/composables/useTouchDragDrop';

const props = defineProps({
  task: { type: Object, required: true },
  statusColor: { type: String, default: '#a1a1aa' },
});
defineEmits(['edit', 'delete']);

const touchDragging = computed(() => touchDragState.dragging && touchDragState.taskId === props.task._id);

function onTouchStart(e) {
  startTouchDrag(e, props.task._id);
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

const dragging = ref(false);

function onDragStart(e) {
  dragging.value = true;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('taskId', props.task._id);
}

const priorityBar = computed(() => ({
  low: 'bg-zinc-300 dark:bg-zinc-600',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}[props.task.priority] || 'bg-zinc-300'));

const priorityDot = computed(() => ({
  low: 'bg-zinc-400 dark:bg-zinc-500',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}[props.task.priority] || 'bg-zinc-400'));

const priorityBadge = computed(() => ({
  low: 'bg-zinc-100 dark:bg-zinc-700/80 text-zinc-500 dark:text-zinc-400',
  medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  high: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
}[props.task.priority] || 'bg-zinc-100 dark:bg-zinc-700/80 text-zinc-500 dark:text-zinc-400'));

const overdue = computed(() =>
  !!props.task.due_date &&
  !isDone.value &&
  new Date(props.task.due_date + 'T00:00:00') < new Date()
);

const dueSoon = computed(() => {
  if (!props.task.due_date || isDone.value || overdue.value) return false;
  const due = new Date(props.task.due_date + 'T00:00:00');
  const now = new Date();
  const diffDays = (due - now) / (1000 * 60 * 60 * 24);
  return diffDays <= 2;
});

const hasSubtleDescription = false; // reserved for future use

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
