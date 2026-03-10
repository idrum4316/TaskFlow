<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-50 dark:bg-zinc-900">
    <!-- Board header -->
    <div class="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/60 flex-shrink-0 backdrop-blur-sm">
      <RouterLink to="/" class="inline-flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-sm group">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Boards
      </RouterLink>
      <span class="text-zinc-300 dark:text-zinc-600 select-none">/</span>
      <h2 class="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ board?.name || '…' }}</h2>

      <div class="ml-auto flex items-center gap-3">
        <span class="hidden sm:inline-flex items-center text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
          {{ tasksStore.tasks.length }} {{ tasksStore.tasks.length === 1 ? 'task' : 'tasks' }}
        </span>
        <button
          @click="showForm = true"
          class="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Task
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="tasksStore.error" class="text-center py-12 text-red-500 px-6">
      {{ tasksStore.error }}
    </div>

    <!-- Kanban columns -->
    <div v-else class="flex gap-5 p-5 overflow-x-auto flex-1 items-start scroll-smooth">
      <KanbanColumn
        v-for="col in columns"
        :key="col.status"
        :title="col.title"
        :status="col.status"
        :tasks="tasksByStatus[col.status]"
        :loading="tasksStore.loading"
        @add="openCreateInColumn"
        @edit="openEdit"
        @delete="handleDelete"
        @status-change="handleStatusChange"
      />
    </div>

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import { useTasksStore } from '@/stores/tasks';
import KanbanColumn from '@/components/KanbanColumn.vue';
import TaskForm from '@/components/TaskForm.vue';

const route = useRoute();
const boardsStore = useBoardsStore();
const tasksStore = useTasksStore();

const boardId = computed(() => route.params.id);
const board = computed(() => boardsStore.boards.find((b) => b._id === boardId.value));

const showForm = ref(false);
const editingTask = ref(null);
const defaultStatus = ref('todo');

const columns = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

const tasksByStatus = computed(() => {
  const map = { todo: [], 'in-progress': [], done: [] };
  for (const task of tasksStore.tasks) {
    if (map[task.status]) map[task.status].push(task);
  }
  return map;
});

async function load() {
  if (!boardsStore.boards.length) await boardsStore.fetchBoards();
  await tasksStore.fetchTasks(boardId.value);
}

onMounted(load);
onUnmounted(() => tasksStore.clearTasks());
watch(boardId, load);

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
