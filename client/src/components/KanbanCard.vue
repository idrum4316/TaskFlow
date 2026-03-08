<template>
  <article
    draggable="true"
    @dragstart="onDragStart"
    @dragend="dragging = false"
    class="bg-white rounded-xl shadow-card hover:shadow-card-hover border border-zinc-200/70 hover:border-zinc-300 transition-all duration-150 cursor-grab active:cursor-grabbing group focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-1 overflow-hidden"
    :class="{ 'opacity-60': task.status === 'done', 'opacity-40 scale-95': dragging }"
  >
    <!-- Priority left border -->
    <div class="flex">
      <div :class="['w-1 flex-shrink-0 rounded-l-xl', priorityBar]" aria-hidden="true" />

      <div class="flex-1 p-3 min-w-0">
        <!-- Title row -->
        <button
          class="w-full text-left focus:outline-none"
          @click="$emit('edit')"
          :aria-label="`Edit task: ${task.title}`"
        >
          <p
            :class="[
              'text-sm font-medium leading-snug',
              task.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-900',
            ]"
          >
            {{ task.title }}
          </p>
        </button>

        <p v-if="task.description" class="mt-1 text-xs text-zinc-500 line-clamp-2">
          {{ task.description }}
        </p>

        <!-- Footer -->
        <div class="flex items-center mt-2.5 gap-2">
          <!-- Due date -->
          <span
            v-if="task.due_date"
            :class="[
              'inline-flex items-center gap-1 text-xs rounded-md px-1.5 py-0.5',
              overdue
                ? 'text-red-700 bg-red-50 font-medium'
                : 'text-zinc-400 bg-zinc-50',
            ]"
          >
            <svg v-if="overdue" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
            {{ formatDate(task.due_date) }}
          </span>

          <div class="flex-1" />

          <!-- Priority badge -->
          <span :class="['text-xs font-medium rounded-full px-2 py-0.5', priorityBadge]">
            {{ task.priority }}
          </span>
        </div>

        <!-- Hover actions -->
        <div
          class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          @click.stop
          role="group"
          :aria-label="`Actions for ${task.title}`"
        >
          <button
            v-for="target in moveTargets"
            :key="target.status"
            @click="$emit('status-change', target.status)"
            :class="['text-xs px-2 py-0.5 rounded-md transition-colors font-medium', target.style]"
          >
            → {{ target.label }}
          </button>
          <button
            @click="$emit('delete')"
            class="text-xs text-zinc-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors ml-auto"
            :aria-label="`Delete task: ${task.title}`"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ task: { type: Object, required: true } });
defineEmits(['edit', 'delete', 'status-change']);

const dragging = ref(false);

function onDragStart(e) {
  dragging.value = true;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('taskId', props.task._id);
}

const priorityBar = computed(() => ({
  low: 'bg-zinc-300',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}[props.task.priority] || 'bg-zinc-300'));

const priorityBadge = computed(() => ({
  low: 'bg-zinc-100 text-zinc-500',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
}[props.task.priority] || 'bg-zinc-100 text-zinc-500'));

const overdue = computed(() =>
  !!props.task.due_date &&
  props.task.status !== 'done' &&
  new Date(props.task.due_date) < new Date()
);

const MOVE_TARGETS = {
  todo: { label: 'To Do', style: 'text-zinc-600 hover:bg-zinc-100' },
  'in-progress': { label: 'In Progress', style: 'text-brand-600 hover:bg-brand-50' },
  done: { label: 'Done', style: 'text-emerald-700 hover:bg-emerald-50' },
};

const moveTargets = computed(() =>
  Object.entries(MOVE_TARGETS)
    .filter(([s]) => s !== props.task.status)
    .map(([status, meta]) => ({ status, ...meta }))
);

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
