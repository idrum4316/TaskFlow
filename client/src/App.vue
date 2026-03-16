<template>
  <div class="flex flex-col h-screen">
    <NavBar v-if="authStore.isAuthenticated" />
    <main class="flex-1 min-h-0">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
useThemeStore(); // initializes dark class on <html>
</script>
