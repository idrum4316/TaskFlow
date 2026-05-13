<template>
  <div data-drag-scroll class="px-3 sm:px-6 py-4 sm:py-5 overflow-auto flex-1">
    <!-- Loading skeleton -->
    <div v-if="loading && !tasks.length" class="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-card overflow-hidden" aria-busy="true" aria-label="Loading table">
      <div class="h-12 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700" />
      <div v-for="i in 6" :key="i" class="grid grid-cols-6 gap-4 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
        <div class="h-4 rounded bg-zinc-200/70 dark:bg-zinc-700/70 animate-pulse" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!tasks.length" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3" aria-hidden="true">
        <svg class="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v16.5m0-16.5h16.5m-16.5 0L20.25 20.25M8.25 3.75v16.5M13.5 3.75v16.5M3.75 9h16.5M3.75 14.25h16.5" />
        </svg>
      </div>
      <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">No tasks yet</p>
      <p class="text-xs text-zinc-400 mt-1">Add your first task to start filling the table</p>
      <button v-if="canEdit" @click="$emit('add', firstStatusId)" class="btn-primary mt-4 text-xs">
        Add first task
      </button>
    </div>

    <div v-else class="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-card overflow-hidden min-w-full">
      <div class="overflow-auto">
        <table class="min-w-[1120px] w-full border-separate border-spacing-0 text-sm">
          <thead class="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                :aria-sort="ariaSort(column.key)"
                :class="[
                  'border-b border-r last:border-r-0 border-zinc-200 dark:border-zinc-700 px-0 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
                  column.width,
                ]"
              >
                <button
                  type="button"
                  @click="setSort(column.key)"
                  :class="[
                    'flex w-full items-center gap-1.5 px-3 py-3 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors',
                    column.align === 'right' ? 'justify-end text-right' : 'justify-start text-left',
                    sortKey === column.key ? 'text-brand-700 dark:text-brand-300' : '',
                  ]"
                >
                  <span class="truncate">{{ column.label }}</span>
                  <span class="inline-flex w-3.5 h-3.5 items-center justify-center flex-shrink-0">
                    <svg
                      v-if="sortKey === column.key"
                      class="w-3.5 h-3.5 transition-transform"
                      :class="sortDirection === 'desc' ? 'rotate-180' : ''"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2.5"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75 12 8.25l7.5 7.5" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                    </svg>
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in sortedTasks"
              :key="task._id"
              @click="$emit('edit', task)"
              class="group bg-white dark:bg-zinc-900 hover:bg-zinc-50/90 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <td class="border-b border-r border-l-[3px] border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle" :style="{ borderLeftColor: statusColor(task.status) }">
                <div class="flex items-center gap-2 min-w-0">
                  <span :class="['w-1.5 h-8 rounded-full flex-shrink-0', priorityBar(task.priority)]" aria-hidden="true" />
                  <div class="min-w-0">
                    <div
                      :class="[
                        'font-medium truncate',
                        isDoneStatus(task.status) ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100',
                      ]"
                    >
                      {{ task.title }}
                    </div>
                    <div v-if="task.description" class="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                      {{ task.description }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle">
                <select
                  :value="task.status"
                  :disabled="!canEdit"
                  class="max-w-full rounded-full border border-transparent px-2 py-1 pr-7 text-xs font-medium outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  :style="statusSelectStyle(task.status)"
                  :aria-label="`Change status for ${task.title}`"
                  @click.stop
                  @change.stop="emitStatusChange(task, $event.target.value)"
                >
                  <option v-for="status in statusList" :key="status.id" :value="status.id">
                    {{ status.label }}
                  </option>
                </select>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle">
                <select
                  :value="task.priority || 'medium'"
                  :disabled="!canEdit"
                  :class="['max-w-full rounded-md border border-transparent px-2 py-1 pr-7 text-xs font-medium capitalize outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70', priorityBadge(task.priority)]"
                  :aria-label="`Change priority for ${task.title}`"
                  @click.stop
                  @change.stop="emitPriorityChange(task, $event.target.value)"
                >
                  <option v-for="priority in priorities" :key="priority" :value="priority">
                    {{ priority }}
                  </option>
                </select>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle">
                <span
                  v-if="task.due_date"
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
                    isOverdue(task) ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40' : 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800',
                  ]"
                >
                  <svg v-if="task.recurrence" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M7.977 14.652H2.985m0 0v.001m0-.001 3.181-3.182a8.25 8.25 0 0 1 13.803 3.7" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                  </svg>
                  {{ formatDate(task.due_date) }}
                </span>
                <span v-else class="text-xs text-zinc-300 dark:text-zinc-600">—</span>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle">
                <div v-if="taskLabels(task).length" class="flex flex-wrap gap-1 max-w-[220px]">
                  <span
                    v-for="label in taskLabels(task)"
                    :key="label.id"
                    class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight"
                    :style="labelStyle(label)"
                  >
                    {{ label.name }}
                  </span>
                </div>
                <span v-else class="text-xs text-zinc-300 dark:text-zinc-600">—</span>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle">
                <div v-if="checklistTotal(task)" class="min-w-[110px]">
                  <div class="flex items-center justify-between gap-2 text-xs mb-1">
                    <span :class="checklistDone(task) === checklistTotal(task) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'">
                      {{ checklistDone(task) }}/{{ checklistTotal(task) }} done
                    </span>
                    <span class="text-zinc-400 dark:text-zinc-500">{{ checklistPercent(task) }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div class="h-full rounded-full bg-brand-500 dark:bg-brand-400" :style="{ width: `${checklistPercent(task)}%` }" />
                  </div>
                </div>
                <span v-else class="text-xs text-zinc-300 dark:text-zinc-600">—</span>
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                {{ task.comment_count || 0 }}
              </td>

              <td class="border-b border-r border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                {{ task.attachment_count || 0 }}
              </td>

              <td class="border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5 align-middle text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {{ formatDateTime(task.updated_at || task.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';

const canEdit = inject('canEdit', computed(() => true));
const boardLabels = inject('boardLabels', computed(() => []));
const doneStatusIds = inject('doneStatusIds', computed(() => new Set(['done'])));

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
});

