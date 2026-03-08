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

const authStore = useAuthStore();
</script>
