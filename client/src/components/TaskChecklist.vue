<template>
  <div>
    <!-- Checklist items -->
    <ul v-if="items.length" class="space-y-0.5 mb-3">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="flex items-center gap-2.5 group rounded-lg px-2 py-1.5 -mx-2 transition-colors"
        :class="readOnly ? '' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'"
      >
        <button
          type="button"
          :disabled="readOnly"
          @click="toggleItem(index)"
          :class="[
            'w-[18px] h-[18px] flex-shrink-0 rounded-[5px] border-2 flex items-center justify-center transition-all duration-200',
            item.done
              ? 'bg-brand-500 border-brand-500 text-white scale-100'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-400 dark:hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30',
            readOnly ? 'cursor-default' : 'cursor-pointer',
          ]"
          :aria-label="item.done ? 'Uncheck item' : 'Check item'"
        >
          <svg v-if="item.done" class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
        <span
          v-if="editingIndex !== index"
          @dblclick="!readOnly && startEdit(index)"
          :class="[
            'flex-1 text-sm leading-snug transition-colors duration-200',
            item.done
              ? 'line-through text-zinc-400 dark:text-zinc-500'
              : 'text-zinc-700 dark:text-zinc-300',
          ]"
        >{{ item.text }}</span>
        <input
          v-else
          ref="editInput"
          v-model="editText"
          type="text"
          class="flex-1 text-sm leading-snug py-0.5 px-1.5 -mx-1 bg-white dark:bg-zinc-800 border border-brand-400 dark:border-brand-500 rounded-md outline-none ring-2 ring-brand-500/20 text-zinc-700 dark:text-zinc-300"
          @keydown.enter.prevent="commitEdit(index)"
          @keydown.escape.prevent="cancelEdit"
          @blur="commitEdit(index)"
        />
        <button
          v-if="!readOnly"
          type="button"
          @click="removeItem(index)"
          class="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          aria-label="Remove item"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>

    <!-- Progress bar -->
    <div v-if="items.length > 1" class="flex items-center gap-2.5 mb-3">
      <div class="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-700/80 rounded-full overflow-hidden">
        <div
          :class="[
            'h-full rounded-full transition-all duration-500 ease-out',
            progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500',
          ]"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
      <span
        :class="[
          'text-[11px] font-medium tabular-nums transition-colors',
          progressPercent === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500',
        ]"
      >
        {{ doneCount }}/{{ items.length }}
      </span>
    </div>

    <!-- Add item input -->
    <div v-if="!readOnly" class="flex items-center gap-2">
      <input
        v-model="newItemText"
        type="text"
        class="flex-1 text-sm px-2.5 py-1.5 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-brand-400 dark:focus:border-brand-400 focus:outline-none transition-colors"
        placeholder="Add an item…"
        @keydown.enter.prevent="addItem"
      />
      <button
        type="button"
        :disabled="!newItemText.trim()"
        @click="addItem"
        class="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:text-zinc-300 dark:disabled:text-zinc-600 px-2 py-1.5 transition-colors"
      >
        Add
      </button>
    </div>

    <p v-if="!items.length && readOnly" class="text-xs text-zinc-400 dark:text-zinc-500">No checklist items.</p>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  readOnly: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const items = computed(() => props.modelValue || []);
const doneCount = computed(() => items.value.filter((i) => i.done).length);
const progressPercent = computed(() =>
  items.value.length ? Math.round((doneCount.value / items.value.length) * 100) : 0
);

const newItemText = ref('');
const editingIndex = ref(-1);
const editText = ref('');
const editInput = ref(null);

function emitUpdate(newItems) {
  emit('update:modelValue', [...newItems]);
}

function addItem() {
  if (!newItemText.value.trim()) return;
  const updated = [
    ...items.value,
    { id: crypto.randomUUID(), text: newItemText.value.trim(), done: false },
  ];
  emitUpdate(updated);
  newItemText.value = '';
}

function toggleItem(index) {
  if (props.readOnly) return;
  const updated = items.value.map((item, i) =>
    i === index ? { ...item, done: !item.done } : item
  );
  emitUpdate(updated);
}

function removeItem(index) {
  const updated = items.value.filter((_, i) => i !== index);
  emitUpdate(updated);
}

function startEdit(index) {
  editingIndex.value = index;
  editText.value = items.value[index].text;
  nextTick(() => {
    const el = editInput.value;
    if (Array.isArray(el)) el[0]?.focus();
    else el?.focus();
  });
}

function commitEdit(index) {
  if (editingIndex.value !== index) return;
  const text = editText.value.trim();
  if (text && text !== items.value[index].text) {
    const updated = items.value.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    emitUpdate(updated);
  }
  editingIndex.value = -1;
  editText.value = '';
}

function cancelEdit() {
  editingIndex.value = -1;
  editText.value = '';
}
</script>
