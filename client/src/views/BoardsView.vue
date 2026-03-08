<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Boards</h2>
      <button
        @click="showCreate = true"
        class="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <span class="text-lg leading-none">+</span> New Board
      </button>
    </div>

    <div v-if="boardsStore.loading" class="text-center py-16 text-gray-400">Loading boards…</div>

    <div v-else-if="boardsStore.error" class="text-center py-16 text-red-500">{{ boardsStore.error }}</div>

    <div v-else-if="boardsStore.boards.length === 0" class="text-center py-16">
      <p class="text-gray-400">No boards yet.</p>
      <button @click="showCreate = true" class="mt-3 text-brand-600 hover:underline text-sm font-medium">
        Create your first board
      </button>
    </div>

    <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <li
        v-for="board in boardsStore.boards"
        :key="board._id"
        class="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow group"
      >
        <RouterLink :to="{ name: 'kanban', params: { id: board._id } }" class="block">
          <div class="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3">
            <span class="text-brand-600 text-lg font-bold">{{ board.name[0].toUpperCase() }}</span>
          </div>
          <h3 class="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
            {{ board.name }}
          </h3>
          <p class="text-xs text-gray-400 mt-1">
            Created {{ formatDate(board.created_at) }}
          </p>
        </RouterLink>

        <div class="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            @click.stop="startRename(board)"
            class="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Rename
          </button>
          <button
            @click.stop="handleDelete(board)"
            class="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <!-- Create board modal -->
    <BoardNameModal
      v-if="showCreate"
      title="New Board"
      confirm-label="Create"
      @confirm="handleCreate"
      @close="showCreate = false"
    />

    <!-- Rename board modal -->
    <BoardNameModal
      v-if="renamingBoard"
      title="Rename Board"
      confirm-label="Save"
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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function startRename(board) {
  renamingBoard.value = board;
}

async function handleCreate(name) {
  await boardsStore.createBoard(name);
  showCreate.value = false;
}

async function handleRename(name) {
  await boardsStore.renameBoard(renamingBoard.value._id, name);
  renamingBoard.value = null;
}

async function handleDelete(board) {
  if (confirm(`Delete board "${board.name}" and all its tasks?`)) {
    await boardsStore.deleteBoard(board._id);
  }
}
</script>
