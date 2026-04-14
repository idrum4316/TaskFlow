<template>
  <div class="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-4">
    <!-- Navigation and view toggle -->
    <div class="flex items-center justify-between flex-shrink-0">
      <button
        @click="prevPeriod"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        :aria-label="viewMode === 'month' ? 'Previous month' : 'Previous week'"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div class="flex items-center gap-3">
        <h3 class="font-semibold text-zinc-900 dark:text-zinc-100 text-base tabular-nums">
          <template v-if="viewMode === 'month'">
            {{ monthName }} <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ year }}</span>
          </template>
          <template v-else>
            {{ weekLabel }}
          </template>
        </h3>
        <div class="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            @click="viewMode = 'month'"
            :class="[
              'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
              viewMode === 'month'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            ]"
          >Month</button>
          <button
            @click="viewMode = 'week'"
            :class="[
              'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            ]"
          >Week</button>
        </div>
      </div>

      <button
        @click="nextPeriod"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        :aria-label="viewMode === 'month' ? 'Next month' : 'Next week'"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Day-of-week headers -->
    <div class="grid grid-cols-7 flex-shrink-0">
      <div
        v-for="(day, i) in weekdayHeaders"
        :key="i"
        class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 text-center py-1 uppercase tracking-wide"
      >
        {{ day }}
      </div>
    </div>

    <!-- Month calendar grid -->
    <div v-if="viewMode === 'month'" class="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-1 min-h-0">
      <div
        v-for="(cell, i) in calendarCells"
        :key="i"
        :class="[
          'flex flex-col overflow-hidden p-1.5 transition-colors',
          cell.day ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-50/80 dark:bg-zinc-800/50',
          cell.isToday ? 'bg-brand-50 dark:bg-brand-950/30' : '',
          cell.day && dropTarget === cellKey(cell) ? 'ring-2 ring-inset ring-brand-500 bg-brand-50 dark:bg-brand-950/40' : '',
        ]"
        @dragover.prevent="cell.day ? onDragOver(cellKey(cell)) : null"
        @dragleave="onDragLeave"
        @drop.prevent="cell.day ? onDropCell(cell) : null"
      >
        <template v-if="cell.day">
          <span
            :class="[
              'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0 tabular-nums',
              cell.isToday
                ? 'bg-brand-600 text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700',
            ]"
          >
            {{ cell.day }}
          </span>

          <div class="flex flex-col gap-0.5 overflow-y-auto min-h-0">
            <button
              v-for="task in cell.tasks"
              :key="task._id"
              draggable="true"
              @dragstart="onDragStart(task, $event)"
              @dragend="onDragEnd"
              @click="$emit('edit', task)"
              :class="[
                'text-left text-xs px-1.5 py-0.5 rounded-md truncate w-full transition-colors cursor-grab active:cursor-grabbing flex items-center gap-0.5',
                taskChipClass(task),
                isDoneStatus(task.status) ? 'line-through' : '',
              ]"
              :style="taskChipStyle(task)"
              :title="task.title"
            >
              <button
                v-if="task.recurrence"
                @click.stop="completeOccurrence(task, $event)"
                :disabled="completingId === task._id"
                class="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-current flex items-center justify-center hover:bg-white/30 dark:hover:bg-black/20 transition-colors disabled:opacity-50"
                title="Complete this occurrence"
              >
                <svg class="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
              <svg v-if="task.recurrence" class="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.652v4.992" />
              </svg>
              <span class="truncate">{{ task.title }}</span>
            </button>
            <!-- Ghost chips for projected recurring occurrences -->
            <div
              v-for="ghost in cell.ghosts"
              :key="'ghost-' + ghost._id"
              class="text-left text-xs px-1.5 py-0.5 rounded-md truncate w-full flex items-center gap-0.5 opacity-40 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500"
              :title="ghost.title + ' (projected)'"
            >
              <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.652v4.992" />
              </svg>
              <span class="truncate">{{ ghost.title }}</span>
            </div>
            <!-- Completion ghost chips (past completed occurrences) -->
            <div
              v-for="comp in cell.completions"
              :key="'comp-' + comp._id"
              :class="['text-left text-xs px-1.5 py-0.5 rounded-md truncate w-full flex items-center gap-0.5 opacity-75 line-through', taskChipClass(comp)]"
              :style="taskChipStyle(comp)"
              :title="comp._taskTitle + ' (completed)'"
            >
              <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span class="truncate">{{ comp._taskTitle }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Week view grid -->
    <div v-if="viewMode === 'week'" class="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-1 min-h-0">
      <div
        v-for="(cell, i) in weekCells"
        :key="i"
        :class="[
          'flex flex-col overflow-hidden p-2 transition-colors bg-white dark:bg-zinc-800',
          cell.isToday ? 'bg-brand-50 dark:bg-brand-950/30' : '',
          dropTarget === cellKey(cell) ? 'ring-2 ring-inset ring-brand-500 bg-brand-50 dark:bg-brand-950/40' : '',
        ]"
        @dragover.prevent="onDragOver(cellKey(cell))"
        @dragleave="onDragLeave"
        @drop.prevent="onDropCell(cell)"
      >
        <div class="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <span
            :class="[
              'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full tabular-nums',
              cell.isToday
                ? 'bg-brand-600 text-white'
                : 'text-zinc-700 dark:text-zinc-300',
            ]"
          >
            {{ cell.day }}
          </span>
          <span v-if="cell.showMonth" class="text-xs text-zinc-400 dark:text-zinc-500">{{ MONTH_NAMES_SHORT[cell.monthIdx] }}</span>
        </div>

        <div class="flex flex-col gap-1 overflow-y-auto min-h-0">
          <button
            v-for="task in cell.tasks"
            :key="task._id"
            draggable="true"
            @dragstart="onDragStart(task, $event)"
            @dragend="onDragEnd"
            @click="$emit('edit', task)"
            :class="[
              'text-left text-xs px-2 py-1 rounded-md w-full transition-colors cursor-grab active:cursor-grabbing flex items-center gap-1',
              taskChipClass(task),
              isDoneStatus(task.status) ? 'line-through' : '',
            ]"
            :style="taskChipStyle(task)"
            :title="task.title"
          >
            <button
              v-if="task.recurrence"
              @click.stop="completeOccurrence(task, $event)"
              :disabled="completingId === task._id"
              class="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-current flex items-center justify-center hover:bg-white/30 dark:hover:bg-black/20 transition-colors disabled:opacity-50"
              title="Complete this occurrence"
            >
              <svg class="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
            <svg v-if="task.recurrence" class="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.652v4.992" />
            </svg>
            <span class="truncate">{{ task.title }}</span>
          </button>
          <!-- Ghost chips -->
          <div
            v-for="ghost in cell.ghosts"
            :key="'ghost-' + ghost._id"
            class="text-left text-xs px-2 py-1 rounded-md w-full flex items-center gap-1 opacity-40 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500"
            :title="ghost.title + ' (projected)'"
          >
            <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.652v4.992" />
            </svg>
            <span class="truncate">{{ ghost.title }}</span>
          </div>
          <!-- Completion ghost chips -->
          <div
            v-for="comp in cell.completions"
            :key="'comp-' + comp._id"
            :class="['text-left text-xs px-2 py-1 rounded-md w-full flex items-center gap-1 opacity-75 line-through', taskChipClass(comp)]"
            :style="taskChipStyle(comp)"
            :title="comp._taskTitle + ' (completed)'"
          >
            <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span class="truncate">{{ comp._taskTitle }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No-due-date tasks -->
    <div v-if="undatedTasks.length" class="flex-shrink-0 pt-3 border-t border-zinc-200 dark:border-zinc-700">
      <h4 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">No due date</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="task in undatedTasks"
          :key="task._id"
          draggable="true"
          @dragstart="onDragStart(task, $event)"
          @dragend="onDragEnd"
          @click="$emit('edit', task)"
          :class="['text-xs px-2.5 py-1 rounded-full transition-colors cursor-grab active:cursor-grabbing', taskChipClass(task), isDoneStatus(task.status) ? 'line-through' : '']"
          :style="taskChipStyle(task)"
        >
          {{ task.title }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue';
import { projectOccurrences } from '@/utils/recurrence';
import { useTasksStore } from '@/stores/tasks';
import { useCompletionsStore } from '@/stores/completions';
import { storeToRefs } from 'pinia';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
  boardId: { type: String, default: null },
  initialMode: { type: String, default: null },
});

