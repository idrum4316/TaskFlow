<template>
  <div data-drag-scroll class="px-3 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
    <!-- Loading skeleton -->
    <div v-if="loading && !tasks.length" class="space-y-1" aria-busy="true" aria-label="Loading tasks">
      <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-zinc-200/60 dark:bg-zinc-700/60 animate-pulse" aria-hidden="true" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!tasks.length" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3" aria-hidden="true">
        <svg class="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">No tasks yet</p>
      <p class="text-xs text-zinc-400 mt-1">Add your first task to get started</p>
      <button v-if="canEdit" @click="$emit('add', 'todo')" class="btn-primary mt-4 text-xs">
        Add first task
      </button>
    </div>

    <template v-else>
      <section v-for="group in groups" :key="group.status" class="mb-5">
        <!-- Group header -->
        <button
          class="flex items-center gap-2 w-full text-left mb-2 py-1.5 rounded-lg px-2 transition-colors group/header border-l-[3px]"
          :style="{ borderLeftColor: group.color, backgroundColor: group.color + '08' }"
          @click="toggleGroup(group.status)"
          :aria-expanded="!collapsed[group.status]"
          :aria-controls="`group-${group.status}`"
        >
          <div class="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/80 dark:ring-zinc-900/80" :style="{ backgroundColor: group.color }" aria-hidden="true" />
          <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{{ group.title }}</span>
          <span class="text-xs font-medium rounded-full px-2 py-0.5 tabular-nums" :style="{ backgroundColor: group.color + '18', color: group.color }">
            {{ group.tasks.length }}
          </span>
          <svg
            class="ml-auto w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-150"
            :class="collapsed[group.status] ? '' : 'rotate-90'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <ul
          v-if="!collapsed[group.status]"
          :id="`group-${group.status}`"
          :data-drop-status="group.status"
          class="space-y-1 rounded-xl transition-colors"
          :class="isGroupHighlighted(group.status) ? 'ring-2 ring-brand-400 bg-brand-50/40 dark:bg-brand-900/20' : ''"
          role="list"
          @dragover.prevent="onListDragOver($event, group.status)"
          @dragleave="onListDragLeave"
          @drop="onListDrop($event, group.status)"
        >
          <li
            v-if="group.tasks.length === 0"
            class="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors"
            :class="isGroupHighlighted(group.status)
              ? 'border-brand-300 bg-brand-50/60 dark:bg-brand-900/30 text-brand-400'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600'"
            aria-hidden="true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
            <span class="text-sm font-medium">Drop here</span>
          </li>

          <li
            v-for="(task, idx) in group.tasks"
            :key="task._id"
            draggable="true"
            @dragstart="onListDragStart($event, task._id)"
            @dragend="draggingId = null"
            @touchstart="onListTouchStart($event, task._id)"
            @click="$emit('edit', task)"
            :data-task-id="task._id"
            :data-task-position="task.position ?? 0"
            class="flex items-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-card transition-all duration-150 group/row cursor-pointer border-l-[3px]"
            :style="listItemStyle(task, group.color)"
            :class="[
              isItemDragging(task._id) ? 'opacity-40' : '',
              dropTarget === group.status && dropListIndex === idx ? 'ring-t-2 ring-brand-500' : '',
              task.priority === 'critical' && !isDoneStatus(task.status) ? 'critical-glow' : '',
            ]"
          >
            <!-- Priority bar / Recurrence checkbox -->
            <button
              v-if="task.recurrence && task.due_date"
              @click.stop="completeOccurrence(task, $event)"
              :disabled="completingId === task._id"
              class="group/complete w-6 h-6 flex-shrink-0 rounded-full border-2 border-zinc-300 dark:border-zinc-500 flex items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-400 dark:hover:bg-brand-900/40 hover:scale-110 transition-all duration-150 disabled:opacity-50"
              title="Mark complete"
            >
              <svg class="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 opacity-0 group-hover/complete:opacity-100 transition-opacity duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
            <div v-else :class="['w-1 h-8 rounded-full flex-shrink-0', priorityBar(task.priority)]" aria-hidden="true" />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <span
                :class="[
                  'text-sm font-medium block truncate',
                  isDoneStatus(task.status) ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100',
                ]"
              >
                {{ task.title }}
              </span>
              <span v-if="task.description" class="text-xs text-zinc-400 dark:text-zinc-500 truncate block mt-0.5">
                {{ task.description }}
              </span>
            </div>

            <!-- Due date -->
            <span
              v-if="task.due_date"
              :class="[
                'text-xs flex-shrink-0 hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                isOverdue(task) ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 font-medium' : 'text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-700/50',
              ]"
            >
              <svg v-if="isOverdue(task)" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              {{ formatDate(task.due_date) }}
            </span>

            <!-- Status badge -->
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 hidden md:inline-block"
              :style="statusBadgeStyle(task.status)"
            >
              {{ statusLabel(task.status) }}
            </span>

            <!-- Comment count indicator -->
            <span
              v-if="task.comment_count"
              class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0"
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
              class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0"
              :title="`${task.attachment_count} attachment${task.attachment_count !== 1 ? 's' : ''}`"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              {{ task.attachment_count }}
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, inject } from 'vue';
import { startTouchDrag, touchDragState, useTouchDropHandler } from '@/composables/useTouchDragDrop';
import { useTasksStore } from '@/stores/tasks';

