<template>
  <div class="max-w-screen-xl mx-auto px-6 py-10">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-zinc-900">My Boards</h2>
        <p class="mt-1 text-sm text-zinc-500">
          {{ boardsStore.boards.length }} board{{ boardsStore.boards.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button @click="showCreate = true" class="btn-primary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Board
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="boardsStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading boards">
      <div v-for="i in 3" :key="i" class="h-44 rounded-2xl bg-zinc-200/60 animate-pulse" aria-hidden="true" />
    </div>

    <!-- Error -->
    <div
      v-else-if="boardsStore.error"
      role="alert"
      class="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl max-w-md"
    >
      <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      {{ boardsStore.error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="boardsStore.boards.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4" aria-hidden="true">
        <svg class="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </div>
      <h3 class="text-base font-semibold text-zinc-900">No boards yet</h3>
      <p class="mt-1.5 text-sm text-zinc-500 max-w-xs">
        Create your first board to start organizing tasks with kanban, list, or calendar views.
      </p>
      <button @click="showCreate = true" class="btn-primary mt-6">
        Create your first board
      </button>
    </div>

    <!-- Board grid -->
    <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
      <li
        v-for="(board, index) in boardsStore.boards"
        :key="board._id"
        class="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-zinc-200/80 hover:border-zinc-300 transition-all duration-200 overflow-hidden flex flex-col animate-slide-up"
      >
        <!-- Color band -->
        <div :class="['h-2 w-full flex-shrink-0', bandColor(index)]" aria-hidden="true" />

        <RouterLink
          :to="{ name: 'board', params: { id: board._id } }"
          class="flex-1 p-5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
          :aria-label="`Open board: ${board.name}`"
        >
          <div
            :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-lg select-none', avatarBg(index)]"
            aria-hidden="true"
          >
            {{ board.name[0].toUpperCase() }}
          </div>
          <h3 class="font-semibold text-zinc-900 group-hover:text-brand-700 transition-colors leading-snug">
            {{ board.name }}
          </h3>
          <p class="text-xs text-zinc-400 mt-1">Created {{ formatDate(board.created_at) }}</p>
        </RouterLink>

        <div class="px-5 pb-4 flex items-center gap-1 border-t border-zinc-100 pt-3">
          <button
            @click.stop="startRename(board)"
            class="text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 px-2.5 py-1 rounded-md transition-colors font-medium"
          >
            Rename
          </button>
          <div class="flex-1" />
          <button
            @click.stop="handleDelete(board)"
            class="text-xs text-zinc-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <!-- Modals -->
    <BoardNameModal
      v-if="showCreate"
      title="New Board"
      confirm-label="Create board"
      @confirm="handleCreate"
      @close="showCreate = false"
    />
    <BoardNameModal
      v-if="renamingBoard"
      title="Rename Board"
      confirm-label="Save changes"
      :initial-value="renamingBoard.name"
      @confirm="handleRename"
      @close="renamingBoard = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import BoardNameModal from '@/components/BoardNameModal.vue';

const boardsStore = useBoardsStore();
const showCreate = ref(false);
const renamingBoard = ref(null);

onMounted(() => boardsStore.fetchBoards());

const BANDS = [
  'bg-gradient-to-r from-violet-500 to-brand-500',
  'bg-gradient-to-r from-blue-500 to-cyan-400',
  'bg-gradient-to-r from-emerald-400 to-teal-500',
  'bg-gradient-to-r from-amber-400 to-orange-400',
  'bg-gradient-to-r from-rose-400 to-pink-500',
  'bg-gradient-to-r from-indigo-500 to-purple-500',
];
const AVATAR_BG = [
  'bg-gradient-to-br from-violet-500 to-brand-600',
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-indigo-500 to-purple-600',
];

function bandColor(i) { return BANDS[i % BANDS.length]; }
function avatarBg(i) { return AVATAR_BG[i % AVATAR_BG.length]; }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function startRename(board) { renamingBoard.value = board; }

async function handleCreate(name) {
  await boardsStore.createBoard(name);
  showCreate.value = false;
}

async function handleRename(name) {
  await boardsStore.renameBoard(renamingBoard.value._id, name);
  renamingBoard.value = null;
}

async function handleDelete(board) {
  if (confirm(`Delete "${board.name}" and all its tasks? This can't be undone.`)) {
    await boardsStore.deleteBoard(board._id);
  }
}
</script>