const emit = defineEmits(['add', 'edit', 'status-change', 'priority-change']);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const priorities = ['low', 'medium', 'high', 'critical'];

const columns = [
  { key: 'title', label: 'Task', width: 'w-[300px]' },
  { key: 'status', label: 'Status', width: 'w-[150px]' },
  { key: 'priority', label: 'Priority', width: 'w-[120px]' },
  { key: 'due_date', label: 'Due date', width: 'w-[140px]' },
  { key: 'labels', label: 'Labels', width: 'w-[220px]' },
  { key: 'checklist', label: 'Checklist', width: 'w-[150px]' },
  { key: 'comments', label: 'Comments', width: 'w-[95px]', align: 'right' },
  { key: 'attachments', label: 'Files', width: 'w-[80px]', align: 'right' },
  { key: 'updated_at', label: 'Updated', width: 'w-[135px]' },
];

const sortKey = ref('status');
const sortDirection = ref('asc');

const statusList = computed(() => props.statuses.length ? props.statuses : DEFAULT_STATUSES);
const firstStatusId = computed(() => statusList.value[0]?.id || 'todo');

const statusMap = computed(() => {
  const map = {};
  for (const status of statusList.value) map[status.id] = status;
  return map;
});

const statusOrder = computed(() => {
  const map = {};
  statusList.value.forEach((status, idx) => { map[status.id] = idx; });
  return map;
});

const labelMap = computed(() => {
  const map = {};
  for (const label of boardLabels.value || []) map[label.id] = label;
  return map;
});

const sortedTasks = computed(() => {
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  return [...props.tasks].sort((a, b) => {
    const primary = compareByColumn(a, b, sortKey.value, direction);
    if (primary !== 0) return primary;
    return fallbackCompare(a, b);
  });
});

function setSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }
  sortKey.value = key;
  sortDirection.value = ['priority', 'comments', 'attachments', 'updated_at', 'checklist'].includes(key) ? 'desc' : 'asc';
}

