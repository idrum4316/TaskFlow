<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <!-- Board header -->
    <div class="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
      <RouterLink to="/" class="text-gray-400 hover:text-gray-600 transition-colors text-sm">
        ← Boards
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h2 class="font-semibold text-gray-900">{{ board?.name || '…' }}</h2>
      <div class="ml-auto">
        <button
          @click="showForm = true"
          class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span class="text-lg leading-none">+</span> Add Task
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="tasksStore.error" class="text-center py-12 text-red-500 px-6">
      {{ tasksStore.error }}
    </div>

    <!-- Kanban columns -->
    <div v-else class="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
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
