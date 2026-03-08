<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <!-- Board header -->
    <div class="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
      <RouterLink to="/" class="text-gray-400 hover:text-gray-600 transition-colors text-sm">
        ← Boards
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h2 class="font-semibold text-gray-900">{{ board?.name || '…' }}</h2>

      <!-- View switcher -->
      <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-4">
        <button
          v-for="v in views"
          :key="v.id"
          @click="setView(v.id)"
          :title="v.label"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeView === v.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          <component :is="v.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ v.label }}</span>
        </button>
      </div>

      <div class="ml-auto">
        <button
          @click="openCreate"
          class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span class="text-lg leading-none">+</span> Add Task
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="tasksStore.error" class="text-center py-12 text-red-500 px-6 flex-shrink-0">
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
      />

      <TaskCalendarView
        v-else-if="activeView === 'calendar'"
        :tasks="tasksStore.tasks"
        :loading="tasksStore.loading"
        @edit="openEdit"
        @add="openCreate"
      />
    </template>

    <!-- Task form modal -->
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

// View mode — persisted in URL query param
const activeView = computed(() => {
  const v = route.query.view;
  return ['kanban', 'list', 'calendar'].includes(v) ? v : 'kanban';
});

function setView(id) {
  router.replace({ query: { ...route.query, view: id } });
}

// Inline SVG icon components
const KanbanIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 3, width: 4, height: 14, rx: 1 }),
    h('rect', { x: 8, y: 3, width: 4, height: 9, rx: 1 }),
    h('rect', { x: 14, y: 3, width: 4, height: 11, rx: 1 }),
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

// Task form state
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