const emit = defineEmits(['edit', 'add', 'due-date-change']);

const tasksStore = useTasksStore();
const completionsStore = useCompletionsStore();
const { boardCompletions } = storeToRefs(completionsStore);
const completingId = ref(null);

async function completeOccurrence(task, event) {
  event.stopPropagation();
  if (completingId.value) return;
  completingId.value = task._id;
  try {
    await tasksStore.completeOccurrence(task._id);
    fetchCompletions();
  } finally {
    completingId.value = null;
  }
}

const doneStatusIds = inject('doneStatusIds', computed(() => new Set(['done'])));

function isDoneStatus(statusId) {
  return doneStatusIds.value.has(statusId);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const viewMode = ref(props.initialMode === 'week' ? 'week' : 'month');
const today = new Date();
const month = ref(today.getMonth());
const year = ref(today.getFullYear());
const monthName = computed(() => MONTH_NAMES[month.value]);

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value--; }
  else month.value--;
}
function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++; }
  else month.value++;
}

// --- Week view state ---
function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

const weekStart = ref(getWeekStart(today));

function prevWeek() {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() - 7);
  weekStart.value = d;
}
function nextWeek() {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 7);
  weekStart.value = d;
}

function prevPeriod() {
  if (viewMode.value === 'month') prevMonth();
  else prevWeek();
}
function nextPeriod() {
  if (viewMode.value === 'month') nextMonth();
  else nextWeek();
}

