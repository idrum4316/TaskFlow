<template>
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
      <RouterLink to="/" class="text-lg font-bold text-gray-900 tracking-tight">TaskFlow</RouterLink>

      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600 hidden sm:block">{{ authStore.user?.username }}</span>
        <button
          @click="authStore.logout"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
