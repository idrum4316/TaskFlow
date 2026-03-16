<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" @click="cancel" aria-hidden="true" />
      <div class="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-5 w-full max-w-sm mx-4">
        <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ title }}</h3>
        <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <slot>{{ message }}</slot>
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            @click="confirm"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Delete' },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

function cancel() {
  emit('update:modelValue', false);
}

function confirm() {
  emit('update:modelValue', false);
  emit('confirm');
}
</script>