// Week days as Date objects
const weekDays = computed(() => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
});

const weekLabel = computed(() => {
  const start = weekDays.value[0];
  const end = weekDays.value[6];
  if (start.getMonth() === end.getMonth()) {
    return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
});

const weekdayHeaders = computed(() => {
  if (viewMode.value === 'month') return WEEKDAYS;
  return weekDays.value.map((d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}`);
});

// Fetch board completions whenever month/year/boardId/week changes
function fetchCompletions() {
  if (!props.boardId) return;
  let fromLocal, toLocal;
  if (viewMode.value === 'week') {
    const start = weekDays.value[0];
    const end = weekDays.value[6];
    fromLocal = formatDate(start);
    toLocal = formatDate(end);
  } else {
    const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
    fromLocal = `${year.value}-${String(month.value + 1).padStart(2, '0')}-01`;
    toLocal = `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }
  // Convert local date boundaries to UTC ISO timestamps
  const from = new Date(fromLocal + 'T00:00:00').toISOString();
  const to = new Date(toLocal + 'T23:59:59.999').toISOString();
  completionsStore.fetchBoardCompletions(props.boardId, from, to);
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

watch([month, year, weekStart, viewMode, () => props.boardId], fetchCompletions, { immediate: true });

const tasksByDay = computed(() => {
  const map = {};
  for (const task of props.tasks) {
    if (!task.due_date) continue;
    const [y, m, d] = task.due_date.split('T')[0].split('-').map(Number);
    if (y === year.value && m - 1 === month.value) {
      if (!map[d]) map[d] = [];
      map[d].push(task);
    }
  }
  return map;
});

// Ghost chips: projected future occurrences of recurring tasks
const ghostsByDay = computed(() => {
  const map = {};
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  const monthStart = `${year.value}-${String(month.value + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  for (const task of props.tasks) {
    if (!task.recurrence || !task.due_date) continue;
    // Project up to 60 occurrences to cover several months ahead
    const projected = projectOccurrences(task.due_date, task.recurrence, 60);
    for (const dateStr of projected) {
      if (dateStr < monthStart) continue;
      if (dateStr > monthEnd) break;
      const d = parseInt(dateStr.split('-')[2], 10);
      // Don't show ghost if there's already a real task on this day
      const realTasks = tasksByDay.value[d] || [];
      if (realTasks.some((t) => t._id === task._id)) continue;
      if (!map[d]) map[d] = [];
      map[d].push(task);
    }
  }
  return map;
});

const undatedTasks = computed(() => props.tasks.filter((t) => !t.due_date));

// Build a task lookup for completion ghost labels
const taskMap = computed(() => {
  const map = {};
  for (const t of props.tasks) map[t._id] = t;
  return map;
});

// Completion ghosts: past completed occurrences keyed by day (using local date from completed_at)
const completionsByDay = computed(() => {
  const map = {};
  for (const c of boardCompletions.value) {
    if (!c.completed_at) continue;
    const localDate = new Date(c.completed_at);
    const y = localDate.getFullYear();
    const m = localDate.getMonth();
    const d = localDate.getDate();
    if (y === year.value && m === month.value) {
      if (!map[d]) map[d] = [];
      const task = taskMap.value[c.task_id];
      map[d].push({ ...c, _taskTitle: task?.title || 'Completed task', status: task?.status, priority: task?.priority });
    }
  }
  return map;
});

const calendarCells = computed(() => {
  const firstWeekday = new Date(year.value, month.value, 1).getDay();
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isToday: `${year.value}-${month.value}-${d}` === todayKey,
      tasks: tasksByDay.value[d] || [],
      ghosts: ghostsByDay.value[d] || [],
      completions: completionsByDay.value[d] || [],
    });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
});

// --- Week view data (keyed by full date string YYYY-MM-DD) ---
const tasksByDate = computed(() => {
  const map = {};
  for (const task of props.tasks) {
    if (!task.due_date) continue;
    const dateKey = task.due_date.split('T')[0];
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(task);
  }
  return map;
});

const ghostsByDate = computed(() => {
  const map = {};
  const start = formatDate(weekDays.value[0]);
  const end = formatDate(weekDays.value[6]);

  for (const task of props.tasks) {
    if (!task.recurrence || !task.due_date) continue;
    const projected = projectOccurrences(task.due_date, task.recurrence, 60);
    for (const dateStr of projected) {
      if (dateStr < start) continue;
      if (dateStr > end) break;
      const realTasks = tasksByDate.value[dateStr] || [];
      if (realTasks.some((t) => t._id === task._id)) continue;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    }
  }
  return map;
});

const completionsByDate = computed(() => {
  const map = {};
  for (const c of boardCompletions.value) {
    if (!c.completed_at) continue;
    const localDate = new Date(c.completed_at);
    const dateKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    if (!map[dateKey]) map[dateKey] = [];
    const task = taskMap.value[c.task_id];
    map[dateKey].push({ ...c, _taskTitle: task?.title || 'Completed task', status: task?.status, priority: task?.priority });
  }
  return map;
});

const weekCells = computed(() => {
  const todayStr = formatDate(today);
  return weekDays.value.map((d, i) => {
    const dateStr = formatDate(d);
    return {
      day: d.getDate(),
      monthIdx: d.getMonth(),
      yearVal: d.getFullYear(),
      dateStr,
      showMonth: i === 0 || d.getDate() === 1,
      isToday: dateStr === todayStr,
      tasks: tasksByDate.value[dateStr] || [],
      ghosts: ghostsByDate.value[dateStr] || [],
      completions: completionsByDate.value[dateStr] || [],
    };
  });
});

function cellKey(cell) {
  return cell.dateStr || `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
}

function onDropCell(cell) {
  dropTarget.value = null;
  if (!draggedTask.value) return;
  const newDueDate = cellKey(cell);
  const currentDate = draggedTask.value.due_date?.split('T')[0];
  if (currentDate !== newDueDate) {
    emit('due-date-change', { id: draggedTask.value._id, due_date: newDueDate });
  }
  draggedTask.value = null;
}

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const statusMap = computed(() => {
  const list = props.statuses.length ? props.statuses : DEFAULT_STATUSES;
  const map = {};
  for (const s of list) map[s.id] = s;
  return map;
});

function taskChipClass(task) {
  if (task.priority === 'high' && !isDoneStatus(task.status)) return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800/50';
  const st = statusMap.value[task.status];
  if (!st) return 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600';
  // Use the color with low opacity for bg
  return '';
}

function taskChipStyle(task) {
  if (task.priority === 'high' && !isDoneStatus(task.status)) return {};
  const st = statusMap.value[task.status];
  if (!st) return {};
  return { backgroundColor: st.color + '22', color: st.color };
}

// --- Drag and drop ---
const draggedTask = ref(null);
const dropTarget = ref(null);

function onDragStart(task, event) {
  draggedTask.value = task;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', task._id);
}

function onDragEnd() {
  draggedTask.value = null;
  dropTarget.value = null;
}

function onDragOver(key) {
  dropTarget.value = key;
}

function onDragLeave() {
  dropTarget.value = null;
}
</script>
