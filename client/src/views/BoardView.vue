<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <!-- Board sub-header -->
    <div class="flex items-center gap-2 px-6 py-3 bg-white border-b border-zinc-200 flex-shrink-0">
      <!-- Breadcrumb -->
      <RouterLink
        to="/"
        class="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors font-medium"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span class="hidden sm:inline">Boards</span>
      </RouterLink>
      <svg class="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
      <h2 class="font-semibold text-zinc-900 text-sm truncate max-w-[160px]">
        {{ board?.name || '…' }}
      </h2>

      <!-- View switcher -->
      <div
        class="flex items-center bg-zinc-100 rounded-lg p-1 ml-4"
        role="tablist"
        aria-label="Board view"
      >
        <button
          v-for="v in views"
          :key="v.id"
          role="tab"
          :aria-selected="activeView === v.id"
          :aria-label="v.label"
          @click="setView(v.id)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
            activeView === v.id
              ? 'bg-white text-zinc-900 shadow-card'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50',
          ]"
        >
          <component :is="v.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span class="hidden sm:inline">{{ v.label }}</span>
        </button>
      </div>

      <div class="ml-auto flex-shrink-0">
        <button @click="openCreate" class="btn-primary">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="hidden sm:inline">Add Task</span>
          <span class="sm:hidden">Add</span>
        </button>
      </div>
    </div>

    <!-- Error banner -->
    <div
      v-if="tasksStore.error"
      role="alert"
      class="flex items-center gap-2 text-sm text-red-700 bg-red-50 border-b border-red-200 px-6 py-3 flex-shrink-0"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      {{ tasksStore.error }}
    </div>

    <!-- Views -->
    <template v-else>
      <KanbanBoard
        v-if="activeView === 'kanban'"
        :tasks="tasksStore.tasks"
        :loading="tasksStore.loading"
        @add="openCreateInColumn"
        @edit="openEdit"
        @delete="handleDelete"
        @status-change="handleStatusChange"
      />
      <TaskListView
        v-else-if="activeView === 'list'"
        :tasks="tasksStore.tasks"
        :loading="tasksStore.loading"
        @add="openCreateInColumn"
        @edit="openEdit"
        @delete="handleDelete"
        @status-change="handleStatusChange"
      />
      <TaskCalendarView
        v-else-if="activeView === 'calendar'"
        :tasks="tasksStore.tasks"
        :loading="tasksStore.loading"
        @edit="openEdit"
        @add="openCreate"
      />
    </template>

    <!-- Task form drawer -->
    <TaskForm
      v-if="showForm"
      :task="editingTask"
      :board-id="boardId"
      :default-status="defaultStatus"
      @save="handleSave"
      @close="closeForm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import { useTasksStore } from '@/stores/tasks';
import KanbanBoard from '@/components/KanbanBoard.vue';
import TaskListView from '@/components/TaskListView.vue';
import TaskCalendarView from '@/components/TaskCalendarView.vue';
import TaskForm from '@/components/TaskForm.vue';

const route = useRoute();
const router = useRouter();
const boardsStore = useBoardsStore();
const tasksStore = useTasksStore();

const boardId = computed(() => route.params.id);
const board = computed(() => boardsStore.boards.find((b) => b._id === boardId.value));

const activeView = computed(() => {
  const v = route.query.view;
  return ['kanban', 'list', 'calendar'].includes(v) ? v : 'kanban';
});

function setView(id) {
  router.replace({ query: { ...route.query, view: id } });
}

// Inline SVG icon render functions
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
const CalendarIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 'clip-rule': 'evenodd' }),
  ]),
};

const views = [
  { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
  { id: 'list', label: 'List', icon: ListIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const showForm = ref(false);
const editingTask = ref(null);
const defaultStatus = ref('todo');

async function load() {
  if (!boardsStore.boards.length) await boardsStore.fetchBoards();
  await tasksStore.fetchTasks(boardId.value);
}

onMounted(load);
onUnmounted(() => tasksStore.clearTasks());
watch(boardId, load);

function openCreate() {
  defaultStatus.value = 'todo';
  editingTask.value = null;
  showForm.value = true;
}

function openCreateInColumn(status) {
  defaultStatus.value = status;
  editingTask.value = null;
  showForm.value = true;
}

function openEdit(task) {
  editingTask.value = task;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingTask.value = null;
  defaultStatus.value = 'todo';
}

async function handleSave(payload) {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value._id, payload);
  } else {
    await tasksStore.createTask({ ...payload, board_id: boardId.value });
  }
  closeForm();
}

async function handleDelete(id) {
  if (confirm('Delete this task?')) {
    await tasksStore.deleteTask(id);
  }
}

async function handleStatusChange({ id, status }) {
  const task = tasksStore.tasks.find((t) => t._id === id);
  if (task) await tasksStore.updateTask(id, { ...task, status });
}
</script>
