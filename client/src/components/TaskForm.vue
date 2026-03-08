<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md z-50">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">{{ task ? 'Edit Task' : 'New Task' }}</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Title <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="What needs to be done?"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            placeholder="Optional details…"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              v-model="form.priority"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            v-model="form.due_date"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ errorMsg }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {{ saving ? 'Saving…' : (task ? 'Save changes' : 'Create task') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  task: { type: Object, default: null },
  boardId: { type: String, default: null },
  defaultStatus: { type: String, default: 'todo' },
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
