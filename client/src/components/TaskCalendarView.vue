<template>
  <div class="flex flex-col flex-1 overflow-hidden px-6 py-4">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <button
        @click="prevMonth"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        ←
      </button>
      <h3 class="font-semibold text-gray-900">
        {{ monthName }} {{ year }}
      </h3>
      <button
        @click="nextMonth"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        →
      </button>
    </div>

    <!-- Day-of-week headers -->
    <div class="grid grid-cols-7 mb-1 flex-shrink-0">
      <div
        v-for="day in WEEKDAYS"
        :key="day"
        class="text-xs font-medium text-gray-400 text-center py-1"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden flex-1 min-h-0">
      <div
        v-for="(cell, i) in calendarCells"
        :key="i"
        :class="[
          'bg-white p-1.5 min-h-[5rem] flex flex-col overflow-hidden',
          cell.isToday && 'bg-brand-50',
          !cell.day && 'bg-gray-50',
        ]"
      >
        <template v-if="cell.day">
          <span
            :class="[
              'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0',
              cell.isToday ? 'bg-brand-600 text-white' : 'text-gray-500',
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
                'text-left text-xs px-1.5 py-0.5 rounded truncate w-full transition-opacity hover:opacity-80',
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
    <div v-if="undatedTasks.length" class="mt-4 flex-shrink-0">
      <h4 class="text-sm font-semibold text-gray-600 mb-2">No due date</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="task in undatedTasks"
          :key="task._id"
          @click="$emit('edit', task)"
          :class="['text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80', taskChipClass(task)]"
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

// Build a map of day → tasks for the current month
const tasksByDay = computed(() => {
  const map = {};
  for (const task of props.tasks) {
    if (!task.due_date) continue;
    // Parse as local date to avoid timezone shifts on date-only strings
    const [y, m, d] = task.due_date.split('T')[0].split('-').map(Number);
    if (y === year.value && m - 1 === month.value) {
      if (!map[d]) map[d] = [];
      map[d].push(task);
    }
  }
  return map;
});

const undatedTasks = computed(() => props.tasks.filter((t) => !t.due_date));

// Generate calendar cells (null = padding day)
const calendarCells = computed(() => {
  const firstWeekday = new Date(year.value, month.value, 1).getDay();
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = `${year.value}-${month.value}-${d}` === todayKey;
    cells.push({ day: d, isToday, tasks: tasksByDay.value[d] || [] });
  }
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
});

const STATUS_CHIP = {
  todo: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};
const PRIORITY_CHIP = {
  high: 'bg-red-100 text-red-800',
};

function taskChipClass(task) {
  if (task.priority === 'high' && task.status !== 'done') return PRIORITY_CHIP.high;
  return STATUS_CHIP[task.status] || STATUS_CHIP.todo;
}
</script>
