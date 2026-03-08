<template>
  <div class="px-6 py-4 overflow-y-auto flex-1">
    <div v-if="loading && !tasks.length" class="text-center py-16 text-gray-400">Loading…</div>

    <div v-else-if="!tasks.length" class="text-center py-16">
      <p class="text-gray-400 text-sm">No tasks yet.</p>
      <button @click="$emit('add', 'todo')" class="mt-3 text-brand-600 hover:underline text-sm font-medium">
        Add your first task
      </button>
    </div>

    <template v-else>
      <section v-for="group in groups" :key="group.status" class="mb-6">
        <button
          class="flex items-center gap-2 w-full text-left mb-2 group"
          @click="toggleGroup(group.status)"
        >
          <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', group.dot]" />
          <span class="text-sm font-semibold text-gray-700">{{ group.title }}</span>
          <span class="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{{ group.tasks.length }}</span>
          <span class="ml-auto text-gray-400 text-xs transition-transform" :class="collapsed[group.status] ? 'rotate-0' : 'rotate-90'">▶</span>
        </button>

        <ul v-if="!collapsed[group.status]" class="space-y-1">
          <li
            v-for="task in group.tasks"
            :key="task._id"
            class="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow group/row"
          >
            <!-- Priority dot -->
            <span :class="['w-2 h-2 rounded-full flex-shrink-0', priorityColor(task.priority)]" :title="task.priority" />

            <!-- Title + description -->
            <div class="flex-1 min-w-0">
              <span
                :class="['text-sm font-medium text-gray-900 truncate block', task.status === 'done' && 'line-through text-gray-400']"
              >
                {{ task.title }}
              </span>
              <span v-if="task.description" class="text-xs text-gray-400 truncate block">
                {{ task.description }}
              </span>
            </div>

            <!-- Due date -->
            <span
              v-if="task.due_date"
              :class="['text-xs flex-shrink-0 hidden sm:block', isOverdue(task) ? 'text-red-500' : 'text-gray-400']"
            >
              {{ isOverdue(task) ? '⚠ ' : '' }}{{ formatDate(task.due_date) }}
            </span>

            <!-- Status badge -->
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 hidden md:block', statusClass(task.status)]">
              {{ statusLabel(task.status) }}
            </span>

            <!-- Actions (revealed on hover) -->
            <div class="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
              <button
                @click="$emit('edit', task)"
                class="text-xs text-gray-400 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
              >
                Edit
              </button>
              <button
                @click="$emit('delete', task._id)"
                class="text-xs text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 px-2 py-1 rounded transition-colors"
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
import { computed, reactive } from 'vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['add', 'edit', 'delete']);

const collapsed = reactive({ todo: false, 'in-progress': false, done: false });

const STATUS_META = {
  todo: { title: 'To Do', dot: 'bg-gray-400' },
  'in-progress': { title: 'In Progress', dot: 'bg-blue-500' },
  done: { title: 'Done', dot: 'bg-green-500' },
};

const groups = computed(() =>
  ['todo', 'in-progress', 'done'].map((status) => ({
    status,
    ...STATUS_META[status],
    tasks: props.tasks.filter((t) => t.status === status),
  }))
);

function toggleGroup(status) {
  collapsed[status] = !collapsed[status];
}

const PRIORITY_COLORS = { low: 'bg-gray-300', medium: 'bg-yellow-400', high: 'bg-red-500' };
function priorityColor(p) { return PRIORITY_COLORS[p] || 'bg-gray-300'; }

const STATUS_CLASSES = {
  todo: 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};
function statusClass(s) { return STATUS_CLASSES[s] || 'bg-gray-100 text-gray-600'; }
function statusLabel(s) { return STATUS_META[s]?.title || s; }

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  return task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
}
</script>
