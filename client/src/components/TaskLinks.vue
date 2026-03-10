<template>
  <div>
    <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" /></svg>
      Linked Tasks
      <span v-if="links.length" class="text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">{{ links.length }}</span>
    </h3>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2 mb-4">
      <div v-for="i in 2" :key="i" class="h-9 bg-zinc-100 dark:bg-zinc-700 rounded-lg animate-pulse" />
    </div>

    <!-- Link list -->
    <ul v-else-if="links.length" class="space-y-2 mb-4">
      <li
        v-for="link in links"
        :key="link._id"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group"
      >
        <span
          class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          :class="relationBadgeClass(link)"
        >
          {{ relationLabel(link) }}
        </span>
        <span class="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1 min-w-0">{{ link.linked_task_title }}</span>
        <button
          v-if="!readOnly"
          type="button"
          @click="handleDelete(link)"
          class="text-xs text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          aria-label="Remove link"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </li>
    </ul>

    <p v-else-if="!loading" class="text-xs text-zinc-400 dark:text-zinc-500 mb-4">No linked tasks yet.</p>

    <!-- Add link form -->
    <div v-if="!readOnly">
      <button
        v-if="!showAddForm"
        type="button"
        @click="showAddForm = true"
        class="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
      >
        + Add Link
      </button>

      <div v-else class="space-y-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <!-- Relation type -->
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Relation</label>
          <select v-model="newRelation" class="input text-sm">
            <option value="depends_on">Depends On</option>
            <option value="blocked_by">Blocked By</option>
            <option value="subtask_of">Is a Subtask Of</option>
            <option value="parent_of">Has Subtask</option>
            <option value="related_to">Is Related To</option>
          </select>
        </div>

        <!-- Target task search -->
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Task</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              class="input text-sm"
              placeholder="Search tasks by title…"
              @input="handleSearch"
            />
            <!-- Search results dropdown -->
            <ul
              v-if="searchResults.length"
              class="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto"
            >
              <li
                v-for="t in searchResults"
                :key="t._id"
                @click="selectTask(t)"
                class="px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer truncate"
              >
                {{ t.title }}
              </li>
            </ul>
          </div>
          <div v-if="selectedTask" class="mt-1.5 flex items-center gap-2">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">Selected:</span>
            <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ selectedTask.title }}</span>
            <button type="button" @click="selectedTask = null" class="text-xs text-zinc-400 hover:text-red-500">&times;</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button type="button" @click="cancelAdd" class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium">Cancel</button>
          <button
            type="button"
            :disabled="!selectedTask || adding"
            @click="handleAdd"
            class="text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {{ adding ? 'Linking…' : 'Add Link' }}
          </button>
        </div>
        <div v-if="addError" class="text-xs text-red-600 dark:text-red-400">{{ addError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { useLinksStore } from '@/stores/links';
import { useTasksStore } from '@/stores/tasks';

const RELATION_LABELS = {
  depends_on: { outward: 'Depends On', inward: 'Blocks' },
  related_to: { outward: 'Is Related To', inward: 'Is Related To' },
  subtask_of: { outward: 'Is a Subtask Of', inward: 'Has Subtask' },
};

const RELATION_BADGE_CLASSES = {
  depends_on: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  related_to: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  subtask_of: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
};

// Inverse relation mappings: UI-only "inverse" options map to stored relations with flipped direction
const INVERSE_MAP = {
  blocked_by: { relation: 'depends_on', flip: true },
  parent_of: { relation: 'subtask_of', flip: true },
};

const props = defineProps({
  taskId: { type: String, required: true },
  boardId: { type: String, required: true },
  readOnly: { type: Boolean, default: false },
});

const linksStore = useLinksStore();
const tasksStore = useTasksStore();
const { links, loading } = storeToRefs(linksStore);

const showAddForm = ref(false);
const newRelation = ref('depends_on');
const searchQuery = ref('');
const searchResults = ref([]);
const selectedTask = ref(null);
const adding = ref(false);
const addError = ref('');

onMounted(() => linksStore.fetchLinks(props.taskId));
onUnmounted(() => linksStore.clearLinks());

function relationLabel(link) {
  const labels = RELATION_LABELS[link.relation];
  return labels ? labels[link.direction] : link.relation;
}

function relationBadgeClass(link) {
  return RELATION_BADGE_CLASSES[link.relation] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400';
}

function handleSearch() {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    searchResults.value = [];
    return;
  }
  // Filter from the tasks already loaded in the board, excluding current task and already-linked tasks
  const linkedIds = new Set(links.value.map((l) => l.linked_task_id));
  linkedIds.add(props.taskId);
  searchResults.value = tasksStore.tasks
    .filter((t) => !linkedIds.has(t._id) && t.title.toLowerCase().includes(q))
    .slice(0, 8);
}

function selectTask(task) {
  selectedTask.value = task;
  searchQuery.value = '';
  searchResults.value = [];
}

function cancelAdd() {
  showAddForm.value = false;
  newRelation.value = 'depends_on';
  searchQuery.value = '';
  searchResults.value = [];
  selectedTask.value = null;
  addError.value = '';
}

async function handleAdd() {
  if (!selectedTask.value || adding.value) return;
  adding.value = true;
  addError.value = '';

  let relation = newRelation.value;
  let sourceId = props.taskId;
  let targetId = selectedTask.value._id;

  // Handle inverse relations: flip source/target
  const inverse = INVERSE_MAP[relation];
  if (inverse) {
    relation = inverse.relation;
    [sourceId, targetId] = [targetId, sourceId];
  }

  try {
    // Always create from sourceId's perspective
    if (sourceId === props.taskId) {
      await linksStore.addLink(props.taskId, targetId, relation);
    } else {
      // We need to create via the target's endpoint, then re-fetch our links
      const api = (await import('@/api/client')).default;
      await api.post(`/tasks/${sourceId}/links`, {
        target_id: targetId,
        relation,
      });
      await linksStore.fetchLinks(props.taskId);
    }
    cancelAdd();
  } catch (err) {
    addError.value = err.response?.data?.error || 'Failed to create link';
  } finally {
    adding.value = false;
  }
}

async function handleDelete(link) {
  await linksStore.deleteLink(props.taskId, link._id);
}
</script>
