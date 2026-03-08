<template>
  <div class="px-6 py-5 overflow-y-auto flex-1">
    <!-- Loading skeleton -->
    <div v-if="loading && !tasks.length" class="space-y-1" aria-busy="true" aria-label="Loading tasks">
      <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-zinc-200/60 animate-pulse" aria-hidden="true" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!tasks.length" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3" aria-hidden="true">
        <svg class="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-sm font-medium text-zinc-700">No tasks yet</p>
      <p class="text-xs text-zinc-400 mt-1">Add your first task to get started</p>
      <button @click="$emit('add', 'todo')" class="btn-primary mt-4 text-xs">
        Add first task
      </button>
    </div>

    <template v-else>
      <section v-for="group in groups" :key="group.status" class="mb-5">
        <!-- Group header -->
        <button
          class="flex items-center gap-2 w-full text-left mb-2 py-1 rounded-lg hover:bg-zinc-100/60 px-1 transition-colors group/header"
          @click="toggleGroup(group.status)"
          :aria-expanded="!collapsed[group.status]"
          :aria-controls="`group-${group.status}`"
        >
          <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', group.dot]" aria-hidden="true" />
          <span class="text-sm font-semibold text-zinc-700">{{ group.title }}</span>
          <span class="text-xs font-medium text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5 tabular-nums">
            {{ group.tasks.length }}
          </span>
          <svg
            class="ml-auto w-4 h-4 text-zinc-400 transition-transform duration-150"
            :class="collapsed[group.status] ? '' : 'rotate-90'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <ul
          v-if="!collapsed[group.status]"
          :id="`group-${group.status}`"
          class="space-y-1 rounded-xl transition-colors"
          :class="dropTarget === group.status ? 'ring-2 ring-brand-400 bg-brand-50/40' : ''"
          role="list"
          @dragover.prevent="dropTarget = group.status"
          @dragleave="onListDragLeave"
          @drop="onListDrop($event, group.status)"
        >
          <li
            v-if="group.tasks.length === 0"
            class="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors"
            :class="dropTarget === group.status
              ? 'border-brand-300 bg-brand-50/60 text-brand-400'
              : 'border-zinc-200 text-zinc-300'"
            aria-hidden="true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
            <span class="text-sm font-medium">Drop here</span>
          </li>

          <li
            v-for="task in group.tasks"
            :key="task._id"
            draggable="true"
            @dragstart="onListDragStart($event, task._id)"
            @dragend="draggingId = null"
            class="flex items-center gap-3 bg-white border border-zinc-200/80 rounded-xl px-4 py-3 hover:border-zinc-300 hover:shadow-card transition-all duration-150 group/row cursor-grab active:cursor-grabbing"
            :class="draggingId === task._id ? 'opacity-40' : ''"
          >
            <!-- Priority bar -->
            <div :class="['w-1 h-8 rounded-full flex-shrink-0', priorityBar(task.priority)]" aria-hidden="true" />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <span
                :class="[
                  'text-sm font-medium block truncate',
                  task.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-900',
                ]"
              >
                {{ task.title }}
              </span>
              <span v-if="task.description" class="text-xs text-zinc-400 truncate block mt-0.5">
                {{ task.description }}
              </span>
            </div>

            <!-- Due date -->
            <span
              v-if="task.due_date"
              :class="[
                'text-xs flex-shrink-0 hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                isOverdue(task) ? 'text-red-700 bg-red-50 font-medium' : 'text-zinc-400 bg-zinc-50',
              ]"
            >
              <svg v-if="isOverdue(task)" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              {{ formatDate(task.due_date) }}
            </span>

            <!-- Status badge -->
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 hidden md:inline-block', statusClass(task.status)]">
              {{ statusLabel(task.status) }}
            </span>

            <!-- Actions -->
            <div
              class="flex gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0"
              role="group"
              :aria-label="`Actions for ${task.title}`"
            >
              <button
                @click="$emit('edit', task)"
                class="text-xs text-zinc-400 hover:text-brand-600 bg-zinc-100 hover:bg-brand-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                Edit
              </button>
              <button
                @click="$emit('delete', task._id)"
                class="text-xs text-zinc-400 hover:text-red-600 bg-zinc-100 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['add', 'edit', 'delete', 'status-change']);

const draggingId = ref(null);
const dropTarget = ref(null);

function onListDragStart(e, taskId) {
  draggingId.value = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('taskId', taskId);
}

function onListDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) dropTarget.value = null;
}

function onListDrop(e, status) {
  dropTarget.value = null;
  const taskId = e.dataTransfer.getData('taskId');
  if (taskId) emit('status-change', { id: taskId, status });
}

const collapsed = reactive({ todo: false, 'in-progress': false, done: false });

const STATUS_META = {
  todo: { title: 'To Do', dot: 'bg-zinc-400' },
  'in-progress': { title: 'In Progress', dot: 'bg-brand-500' },
  done: { title: 'Done', dot: 'bg-emerald-500' },
};

const groups = computed(() =>
  ['todo', 'in-progress', 'done'].map((status) => ({
    status,
    ...STATUS_META[status],
    tasks: props.tasks.filter((t) => t.status === status),
  }))
);

function toggleGroup(status) { collapsed[status] = !collapsed[status]; }

const PRIORITY_BARS = { low: 'bg-zinc-300', medium: 'bg-amber-400', high: 'bg-rose-500' };
function priorityBar(p) { return PRIORITY_BARS[p] || 'bg-zinc-300'; }

const STATUS_CLASSES = {
  todo: 'bg-zinc-100 text-zinc-600',
  'in-progress': 'bg-brand-100 text-brand-700',
  done: 'bg-emerald-100 text-emerald-700',
};
function statusClass(s) { return STATUS_CLASSES[s] || 'bg-zinc-100 text-zinc-600'; }
function statusLabel(s) { return STATUS_META[s]?.title || s; }

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  return task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
}
</script>