function ariaSort(key) {
  if (sortKey.value !== key) return 'none';
  return sortDirection.value === 'asc' ? 'ascending' : 'descending';
}

function emitStatusChange(task, status) {
  if (!canEdit.value || status === task.status) return;
  emit('status-change', { id: task._id, status });
}

function emitPriorityChange(task, priority) {
  if (!canEdit.value || priority === (task.priority || 'medium')) return;
  emit('priority-change', { id: task._id, priority });
}

function compareByColumn(a, b, key, direction) {
  switch (key) {
    case 'title':
      return compareString(a.title, b.title, direction);
    case 'status':
      return compareNumber(statusOrder.value[a.status] ?? 999, statusOrder.value[b.status] ?? 999, direction);
    case 'priority':
      return compareNumber(priorityRank(a.priority), priorityRank(b.priority), direction);
    case 'due_date':
      return compareNullable(a.due_date, b.due_date, direction, (x, y) => compareString(x, y, 1));
    case 'labels':
      return compareString(labelNames(a).join(', '), labelNames(b).join(', '), direction);
    case 'checklist':
      return compareNullable(checklistSortValue(a), checklistSortValue(b), direction, (x, y) => compareNumber(x, y, 1));
    case 'comments':
      return compareNumber(a.comment_count || 0, b.comment_count || 0, direction);
    case 'attachments':
      return compareNumber(a.attachment_count || 0, b.attachment_count || 0, direction);
    case 'updated_at':
      return compareNullable(a.updated_at || a.created_at, b.updated_at || b.created_at, direction, (x, y) => compareNumber(Date.parse(x), Date.parse(y), 1));
    default:
      return fallbackCompare(a, b);
  }
}

function fallbackCompare(a, b) {
  const statusCompare = compareNumber(statusOrder.value[a.status] ?? 999, statusOrder.value[b.status] ?? 999, 1);
  if (statusCompare !== 0) return statusCompare;
  return compareNumber(a.position ?? 0, b.position ?? 0, 1);
}

function compareString(a, b, direction) {
  return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base', numeric: true }) * direction;
}

function compareNumber(a, b, direction) {
  if (a === b) return 0;
  return a > b ? direction : -direction;
}

function compareNullable(a, b, direction, compare) {
  const aMissing = a === null || a === undefined || a === '';
  const bMissing = b === null || b === undefined || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return compare(a, b) * direction;
}

function isDoneStatus(statusId) {
  return doneStatusIds.value.has(statusId);
}

function statusLabel(statusId) {
  return statusMap.value[statusId]?.label || statusId || 'Unknown';
}

function statusColor(statusId) {
  return statusMap.value[statusId]?.color || '#a1a1aa';
}

function statusSelectStyle(statusId) {
  const color = statusColor(statusId);
  return { backgroundColor: `${color}24`, color };
}

function taskLabels(task) {
  return (task.labels || [])
    .map((id) => labelMap.value[id])
    .filter(Boolean);
}

function labelNames(task) {
  return taskLabels(task).map((label) => label.name);
}

function labelStyle(label) {
  return { backgroundColor: `${label.color}22`, color: label.color };
}

function priorityRank(priority) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[priority] || 2;
}

function priorityBar(priority) {
  return {
    low: 'bg-zinc-300 dark:bg-zinc-600',
    medium: 'bg-amber-400',
    high: 'bg-rose-500',
    critical: 'bg-violet-500',
  }[priority] || 'bg-amber-400';
}

function priorityBadge(priority) {
  return {
    low: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
    medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    high: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    critical: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  }[priority] || 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
}

function checklistTotal(task) {
  return (task.checklist || []).length;
}

function checklistDone(task) {
  return (task.checklist || []).filter((item) => item.done).length;
}

function checklistPercent(task) {
  const total = checklistTotal(task);
  if (!total) return 0;
  return Math.round((checklistDone(task) / total) * 100);
}

function checklistSortValue(task) {
  const total = checklistTotal(task);
  if (!total) return null;
  return checklistPercent(task);
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  return task.due_date && !isDoneStatus(task.status) && new Date(`${task.due_date}T00:00:00`) < new Date();
}
</script>
