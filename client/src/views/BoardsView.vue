<template>
  <div class="max-w-screen-xl mx-auto px-6 py-10">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Boards</h2>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {{ ownedBoards.length }} board{{ ownedBoards.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button @click="showCreate = true" class="btn-primary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Board
      </button>
    </div>

    <!-- Invitations banner -->
    <InvitationsBanner />

    <!-- Loading skeleton -->
    <div v-if="boardsStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading boards">
      <div v-for="i in 3" :key="i" class="h-44 rounded-2xl bg-zinc-200/60 dark:bg-zinc-700/60 animate-pulse" aria-hidden="true" />
    </div>

    <!-- Error -->
    <div
      v-else-if="boardsStore.error"
      role="alert"
      class="flex items-center gap-3 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 rounded-xl max-w-md"
    >
      <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      {{ boardsStore.error }}
    </div>

    <template v-else>
      <!-- Empty state (no owned boards) -->
      <div v-if="ownedBoards.length === 0 && sharedBoards.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4" aria-hidden="true">
          <svg class="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">No boards yet</h3>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          Create your first board to start organizing tasks with kanban, list, or calendar views.
        </p>
        <button @click="showCreate = true" class="btn-primary mt-6">
          Create your first board
        </button>
      </div>

      <template v-else>
        <!-- My Boards -->
        <section v-if="ownedBoards.length > 0">
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
            <li
              v-for="(board, index) in ownedBoards"
              :key="board._id"
              class="group relative bg-white dark:bg-zinc-800 rounded-2xl shadow-card hover:shadow-card-hover border border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden flex flex-col animate-slide-up"
            >
              <div :class="['h-2 w-full flex-shrink-0', bandColor(index)]" aria-hidden="true" />
              <RouterLink
                :to="{ name: 'board', params: { id: board._id } }"
                class="flex-1 p-5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                :aria-label="`Open board: ${board.name}`"
              >
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-lg select-none', avatarBg(index)]" aria-hidden="true">
                  {{ board.name[0].toUpperCase() }}
                </div>
                <h3 class="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-700 transition-colors leading-snug">{{ board.name }}</h3>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Created {{ formatDate(board.created_at) }}</p>
              </RouterLink>
              <div class="px-5 pb-4 flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
                <button @click.stop="startRename(board)" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors font-medium">
                  Rename
                </button>
                <button @click.stop="startShare(board)" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 px-2.5 py-1 rounded-md transition-colors font-medium">
                  Share
                </button>
                <div class="flex-1" />
                <button @click.stop="handleDelete(board)" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-md transition-colors font-medium">
                  Delete
                </button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Shared with me -->
        <section v-if="sharedBoards.length > 0" :class="ownedBoards.length > 0 ? 'mt-10' : ''">
          <h3 class="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4">Shared with me</h3>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
            <li
              v-for="(board, index) in sharedBoards"
              :key="board._id"
              class="group relative bg-white dark:bg-zinc-800 rounded-2xl shadow-card hover:shadow-card-hover border border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden flex flex-col animate-slide-up"
            >
              <div class="h-2 w-full flex-shrink-0 bg-gradient-to-r from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-500" aria-hidden="true" />
              <RouterLink
                :to="{ name: 'board', params: { id: board._id } }"
                class="flex-1 p-5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                :aria-label="`Open shared board: ${board.name}`"
              >
                <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold text-lg select-none" aria-hidden="true">
                  {{ board.name[0].toUpperCase() }}
                </div>
                <h3 class="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-700 transition-colors leading-snug">{{ board.name }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-zinc-400 dark:text-zinc-500">Shared board</span>
                  <span :class="['text-xs font-medium px-1.5 py-0.5 rounded-full', board._access === 'write' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400']">
                    {{ board._access === 'write' ? 'Read & Write' : 'Read only' }}
                  </span>
                </div>
              </RouterLink>
            </li>
          </ul>
        </section>
      </template>
    </template>

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
    <ShareBoardModal
      v-if="sharingBoard"
      :board-id="sharingBoard._id"
      :board-name="sharingBoard.name"
      @close="sharingBoard = null"
    />
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete board?"
      @confirm="executeDeleteBoard"
    >
      Delete "<span class="font-medium text-zinc-700 dark:text-zinc-300">{{ pendingDeleteBoard?.name }}</span>" and all its tasks? This can't be undone.
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import { useInvitationsStore } from '@/stores/invitations';
import BoardNameModal from '@/components/BoardNameModal.vue';
import ShareBoardModal from '@/components/ShareBoardModal.vue';
import InvitationsBanner from '@/components/InvitationsBanner.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const boardsStore = useBoardsStore();
const invitationsStore = useInvitationsStore();
const showCreate = ref(false);
const renamingBoard = ref(null);
const sharingBoard = ref(null);
const showDeleteConfirm = ref(false);
const pendingDeleteBoard = ref(null);

onMounted(() => {
  boardsStore.fetchBoards();
  invitationsStore.fetchInvitations();
});

const ownedBoards = computed(() => boardsStore.boards.filter((b) => b._role === 'owner'));
const sharedBoards = computed(() => boardsStore.boards.filter((b) => b._role === 'shared'));

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
function startShare(board) { sharingBoard.value = board; }

async function handleCreate(name) {
  await boardsStore.createBoard(name);
  showCreate.value = false;
}

async function handleRename(name) {
  await boardsStore.renameBoard(renamingBoard.value._id, name);
  renamingBoard.value = null;
}

async function handleDelete(board) {
  pendingDeleteBoard.value = board;
  showDeleteConfirm.value = true;
}

async function executeDeleteBoard() {
  if (pendingDeleteBoard.value) {
    await boardsStore.deleteBoard(pendingDeleteBoard.value._id);
    pendingDeleteBoard.value = null;
  }
}
</script>
