<template>
  <div class="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-4">
    <!-- Month navigation -->
    <div class="flex items-center justify-between flex-shrink-0">
      <button
        @click="prevMonth"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        aria-label="Previous month"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <h3 class="font-semibold text-zinc-900 dark:text-zinc-100 text-base tabular-nums">
        {{ monthName }} <span class="text-zinc-400 dark:text-zinc-500 font-normal">{{ year }}</span>
      </h3>

      <button
        @click="nextMonth"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        aria-label="Next month"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Day-of-week headers -->
    <div class="grid grid-cols-7 flex-shrink-0">
      <div
        v-for="day in WEEKDAYS"
        :key="day"
        class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 text-center py-1 uppercase tracking-wide"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-1 min-h-0">
      <div
        v-for="(cell, i) in calendarCells"
        :key="i"
        :class="[
          'flex flex-col overflow-hidden p-1.5',
          cell.day ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-50/80 dark:bg-zinc-800/50',
          cell.isToday ? 'bg-brand-50 dark:bg-brand-950/30' : '',
        ]"
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
              @click="$emit('edit', task)"
              :class="[
                'text-left text-xs px-1.5 py-0.5 rounded-md truncate w-full transition-colors',
                taskChipClass(task),
              ]"
              :title="task.title"
            >
              {{ task.title }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- No-due-date tasks -->
    <div v-if="undatedTasks.length" class="flex-shrink-0 pt-3 border-t border-zinc-200 dark:border-zinc-700">
      <h4 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">No due date</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="task in undatedTasks"
          :key="task._id"
          @click="$emit('edit', task)"
          :class="['text-xs px-2.5 py-1 rounded-full transition-colors', taskChipClass(task)]"
        >
          {{ task.title }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['edit', 'add']);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

const undatedTasks = computed(() => props.tasks.filter((t) => !t.due_date));

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
    });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
});

const STATUS_CHIP = {
  todo: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600',
  'in-progress': 'bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800/50',
  done: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50',
};

function taskChipClass(task) {
  if (task.priority === 'high' && task.status !== 'done') return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800/50';
  return STATUS_CHIP[task.status] || STATUS_CHIP.todo;
}
</script>
