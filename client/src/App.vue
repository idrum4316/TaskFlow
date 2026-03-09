<template>
  <NavBar v-if="authStore.isAuthenticated" />
  <main class="min-h-screen">
    <RouterView />
  </main>
</template>

<script setup>
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
useThemeStore(); // initializes dark class on <html>
</script>
