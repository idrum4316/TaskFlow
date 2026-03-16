<template>
  <div class="flex flex-col h-screen">
    <NavBar v-if="authStore.isAuthenticated" />
    <main class="flex-1 min-h-0">
      <RouterView />
    </main>
    <SessionExpiredModal v-if="sessionExpired" />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import SessionExpiredModal from '@/components/SessionExpiredModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { sessionExpired } from '@/api/client';

const authStore = useAuthStore();
useThemeStore(); // initializes dark class on <html>
</script>
