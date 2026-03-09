<template>
  <div v-if="invitations.length > 0" class="mb-6 space-y-2">
    <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wide px-1">
      Board Invitations
    </h3>
    <div
      v-for="inv in invitations"
      :key="inv.board_id"
      class="flex items-center gap-4 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3"
    >
      <div class="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <svg class="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-zinc-900 truncate">
          You've been invited to <span class="text-brand-700">{{ inv.board_name }}</span>
        </p>
        <p class="text-xs text-zinc-500 mt-0.5">
          {{ inv.access === 'write' ? 'Read & Write' : 'Read only' }} access
        </p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button
          @click="handleAccept(inv.board_id)"
          :disabled="responding === inv.board_id"
          class="text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Accept
        </button>
        <button
          @click="handleDecline(inv.board_id)"
          :disabled="responding === inv.board_id"
          class="text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useInvitationsStore } from '@/stores/invitations';
import { useBoardsStore } from '@/stores/boards';

const invitationsStore = useInvitationsStore();
const boardsStore = useBoardsStore();

const { invitations } = storeToRefs(invitationsStore);
const responding = ref(null);

async function handleAccept(boardId) {
  responding.value = boardId;
  try {
    await invitationsStore.accept(boardId);
    await boardsStore.fetchBoards(); // refresh boards list to include newly accepted board
  } finally {
    responding.value = null;
  }
}

async function handleDecline(boardId) {
  responding.value = boardId;
  try {
    await invitationsStore.decline(boardId);
  } finally {
    responding.value = null;
  }
}
</script>
