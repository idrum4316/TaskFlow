<template>
  <header class="bg-white border-b border-zinc-200 sticky top-0 z-30">
    <div class="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="flex items-center gap-2 flex-shrink-0 group"
        aria-label="TaskFlow home"
      >
        <AppLogo class="w-6 h-6 text-brand-600 group-hover:text-brand-700 transition-colors" />
        <span class="text-base font-bold tracking-tight text-zinc-900 group-hover:text-brand-700 transition-colors">
          TaskFlow
        </span>
      </RouterLink>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- User avatar + name -->
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="text-xs font-semibold text-brand-700">{{ initials }}</span>
          </div>
          <span class="text-sm font-medium text-zinc-700 hidden sm:block">
            {{ authStore.user?.username }}
          </span>
        </div>

        <div class="w-px h-4 bg-zinc-200" aria-hidden="true" />

        <button
          @click="authStore.logout"
          class="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors px-2 py-1 rounded-md hover:bg-zinc-100"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppLogo from '@/components/AppLogo.vue';

const authStore = useAuthStore();
const initials = computed(() => {
  const name = authStore.user?.username || '';
  return name.slice(0, 2).toUpperCase();
});
</script>
