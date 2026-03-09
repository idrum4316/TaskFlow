<template>
  <header class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-30">
    <div class="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="flex items-center gap-2 flex-shrink-0 group"
        aria-label="TaskFlow home"
      >
        <AppLogo class="w-6 h-6 text-brand-600 group-hover:text-brand-700 transition-colors" />
        <span class="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-brand-700 transition-colors">
          TaskFlow
        </span>
      </RouterLink>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- User avatar + name -->
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="text-xs font-semibold text-brand-700 dark:text-brand-300">{{ initials }}</span>
          </div>
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block">
            {{ authStore.user?.username }}
          </span>
        </div>

        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />

        <!-- Theme toggle -->
        <button
          @click="themeStore.cycle()"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          :aria-label="`Theme: ${themeStore.preference}. Click to cycle.`"
        >
          <!-- Sun: light mode active -->
          <svg v-if="themeStore.preference === 'light'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <!-- Moon: dark mode active -->
          <svg v-else-if="themeStore.preference === 'dark'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
          <!-- Monitor: system mode active -->
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
          </svg>
        </button>

        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />

        <button
          @click="authStore.logout"
          class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
import { useThemeStore } from '@/stores/theme';
import AppLogo from '@/components/AppLogo.vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const initials = computed(() => {
  const name = authStore.user?.username || '';
  return name.slice(0, 2).toUpperCase();
});
</script>
