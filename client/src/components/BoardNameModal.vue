<template>
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Board name</label>
          <input
            ref="inputRef"
            v-model="name"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="e.g. Work, Personal, Q3 Goals"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Board' },
  confirmLabel: { type: String, default: 'Save' },
  initialValue: { type: String, default: '' },
});
const emit = defineEmits(['confirm', 'close']);

const name = ref(props.initialValue);
const inputRef = ref(null);

onMounted(() => inputRef.value?.focus());

function handleSubmit() {
  if (name.value.trim()) emit('confirm', name.value.trim());
}
</script>
