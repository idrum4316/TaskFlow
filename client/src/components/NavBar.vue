<template>
  <header class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-30">
    <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
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

      <!-- Desktop right side (md+) -->
      <div class="hidden md:flex items-center gap-3">
        <!-- Search trigger -->
        <button
          @click="searchStore.toggleOpen()"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Search"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />

        <!-- User avatar + name -->
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="text-xs font-semibold text-brand-700 dark:text-brand-300">{{ initials }}</span>
          </div>
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {{ authStore.user?.username }}
          </span>
        </div>

        <!-- Admin link -->
        <RouterLink
          v-if="authStore.isAdmin"
          to="/admin"
          class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Admin
        </RouterLink>

        <!-- Settings link -->
        <RouterLink
          to="/settings"
          class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Settings
        </RouterLink>

        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />

        <!-- Theme toggle -->
        <button
          @click="themeStore.cycle()"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          :aria-label="`Theme: ${themeStore.preference}. Click to cycle.`"
        >
          <svg v-if="themeStore.preference === 'light'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <svg v-else-if="themeStore.preference === 'dark'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
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

      <!-- Mobile right side (< md) -->
      <div class="flex md:hidden items-center gap-2">
        <!-- Theme toggle (always visible) -->
        <button
          @click="themeStore.cycle()"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          :aria-label="`Theme: ${themeStore.preference}. Click to cycle.`"
        >
          <svg v-if="themeStore.preference === 'light'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <svg v-else-if="themeStore.preference === 'dark'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
          </svg>
        </button>

        <!-- Hamburger menu button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle menu"
        >
          <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 animate-slide-up"
    >
      <div class="px-4 py-3 space-y-1">
        <!-- User info -->
        <div class="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div
            class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="text-xs font-semibold text-brand-700 dark:text-brand-300">{{ initials }}</span>
          </div>
          <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {{ authStore.user?.username }}
          </span>
        </div>

        <button
          @click="searchStore.toggleOpen(); mobileMenuOpen = false"
          class="flex items-center gap-2.5 w-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Search
        </button>

        <RouterLink
          v-if="authStore.isAdmin"
          to="/admin"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Admin
        </RouterLink>

        <RouterLink
          to="/settings"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </RouterLink>

        <div class="h-px bg-zinc-200 dark:bg-zinc-700 my-1" aria-hidden="true" />

        <button
          @click="authStore.logout"
          class="flex items-center gap-2.5 w-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 font-medium px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </div>

    <GlobalSearch />
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useSearchStore } from '@/stores/search';
import AppLogo from '@/components/AppLogo.vue';
import GlobalSearch from '@/components/GlobalSearch.vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const searchStore = useSearchStore();
const route = useRoute();
const mobileMenuOpen = ref(false);
const initials = computed(() => {
  const name = authStore.user?.username || '';
  return name.slice(0, 2).toUpperCase();
});

// Close mobile menu on route change
watch(() => route.path, () => { mobileMenuOpen.value = false; });
</script>
