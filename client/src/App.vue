<template>
  <div class="flex flex-col h-screen">
    <NavBar v-if="authStore.isAuthenticated" />
    <main class="flex-1 min-h-0 flex flex-col">
      <RouterView />
    </main>
    <SessionExpiredModal v-if="sessionExpired" />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { watch, onMounted } from 'vue';
import NavBar from '@/components/NavBar.vue';
import SessionExpiredModal from '@/components/SessionExpiredModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useAccountStore } from '@/stores/account';
import { useThemeStore } from '@/stores/theme';
import { sessionExpired } from '@/api/client';

const authStore = useAuthStore();
const accountStore = useAccountStore();
useThemeStore(); // initializes dark class on <html>

function applyScrollbarClass() {
  const enabled = authStore.isAuthenticated && !!accountStore.preferences?.thick_scrollbars;
  document.documentElement.classList.toggle('thick-scrollbars', enabled);
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await accountStore.fetchPreferences();
    } catch {
      accountStore.preferences = {};
    }
  }
  applyScrollbarClass();
});

watch(() => accountStore.preferences?.thick_scrollbars, applyScrollbarClass);
watch(() => authStore.isAuthenticated, async (val) => {
  if (!val) {
    accountStore.preferences = {};
    applyScrollbarClass();
    return;
  }

  try {
    await accountStore.fetchPreferences();
  } catch {
    accountStore.preferences = {};
  }
  applyScrollbarClass();
});
</script>
