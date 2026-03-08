<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">My Tasks</h2>
      <button
        @click="showForm = true"
        class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <span class="text-lg leading-none">+</span> New Task
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectTab(tab.value)"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          activeTab === tab.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-800',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Task List -->
    <div v-if="tasksStore.loading" class="text-center py-12 text-gray-500">Loading tasks…</div>

    <div v-else-if="tasksStore.error" class="text-center py-12 text-red-500">{{ tasksStore.error }}</div>

    <div v-else-if="tasksStore.tasks.length === 0" class="text-center py-16">
      <p class="text-gray-400 text-sm">No tasks here yet.</p>
      <button @click="showForm = true" class="mt-3 text-brand-600 hover:underline text-sm font-medium">
        Create your first task
      </button>
    </div>

    <TaskList v-else :tasks="tasksStore.tasks" @edit="openEdit" @delete="handleDelete" />

    <!-- Task Form Modal -->
    <TaskForm
      v-if="showForm"
      :task="editingTask"
      @save="handleSave"
      @close="closeForm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import TaskList from '@/components/TaskList.vue';
import TaskForm from '@/components/TaskForm.vue';

const tasksStore = useTasksStore();
const showForm = ref(false);
const editingTask = ref(null);
const activeTab = ref('all');

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

onMounted(() => tasksStore.fetchTasks());

function selectTab(value) {
  activeTab.value = value;
  tasksStore.fetchTasks(value === 'all' ? null : value);
}

function openEdit(task) {
  editingTask.value = task;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingTask.value = null;
}

async function handleSave(payload) {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value._id, payload);
  } else {
    await tasksStore.createTask(payload);
  }
  closeForm();
}

async function handleDelete(id) {
  if (confirm('Delete this task?')) {
    await tasksStore.deleteTask(id);
  }
}
</script>
