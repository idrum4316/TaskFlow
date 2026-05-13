<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="board-settings-title">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-modal border border-zinc-200 dark:border-zinc-700 w-full max-w-md mx-4 p-6 animate-scale-in">
      <div class="flex items-center justify-between mb-5">
        <h2 id="board-settings-title" class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Board Settings</h2>
        <button
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Default View</label>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Choose which view loads by default when opening this board.</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="v in viewOptions"
              :key="v.id"
              @click="selectedView = v.id"
              :class="[
                'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150',
                selectedView === v.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              ]"
            >
              <component :is="v.icon" class="w-5 h-5" aria-hidden="true" />
              {{ v.label }}
            </button>
          </div>
        </div>

        <!-- Calendar mode sub-option -->
        <div v-if="selectedView === 'calendar'">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Calendar Mode</label>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Open the calendar in month or week view.</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in calendarModes"
              :key="m.id"
              @click="selectedCalendarMode = m.id"
              :class="[
                'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150',
                selectedCalendarMode === m.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              ]"
            >
              {{ m.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="save"
          :disabled="saving"
          class="btn-primary !py-2 !px-4"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h } from 'vue';

const props = defineProps({
  currentView: { type: String, default: 'kanban' },
  currentCalendarMode: { type: String, default: 'month' },
  boardId: { type: String, required: true },
  saveFn: { type: Function, required: true },
});

const emit = defineEmits(['close', 'saved']);

const selectedView = ref(props.currentView);
const selectedCalendarMode = ref(props.currentCalendarMode);
const saving = ref(false);

const KanbanIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 3, width: 4, height: 14, rx: 1.5 }),
    h('rect', { x: 8, y: 3, width: 4, height: 9, rx: 1.5 }),
    h('rect', { x: 14, y: 3, width: 4, height: 11, rx: 1.5 }),
  ]),
};
const ListIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 4, width: 16, height: 2, rx: 1 }),
    h('rect', { x: 2, y: 9, width: 16, height: 2, rx: 1 }),
    h('rect', { x: 2, y: 14, width: 10, height: 2, rx: 1 }),
  ]),
};
const TableIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-11zM5 5v2.5h4V5H5zm6 0v2.5h4V5h-4zM5 9.5V12h4V9.5H5zm6 0V12h4V9.5h-4zM5 14v1h4v-1H5zm6 0v1h4v-1h-4z', 'clip-rule': 'evenodd' }),
  ]),
};
const CalendarIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 'clip-rule': 'evenodd' }),
  ]),
};

const viewOptions = [
  { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
  { id: 'list', label: 'List', icon: ListIcon },
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const calendarModes = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
];

async function save() {
  saving.value = true;
  try {
    await props.saveFn({
      default_view: selectedView.value,
      default_calendar_mode: selectedView.value === 'calendar' ? selectedCalendarMode.value : undefined,
    });
    emit('saved', selectedView.value);
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>