const canEdit = inject('canEdit', true);
const doneStatusIds = inject('doneStatusIds', computed(() => new Set(['done'])));

const tasksStore = useTasksStore();
const completingId = ref(null);

async function completeOccurrence(task, event) {
  event.stopPropagation();
  if (completingId.value) return;
  completingId.value = task._id;
  try {
    await tasksStore.completeOccurrence(task._id);
  } finally {
    completingId.value = null;
  }
}

function isDoneStatus(statusId) {
  return doneStatusIds.value.has(statusId);
}

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
});

const emit = defineEmits(['add', 'edit', 'delete', 'reorder']);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const POSITION_GAP = 10000;

const statusList = computed(() =>
  props.statuses.length ? props.statuses : DEFAULT_STATUSES
);

const statusMap = computed(() => {
  const map = {};
  for (const s of statusList.value) map[s.id] = s;
  return map;
});

const draggingId = ref(null);
const dropTarget = ref(null);
const dropListIndex = ref(null);

useTouchDropHandler((payload) => emit('reorder', payload));

function isGroupHighlighted(status) {
  return dropTarget.value === status || (touchDragState.dragging && touchDragState.hoverStatus === status);
}

function isItemDragging(taskId) {
  return draggingId.value === taskId || (touchDragState.dragging && touchDragState.taskId === taskId);
}

function onListTouchStart(e, taskId) {
  startTouchDrag(e, taskId);
}

function onListDragStart(e, taskId) {
  draggingId.value = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('taskId', taskId);
}

function onListDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    dropTarget.value = null;
    dropListIndex.value = null;
  }
}

function onListDrop(e, status) {
  const idx = dropListIndex.value;
  dropTarget.value = null;
  dropListIndex.value = null;
  const taskId = e.dataTransfer.getData('taskId');
  if (!taskId) return;

  const group = groups.value.find((g) => g.status === status);
  if (!group) return;

  const currentIdx = group.tasks.findIndex((t) => t._id === taskId);
  if (currentIdx !== -1 && idx != null && (currentIdx === idx || currentIdx === idx - 1)) return;

  let adjustedIdx = idx ?? group.tasks.length;
  const remaining = group.tasks.filter((t) => t._id !== taskId);
  if (currentIdx !== -1 && currentIdx < adjustedIdx) adjustedIdx--;

  const position = computePositionFromList(remaining, adjustedIdx);
  emit('reorder', { id: taskId, status, position });
}

function onListDragOver(e, status) {
  dropTarget.value = status;
  const list = e.currentTarget;
  const items = list.querySelectorAll('[data-task-id]');
  const y = e.clientY;
  let idx = items.length;
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    if (y < rect.top + rect.height / 2) {
      idx = i;
      break;
    }
  }
  dropListIndex.value = idx;
}

function computePositionFromList(sortedTasks, targetIndex) {
  if (sortedTasks.length === 0) return POSITION_GAP;
  if (targetIndex <= 0) return (sortedTasks[0].position ?? 0) - POSITION_GAP;
  if (targetIndex >= sortedTasks.length) return (sortedTasks[sortedTasks.length - 1].position ?? 0) + POSITION_GAP;
  const before = sortedTasks[targetIndex - 1].position ?? 0;
  const after = sortedTasks[targetIndex].position ?? 0;
  return Math.round((before + after) / 2);
}

const collapsed = reactive({});

const groups = computed(() =>
  statusList.value.map((s) => ({
    status: s.id,
    title: s.label,
    color: s.color,
    tasks: props.tasks
      .filter((t) => t.status === s.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }))
);

function toggleGroup(status) { collapsed[status] = !collapsed[status]; }

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function listItemStyle(task, groupColor) {
  const s = { borderLeftColor: groupColor };
  if (task.priority === 'critical' && !isDoneStatus(task.status)) s['--glow-rgb'] = hexToRgb(groupColor);
  return s;
}

const PRIORITY_BARS = { low: 'bg-zinc-300', medium: 'bg-amber-400', high: 'bg-rose-500', critical: 'bg-violet-500' };
function priorityBar(p) { return PRIORITY_BARS[p] || 'bg-zinc-300'; }

function statusBadgeStyle(s) {
  const st = statusMap.value[s];
  if (!st) return { backgroundColor: '#f4f4f5', color: '#71717a' };
  return { backgroundColor: st.color + '30', color: st.color };
}
function statusLabel(s) { return statusMap.value[s]?.label || s; }

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  return task.due_date && !isDoneStatus(task.status) && new Date(task.due_date + 'T00:00:00') < new Date();
}
</script>
