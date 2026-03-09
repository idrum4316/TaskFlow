<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 flex"
    role="dialog"
    aria-modal="true"
    :aria-label="task ? 'Edit task' : 'New task'"
  >
    <!-- Dimmed backdrop -->
    <div
      class="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in"
      @click="$emit('close')"
      aria-hidden="true"
    />

    <!-- Drawer panel -->
    <div class="relative ml-auto w-full max-w-md bg-white shadow-drawer flex flex-col h-full animate-slide-in-right">
      <!-- Drawer header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold text-zinc-900">{{ task ? (readOnly ? 'View Task' : 'Edit Task') : 'New Task' }}</h2>
          <p class="text-xs text-zinc-400 mt-0.5">{{ task ? (readOnly ? 'You have read-only access' : 'Update the details below') : 'Fill in the details below' }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          aria-label="Close drawer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="task-title">
            Title <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="task-title"
            v-model="form.title"
            type="text"
            required
            autofocus
            :disabled="readOnly"
            class="input disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-default"
            placeholder="What needs to be done?"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="task-desc">
            Description
          </label>
          <textarea
            id="task-desc"
            v-model="form.description"
            rows="3"
            :disabled="readOnly"
            class="input resize-none disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-default"
            placeholder="Add more context or details…"
          />
        </div>

        <!-- Status + Priority -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="task-status">Status</label>
            <div class="relative">
              <select id="task-status" v-model="form.status" :disabled="readOnly" class="input pr-8 appearance-none disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-default">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="task-priority">Priority</label>
            <div class="relative">
              <select id="task-priority" v-model="form.priority" :disabled="readOnly" class="input pr-8 appearance-none disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-default">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Priority indicator -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200">
          <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', priorityDot]" aria-hidden="true" />
          <span class="text-xs text-zinc-500">
            <span class="font-medium capitalize">{{ form.priority }}</span> priority ·
            <span class="capitalize">{{ { todo: 'Not started', 'in-progress': 'In progress', done: 'Completed' }[form.status] }}</span>
          </span>
        </div>

        <!-- Due date -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="task-due">Due Date</label>
          <input
            id="task-due"
            v-model="form.due_date"
            type="date"
            :disabled="readOnly"
            class="input disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-default"
          />
        </div>

        <!-- Comments (edit mode only) -->
        <TaskComments v-if="task" :task-id="task._id" :board-id="boardId" />

        <!-- Error -->
        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg"
        >
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          {{ errorMsg }}
        </div>
      </form>

      <!-- Footer actions -->
      <div class="px-6 py-4 border-t border-zinc-200 flex items-center gap-3 flex-shrink-0 bg-zinc-50">
        <template v-if="readOnly">
          <button type="button" @click="$emit('close')" class="btn-primary flex-1">
            Close
          </button>
        </template>
        <template v-else>
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="btn-primary flex-1"
            @click="handleSubmit"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? 'Saving…' : task ? 'Save changes' : 'Create task' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import TaskComments from './TaskComments.vue';

const props = defineProps({
  task: { type: Object, default: null },
  boardId: { type: String, default: null },
  defaultStatus: { type: String, default: 'todo' },
  readOnly: { type: Boolean, default: false },
});
const emit = defineEmits(['save', 'close']);

const saving = ref(false);
const errorMsg = ref('');

const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  status: props.task?.status || props.defaultStatus,
  priority: props.task?.priority || 'medium',
  due_date: props.task?.due_date || '',
});

const priorityDot = computed(() => ({
  low: 'bg-zinc-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}[form.priority] || 'bg-zinc-400'));

async function handleSubmit() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await emit('save', { ...form, due_date: form.due_date || null });
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Failed to save task';
    saving.value = false;
  }
}
</script>
