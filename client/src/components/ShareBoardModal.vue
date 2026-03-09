<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="`Share ${boardName}`"
  >
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-700">
        <div>
          <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Share Board</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs">{{ boardName }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Invite form -->
      <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-700">
        <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Invite someone</p>
        <form @submit.prevent="handleInvite" class="flex gap-2">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Email address"
            class="flex-1 text-sm border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            :disabled="inviting"
          />
          <select
            v-model="inviteAccess"
            class="text-sm border border-zinc-200 dark:border-zinc-600 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            :disabled="inviting"
          >
            <option value="read">Read</option>
            <option value="write">Read & Write</option>
          </select>
          <button
            type="submit"
            :disabled="!inviteEmail.trim() || inviting"
            class="text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            {{ inviting ? 'Sending…' : 'Invite' }}
          </button>
        </form>
        <p v-if="inviteError" class="text-xs text-red-600 mt-2">{{ inviteError }}</p>
      </div>

      <!-- Shares list -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Shared with</p>

        <div v-if="sharesStore.loading" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 animate-pulse" />
        </div>

        <div v-else-if="sharesStore.shares.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">
          Not shared with anyone yet.
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="share in sharesStore.shares"
            :key="share.user_id"
            class="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl px-4 py-3"
          >
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none">
              {{ share.username?.[0]?.toUpperCase() || share.email[0].toUpperCase() }}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ share.username || share.email }}</span>
                <span
                  :class="[
                    'text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                    share.status === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                  ]"
                >
                  {{ share.status === 'accepted' ? 'Active' : 'Pending' }}
                </span>
              </div>
              <span class="text-xs text-zinc-400 dark:text-zinc-500 truncate block">{{ share.email }}</span>
            </div>

            <!-- Access selector -->
            <select
              :value="share.access"
              @change="handleAccessChange(share.user_id, $event.target.value)"
              class="text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="read">Read</option>
              <option value="write">Read & Write</option>
            </select>

            <!-- Revoke -->
            <button
              @click="handleRevoke(share.user_id)"
              class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors font-medium flex-shrink-0"
            >
              Remove
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSharesStore } from '@/stores/shares';

const props = defineProps({
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
});

defineEmits(['close']);

const sharesStore = useSharesStore();

const inviteEmail = ref('');
const inviteAccess = ref('write');
const inviting = ref(false);
const inviteError = ref(null);

onMounted(() => sharesStore.fetchShares(props.boardId));

async function handleInvite() {
  if (!inviteEmail.value.trim()) return;
  inviting.value = true;
  inviteError.value = null;
  try {
    await sharesStore.inviteUser(props.boardId, inviteEmail.value.trim(), inviteAccess.value);
    inviteEmail.value = '';
  } catch (err) {
    inviteError.value = err.response?.data?.error || 'Failed to send invitation';
  } finally {
    inviting.value = false;
  }
}

async function handleAccessChange(userId, access) {
  try {
    await sharesStore.updateAccess(props.boardId, userId, access);
  } catch {
    // re-fetch to revert UI
    sharesStore.fetchShares(props.boardId);
  }
}

async function handleRevoke(userId) {
  try {
    await sharesStore.revokeAccess(props.boardId, userId);
  } catch {
    // ignore
  }
}
</script>
