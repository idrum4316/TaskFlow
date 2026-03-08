<template>
  <ul class="space-y-3">
    <TaskItem
      v-for="task in tasks"
      :key="task._id"
      :task="task"
      @edit="$emit('edit', task)"
      @delete="$emit('delete', task._id)"
    />
  </ul>
</template>

<script setup>
import TaskItem from './TaskItem.vue';

defineProps({ tasks: { type: Array, required: true } });
defineEmits(['edit', 'delete']);
</script>
