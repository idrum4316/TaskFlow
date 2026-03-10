<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3 mb-4">
      <div v-for="i in 2" :key="i" class="flex gap-3">
        <div class="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-700 animate-pulse flex-shrink-0" />
        <div class="flex-1 space-y-1.5 pt-1">
          <div class="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-700 rounded animate-pulse" />
          <div class="h-2.5 w-full bg-zinc-100 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Comment list -->
    <ul v-else-if="comments.length" class="space-y-4 mb-4">
      <li v-for="comment in comments" :key="comment._id" class="flex gap-3 group">
        <div
          class="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center flex-shrink-0 select-none mt-0.5"
          aria-hidden="true"
        >
          {{ comment.username?.[0]?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ comment.username }}</span>
            <span class="text-xs text-zinc-400 dark:text-zinc-500">{{ formatRelative(comment.created_at) }}</span>
            <button
              v-if="canDelete(comment)"
              type="button"
              @click="handleDelete(comment)"
              class="ml-auto text-xs text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              :aria-label="`Delete comment by ${comment.username}`"
            >
              Delete
            </button>
          </div>
          <p class="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5 break-words whitespace-pre-wrap">{{ comment.body }}</p>
        </div>
      </li>
    </ul>

    <p v-else-if="!loading" class="text-xs text-zinc-400 dark:text-zinc-500 mb-4">No comments yet. Be the first to comment.</p>

    <!-- New comment input -->
    <div class="flex gap-2.5">
      <div
        class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-xs font-semibold flex items-center justify-center flex-shrink-0 select-none mt-0.5"
        aria-hidden="true"
      >
        {{ currentUserInitial }}
      </div>
      <div class="flex-1">
        <textarea
          v-model="newComment"
          rows="2"
          class="input resize-none text-sm"
          placeholder="Add a comment… (Ctrl+Enter to post)"
          @keydown.ctrl.enter.prevent="handlePost"
          @keydown.meta.enter.prevent="handlePost"
        />
        <button
          type="button"
          :disabled="!newComment.trim() || posting"
          @click="handlePost"
          class="mt-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {{ posting ? 'Posting…' : 'Post' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCommentsStore } from '@/stores/comments';
import { useAuthStore } from '@/stores/auth';
import { useBoardsStore } from '@/stores/boards';

const props = defineProps({
  taskId: { type: String, required: true },
  boardId: { type: String, required: true },
});

const commentsStore = useCommentsStore();
const authStore = useAuthStore();
const boardsStore = useBoardsStore();

const { comments, loading, posting } = storeToRefs(commentsStore);
const newComment = ref('');

onMounted(() => commentsStore.fetchComments(props.taskId));
onUnmounted(() => commentsStore.clearComments());

const currentUserInitial = computed(() =>
  authStore.user?.username?.[0]?.toUpperCase() || '?'
);

const boardOwnerId = computed(() =>
  boardsStore.boards.find((b) => b._id === props.boardId)?.user_id
);

function canDelete(comment) {
  const userId = authStore.user?.id;
  return comment.user_id === userId || boardOwnerId.value === userId;
}

async function handlePost() {
  if (!newComment.value.trim() || posting.value) return;
  await commentsStore.addComment(props.taskId, newComment.value.trim());
  newComment.value = '';
}

async function handleDelete(comment) {
  await commentsStore.deleteComment(props.taskId, comment._id);
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
