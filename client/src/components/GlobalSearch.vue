<template>
  <teleport to="body">
    <div
      v-if="searchStore.open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 pt-[8vh] sm:px-6 sm:pt-[12vh] animate-fade-in"
      @click.self="close"
    >
      <div
        class="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-modal dark:border-zinc-700 dark:bg-zinc-900 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Search tasks and notes"
      >
        <!-- Header -->
        <div class="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-5">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Search</p>
              <h2 class="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Find tasks and notes</h2>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close search"
              @click="close"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-card transition-colors focus-within:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/70 dark:focus-within:border-zinc-500">
            <svg class="h-5 w-5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref="inputRef"
              v-model="searchStore.query"
              type="text"
              class="min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              placeholder="Search by task title, description, or note content…"
              @input="onInput"
              @keydown.enter.prevent="openSelected"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.escape="searchStore.close()"
            >
            <div class="hidden items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 sm:flex" aria-hidden="true">
              <kbd class="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">Ctrl</kbd>
              <kbd class="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">K</kbd>
            </div>
          </div>

          <div v-if="hasQuery" class="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium shadow-card dark:bg-zinc-800">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {{ resultSummary }}
            </span>
            <span v-if="matchingBoardCount" class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium shadow-card dark:bg-zinc-800">
              <svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {{ matchingBoardCount }} {{ matchingBoardCount === 1 ? 'board' : 'boards' }}
            </span>
          </div>
        </div>

        <!-- Initial state -->
        <div v-if="!hasQuery" class="px-5 py-8 sm:px-8 sm:py-10">
          <div class="mx-auto max-w-md text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start typing to search your workspace</h3>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Results include useful context like board, status, priority, due dates, labels, and last update.</p>
          </div>

        </div>

        <!-- Loading -->
        <div v-else-if="searchStore.loading" class="space-y-3 px-4 py-4 sm:px-5">
          <div v-for="i in 4" :key="i" class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <div class="flex gap-3">
              <div class="h-10 w-10 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div class="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div class="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-else-if="flatResults.length" class="max-h-[58vh] overflow-y-auto px-3 py-3 sm:px-4">
          <section v-for="section in resultSections" :key="section.type" class="mb-4 last:mb-0">
            <div class="sticky top-0 z-10 -mx-1 mb-2 flex items-center justify-between rounded-lg bg-white/95 px-2 py-1.5 backdrop-blur dark:bg-zinc-900/95">
              <div class="flex items-center gap-2">
                <span :class="['flex h-6 w-6 items-center justify-center rounded-lg', section.iconClass]">
                  <svg v-if="section.type === 'task'" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                  </svg>
                </span>
                <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{{ section.label }}</h3>
              </div>
              <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500">{{ section.results.length }}</span>
            </div>

            <div class="space-y-2">
              <button
                v-for="result in section.results"
                :key="resultKey(result)"
                type="button"
                :class="[
                  'group w-full rounded-xl border p-3 text-left transition-all duration-150 focus-visible:ring-offset-0',
                  selectedKey === resultKey(result)
                    ? 'border-brand-300 bg-brand-50/80 shadow-card-hover dark:border-brand-700/70 dark:bg-brand-950/30'
                    : 'border-zinc-200 bg-white hover:border-brand-200 hover:bg-zinc-50 hover:shadow-card dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70',
                ]"
                @mouseenter="selectResult(result)"
                @click="goToResult(result)"
              >
                <div class="flex gap-3">
                  <div :class="['mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', result.type === 'task' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300']">
                    <svg v-if="result.type === 'task'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                    </svg>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-start gap-x-2 gap-y-1">
                      <p class="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{{ result.title || untitledLabel(result) }}</p>
                      <span :class="['inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', result.type === 'task' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300']">
                        {{ result.type }}
                      </span>
                    </div>

                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span class="inline-flex min-w-0 items-center gap-1.5">
                        <svg class="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        <span class="truncate">{{ boardName(result) }}</span>
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{{ formatUpdated(result) }}</span>
                    </div>

                    <p v-if="excerpt(result)" class="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                      {{ excerpt(result) }}
                    </p>

                    <div class="mt-3 flex flex-wrap items-center gap-1.5">
                      <template v-if="result.type === 'task'">
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          :style="statusChipStyle(result)"
                        >
                          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: statusMeta(result).color }" />
                          {{ statusMeta(result).label }}
                        </span>
                        <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold', priorityMeta(result).class]">
                          <span :class="['h-1.5 w-1.5 rounded-full', priorityMeta(result).dotClass]" />
                          {{ priorityMeta(result).label }}
                        </span>
                        <span v-if="dueDateMeta(result)" :class="['inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold', dueDateMeta(result).class]">
                          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {{ dueDateMeta(result).label }}
                        </span>
                        <span
                          v-for="label in labelMeta(result).slice(0, 3)"
                          :key="`${resultKey(result)}-${label.id}`"
                          class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: label.color }" />
                          {{ label.name }}
                        </span>
                        <span v-if="labelMeta(result).length > 3" class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          +{{ labelMeta(result).length - 3 }}
                        </span>
                      </template>
                      <template v-else>
                        <span class="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300">
                          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 18.55 2.8a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                          Board note
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        <!-- Empty state -->
        <div v-else class="px-5 py-10 text-center sm:px-8">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75 21 21m-4.5-9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No matching tasks or notes</h3>
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Try a different keyword, label, status, or board-specific phrase.</p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          <div class="flex items-center gap-2">
            <span class="hidden sm:inline">Navigate</span>
            <kbd class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-medium dark:border-zinc-700 dark:bg-zinc-800">↑</kbd>
            <kbd class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-medium dark:border-zinc-700 dark:bg-zinc-800">↓</kbd>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-medium dark:border-zinc-700 dark:bg-zinc-800">Enter</kbd>
            <span>open</span>
            <kbd class="ml-2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-medium dark:border-zinc-700 dark:bg-zinc-800">Esc</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import { useSearchStore } from '@/stores/search';

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const PRIORITY_META = {
  low: {
    label: 'Low priority',
    class: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    dotClass: 'bg-zinc-400',
  },
  medium: {
    label: 'Medium priority',
    class: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    dotClass: 'bg-amber-400',
  },
  high: {
    label: 'High priority',
    class: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
  critical: {
    label: 'Critical priority',
    class: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
};

const searchStore = useSearchStore();
const boardsStore = useBoardsStore();
const router = useRouter();
const inputRef = ref(null);
const selectedIndex = ref(0);

const hasQuery = computed(() => Boolean(searchStore.query.trim()));
const taskResults = computed(() => searchStore.results.filter((r) => r.type === 'task'));
const noteResults = computed(() => searchStore.results.filter((r) => r.type === 'note'));
const flatResults = computed(() => [...taskResults.value, ...noteResults.value]);
const selectedKey = computed(() => {
  const selected = flatResults.value[selectedIndex.value];
  return selected ? resultKey(selected) : '';
});

const boardMap = computed(() => {
  const map = new Map();
  for (const board of boardsStore.boards) map.set(board._id, board);
  return map;
});

const matchingBoardCount = computed(() => new Set(flatResults.value.map((r) => r.board_id).filter(Boolean)).size);
const resultSummary = computed(() => {
  if (searchStore.loading) return 'Searching…';
  const total = flatResults.value.length;
  if (!total) return 'No results yet';
  const pieces = [`${total} ${total === 1 ? 'result' : 'results'}`];
  if (taskResults.value.length) pieces.push(`${taskResults.value.length} ${taskResults.value.length === 1 ? 'task' : 'tasks'}`);
  if (noteResults.value.length) pieces.push(`${noteResults.value.length} ${noteResults.value.length === 1 ? 'note' : 'notes'}`);
  return pieces.join(' • ');
});

const resultSections = computed(() => [
  {
    type: 'task',
    label: 'Tasks',
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
    results: taskResults.value,
  },
  {
    type: 'note',
    label: 'Notes',
    iconClass: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
    results: noteResults.value,
  },
].filter((section) => section.results.length));

function resultKey(result) {
  return `${result.type}-${result.id}`;
}

function close() {
  searchStore.close();
}

function openSelected() {
  if (!flatResults.value.length) return;
  goToResult(flatResults.value[selectedIndex.value] || flatResults.value[0]);
}

function moveSelection(delta) {
  if (!flatResults.value.length) return;
  selectedIndex.value = (selectedIndex.value + delta + flatResults.value.length) % flatResults.value.length;
}

function selectResult(result) {
  const index = flatResults.value.findIndex((item) => resultKey(item) === resultKey(result));
  if (index !== -1) selectedIndex.value = index;
}

function goToResult(result) {
  const query = {};
  if (result.type === 'task') query.task = result.id;
  else if (result.type === 'note') query.note = result.id;
  router.push({ name: 'board', params: { id: result.board_id }, query });
  close();
}

function boardFor(result) {
  return boardMap.value.get(result.board_id);
}

function boardName(result) {
  return boardFor(result)?.name || 'Board';
}

function untitledLabel(result) {
  return result.type === 'note' ? 'Untitled note' : 'Untitled task';
}

function humanize(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusMeta(result) {
  const statuses = boardFor(result)?.statuses?.length ? boardFor(result).statuses : DEFAULT_STATUSES;
  return statuses.find((status) => status.id === result.status) || {
    id: result.status,
    label: humanize(result.status || 'Unknown'),
    color: '#a1a1aa',
    done: false,
  };
}

function statusChipStyle(result) {
  const status = statusMeta(result);
  return {
    backgroundColor: `${status.color}18`,
    borderColor: `${status.color}40`,
    color: status.color,
  };
}

function priorityMeta(result) {
  return PRIORITY_META[result.priority] || PRIORITY_META.medium;
}

function labelMeta(result) {
  if (!Array.isArray(result.labels) || !result.labels.length) return [];
  const labels = boardFor(result)?.labels || [];
  return result.labels.map((labelId) => {
    const label = labels.find((item) => item.id === labelId);
    return label || { id: labelId, name: humanize(labelId), color: '#a1a1aa' };
  });
}

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dueDateMeta(result) {
  const date = parseDateOnly(result.due_date);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((date - today) / 86400000);
  let label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffDays === 0) label = 'Due today';
  else if (diffDays === 1) label = 'Due tomorrow';
  else if (diffDays < 0) label = `${Math.abs(diffDays)}d overdue`;
  else label = `Due ${label}`;

  const tone = diffDays < 0
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
    : diffDays <= 1
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
      : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

  return { label, class: tone };
}

function formatUpdated(result) {
  const value = result.updated_at || result.created_at;
  if (!value) return 'Recently updated';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updatedDay = new Date(date);
  updatedDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - updatedDay) / 86400000);

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays > 1 && diffDays < 7) return `Updated ${diffDays} days ago`;
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function excerpt(result) {
  return String(result.description || result.content || '')
    .replace(/[#*_>`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let debounceTimer;
function onInput() {
  clearTimeout(debounceTimer);
  selectedIndex.value = 0;
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
  if (val) {
    selectedIndex.value = 0;
    nextTick(() => inputRef.value?.focus());
    if (!boardsStore.boards.length) boardsStore.fetchBoards();
  }
});

watch(() => flatResults.value.length, () => {
  selectedIndex.value = 0;
});
</script>
