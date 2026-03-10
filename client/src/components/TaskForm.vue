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

    <!-- Drawer panel — wider for existing tasks, compact for new -->
    <div :class="[
      'relative ml-auto bg-white dark:bg-zinc-900 shadow-drawer flex flex-col h-full animate-slide-in-right',
      task ? 'w-full max-w-2xl' : 'w-full max-w-md',
    ]">
      <!-- Drawer header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            :class="task ? 'bg-brand-50 dark:bg-brand-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'"
          >
            <svg v-if="task" class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <svg v-else class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ task ? (readOnly ? 'View Task' : 'Edit Task') : 'New Task' }}</h2>
            <p v-if="readOnly" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Read-only access</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          aria-label="Close drawer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body: two-column for existing tasks, single-column for new -->
      <div v-if="task" class="flex-1 overflow-hidden flex">
        <!-- Left column: task details -->
        <div class="flex-1 overflow-y-auto min-w-0">
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-5">
            <!-- Title -->
            <div>
              <input
                id="task-title"
                v-model="form.title"
                type="text"
                required
                :disabled="readOnly"
                class="w-full text-lg font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:cursor-default p-0 focus:ring-0"
                placeholder="Task title"
              />
            </div>

            <!-- Metadata pills -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Status pill -->
              <div class="relative">
                <select
                  v-model="form.status"
                  :disabled="readOnly"
                  class="appearance-none text-xs font-medium pl-6 pr-6 py-1.5 rounded-full border cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  :style="statusPillStyle"
                  :aria-label="'Status'"
                >
                  <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
                </select>
                <span class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" :style="{ backgroundColor: currentStatusColor }" />
                <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" :style="{ color: currentStatusColor }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>

              <!-- Priority pill -->
              <div class="relative">
                <select
                  v-model="form.priority"
                  :disabled="readOnly"
                  class="appearance-none text-xs font-medium pl-6 pr-6 py-1.5 rounded-full border cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  :class="priorityPillClass"
                  :aria-label="'Priority'"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <span :class="['absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none', priorityDotClass]" />
                <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>

              <!-- Due date pill -->
              <label
                @click="openDatePicker"
                :class="[
                'relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
                form.due_date
                  ? dueDatePast
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400',
              ]">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                <span v-if="form.due_date">{{ formatDueDate(form.due_date) }}</span>
                <span v-else>Add due date</span>
                <input
                  ref="dateInput"
                  v-model="form.due_date"
                  type="date"
                  :disabled="readOnly"
                  class="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-default"
                  :aria-label="'Due date'"
                />
              </label>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Description</label>
              <textarea
                v-model="form.description"
                rows="4"
                :disabled="readOnly"
                class="input resize-none text-sm disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-default"
                placeholder="Add details, notes, or context…"
              />
            </div>

            <!-- Linked tasks section (inline) -->
            <TaskLinks :task-id="task._id" :board-id="boardId" :read-only="readOnly" @open-task="(id) => $emit('open-task', id)" />
          </form>
        </div>

        <!-- Right column: sidebar with tabs -->
        <div class="w-72 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-700 flex flex-col bg-zinc-50/50 dark:bg-zinc-800/30 overflow-hidden">
          <!-- Tab bar -->
          <div class="flex border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300',
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              <span>{{ tab.label }}</span>
              <span v-if="tab.count > 0" class="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full leading-none"
                :class="activeTab === tab.id ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'"
              >{{ tab.count }}</span>
              <!-- Active indicator -->
              <span v-if="activeTab === tab.id" class="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-t" />
            </button>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-y-auto">
            <div v-show="activeTab === 'comments'" class="p-4">
              <TaskComments :task-id="task._id" :board-id="boardId" />
            </div>
            <div v-show="activeTab === 'attachments'" class="p-4">
              <TaskAttachments :task-id="task._id" :read-only="readOnly" />
            </div>
          </div>
        </div>
      </div>

      <!-- New task: single-column form -->
      <form v-else @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-title">
            Title <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="new-task-title"
            v-model="form.title"
            type="text"
            required
            autofocus
            class="input"
            placeholder="What needs to be done?"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-desc">Description</label>
          <textarea
            id="new-task-desc"
            v-model="form.description"
            rows="3"
            class="input resize-none"
            placeholder="Add more context or details…"
          />
        </div>

        <!-- Status + Priority row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-status">Status</label>
            <div class="relative">
              <select id="new-task-status" v-model="form.status" class="input pr-8 appearance-none">
                <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-priority">Priority</label>
            <div class="relative">
              <select id="new-task-priority" v-model="form.priority" class="input pr-8 appearance-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-due">Due Date</label>
          <input id="new-task-due" v-model="form.due_date" type="date" class="input" />
        </div>

        <!-- Error -->
        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-lg"
        >
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          {{ errorMsg }}
        </div>
      </form>

      <!-- Error (edit mode — sits above footer) -->
      <div
        v-if="task && errorMsg"
        role="alert"
        class="mx-6 mb-2 flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-lg"
      >
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        {{ errorMsg }}
      </div>

      <!-- Footer actions -->
      <div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-3 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/50">
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
import { ref, reactive, computed, h } from 'vue';
import TaskComments from './TaskComments.vue';
import TaskLinks from './TaskLinks.vue';
import TaskAttachments from './TaskAttachments.vue';
import { useCommentsStore } from '@/stores/comments';
import { useAttachmentsStore } from '@/stores/attachments';
import { storeToRefs } from 'pinia';

const props = defineProps({
  task: { type: Object, default: null },
  boardId: { type: String, default: null },
  defaultStatus: { type: String, default: 'todo' },
  readOnly: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
});
const emit = defineEmits(['save', 'close', 'open-task']);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const statusOptions = computed(() =>
  props.statuses.length ? props.statuses : DEFAULT_STATUSES
);

const currentStatus = computed(() =>
  statusOptions.value.find((s) => s.id === form.status)
);
const currentStatusColor = computed(() => currentStatus.value?.color || '#a1a1aa');

const statusPillStyle = computed(() => {
  const color = currentStatusColor.value;
  return {
    backgroundColor: `${color}18`,
    borderColor: `${color}40`,
    color: color,
  };
});

const saving = ref(false);
const errorMsg = ref('');
const activeTab = ref('comments');
const dateInput = ref(null);

function openDatePicker() {
  if (props.readOnly) return;
  dateInput.value?.showPicker?.();
}

const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  status: props.task?.status || props.defaultStatus,
  priority: props.task?.priority || 'medium',
  due_date: props.task?.due_date || '',
});

const priorityPillClass = computed(() => ({
  low: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400',
  medium: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  high: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
}[form.priority] || 'bg-zinc-100 border-zinc-200 text-zinc-600'));

const priorityDotClass = computed(() => ({
  low: 'bg-zinc-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}[form.priority] || 'bg-zinc-400'));

const dueDatePast = computed(() => {
  if (!form.due_date) return false;
  return new Date(form.due_date) < new Date(new Date().toDateString());
});

// Tab definitions with icons and live counts
const commentsStore = useCommentsStore();
const attachmentsStore = useAttachmentsStore();
const { comments } = storeToRefs(commentsStore);
const { attachments } = storeToRefs(attachmentsStore);

const CommentIcon = {
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' }),
  ]),
};
const AttachmentIcon = {
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13' }),
  ]),
};

const tabs = computed(() => [
  { id: 'comments', label: 'Comments', icon: CommentIcon, count: comments.value.length },
  { id: 'attachments', label: 'Files', icon: AttachmentIcon, count: attachments.value.length },
]);

function formatDueDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

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
