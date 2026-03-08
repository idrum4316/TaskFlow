<template>
  <div
    class="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    @click.self="$emit('close')"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="modalTitleId"
  >
    <div class="bg-white rounded-2xl shadow-modal w-full max-w-sm animate-scale-in">
      <div class="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
        <h2 :id="modalTitleId" class="text-base font-semibold text-zinc-900">{{ title }}</h2>
        <button
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5" for="board-name-input">
            Board name
          </label>
          <input
            id="board-name-input"
            ref="inputRef"
            v-model="name"
            type="text"
            required
            class="input"
            placeholder="e.g. Work, Personal, Q3 Goals"
          />
        </div>

        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ confirmLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Board' },
  confirmLabel: { type: String, default: 'Save' },
  initialValue: { type: String, default: '' },
});
const emit = defineEmits(['confirm', 'close']);

const name = ref(props.initialValue);
const inputRef = ref(null);
const modalTitleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 7)}`);

onMounted(() => inputRef.value?.focus());

function handleSubmit() {
  if (name.value.trim()) emit('confirm', name.value.trim());
}
</script>
