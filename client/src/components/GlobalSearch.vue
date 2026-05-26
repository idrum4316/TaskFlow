<template>
  <teleport to="body">
    <div
      v-if="searchStore.open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh] px-4"
      @click.self="close"
    >
      <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <svg class="w-5 h-5 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref="inputRef"
            v-model="searchStore.query"
            type="text"
            class="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-base outline-none"
            placeholder="Search tasks and notes…"
            @input="onInput"
            @keydown.enter="openFirst"
            @keydown.escape="close"
          >
          <span class="text-xs text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline-block">Ctrl K</span>
        </div>

        <!-- Loading -->
        <div v-if="searchStore.loading" class="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Searching…
        </div>

        <!-- Results -->
        <div v-else-if="searchStore.results.length" class="max-h-[50vh] overflow-y-auto">
          <div v-if="taskResults.length" class="py-2">
            <div class="px-4 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Tasks
            </div>
            <button
              v-for="result in taskResults"
              :key="result.id"
              class="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              @click="goToResult(result)"
            >
              <div class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ result.title }}</div>
              <div v-if="result.description" class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ result.description }}</div>
            </button>
          </div>
          <div v-if="noteResults.length" class="py-2">
            <div class="px-4 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Notes
            </div>
            <button
              v-for="result in noteResults"
              :key="result.id"
              class="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              @click="goToResult(result)"
            >
              <div class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ result.title }}</div>
              <div v-if="result.content" class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ result.content }}</div>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="searchStore.query && !searchStore.loading" class="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No results found.
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchStore } from '@/stores/search';

const searchStore = useSearchStore();
const router = useRouter();
const inputRef = ref(null);

const taskResults = computed(() => searchStore.results.filter((r) => r.type === 'task'));
const noteResults = computed(() => searchStore.results.filter((r) => r.type === 'note'));

function close() {
  searchStore.open = false;
  searchStore.clear();
}

function openFirst() {
  if (searchStore.results.length) {
    goToResult(searchStore.results[0]);
  }
}

function goToResult(result) {
  router.push({ name: 'board', params: { id: result.board_id } });
  close();
}

let debounceTimer;
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (searchStore.query.trim()) {
      searchStore.search(searchStore.query);
    } else {
      searchStore.results = [];
    }
  }, 250);
}

function onKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchStore.toggleOpen();
  }
  if (e.key === 'Escape' && searchStore.open) {
    e.preventDefault();
    close();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  clearTimeout(debounceTimer);
});

watch(() => searchStore.open, (val) => {
  if (val) nextTick(() => inputRef.value?.focus());
});
</script>
