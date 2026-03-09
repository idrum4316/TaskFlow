<template>
  <div class="max-w-screen-xl mx-auto px-6 py-10">
    <!-- Page header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h2>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage users and application settings</p>
    </div>

    <!-- Settings card -->
    <section class="mb-10">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Settings</h3>
      <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Allow registration</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              When disabled, only admins can create new users
            </p>
          </div>
          <button
            @click="toggleRegistration"
            :disabled="settingsLoading"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            :class="adminStore.settings.registration_enabled ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'"
            role="switch"
            :aria-checked="adminStore.settings.registration_enabled"
            aria-label="Toggle registration"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="adminStore.settings.registration_enabled ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </section>

    <!-- Users section -->
    <section>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Users
        <span class="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
          ({{ adminStore.users.length }})
        </span>
      </h3>

      <!-- Loading -->
      <div v-if="adminStore.loading" class="space-y-3" aria-busy="true">
        <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-zinc-200/60 dark:bg-zinc-700/60 animate-pulse" />
      </div>

      <!-- User list -->
      <div v-else class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-700 overflow-hidden">
        <div
          v-for="u in adminStore.users"
          :key="u._id"
          class="flex items-center justify-between px-5 py-4 gap-4"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="u.is_admin
                ? 'bg-amber-100 dark:bg-amber-900/40'
                : 'bg-brand-100 dark:bg-brand-900/50'"
            >
              <span
                class="text-xs font-semibold"
                :class="u.is_admin
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-brand-700 dark:text-brand-300'"
              >
                {{ (u.username || '').slice(0, 2).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {{ u.username }}
                </p>
                <span
                  v-if="u.is_admin"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  Admin
                </span>
                <span
                  v-if="u._id === authStore.user?.id"
                  class="text-[10px] text-zinc-400 dark:text-zinc-500"
                >
                  (you)
                </span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate">{{ u.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Toggle admin -->
            <button
              v-if="u._id !== authStore.user?.id"
              @click="handleToggleAdmin(u)"
              class="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              :class="u.is_admin
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-900/50'
                : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600'"
            >
              {{ u.is_admin ? 'Remove admin' : 'Make admin' }}
            </button>

            <!-- Reset password -->
            <button
              @click="openResetModal(u)"
              class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
            >
              Reset password
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Reset password modal -->
    <Teleport to="body">
      <div
        v-if="resetModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        @mousedown.self="resetModal.open = false"
      >
        <div class="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div
          class="relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
        >
          <h3 id="reset-title" class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Reset password
          </h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Set a new password for <span class="font-medium text-zinc-700 dark:text-zinc-300">{{ resetModal.user?.username }}</span>
          </p>

          <form @submit.prevent="handleResetPassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-password">
                New password
              </label>
              <input
                id="new-password"
                v-model="resetModal.password"
                type="password"
                required
                minlength="8"
                class="input"
                placeholder="Min. 8 characters"
                autocomplete="new-password"
              />
            </div>

            <div
              v-if="resetModal.error"
              role="alert"
              class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
            >
              {{ resetModal.error }}
            </div>

            <div
              v-if="resetModal.success"
              role="status"
              class="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2.5 rounded-lg dark:text-green-400 dark:bg-green-950/30 dark:border-green-800"
            >
              Password reset successfully
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                @click="resetModal.open = false"
                class="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {{ resetModal.success ? 'Close' : 'Cancel' }}
              </button>
              <button
                v-if="!resetModal.success"
                type="submit"
                :disabled="resetModal.loading"
                class="btn-primary"
              >
                {{ resetModal.loading ? 'Resetting…' : 'Reset password' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsLoading = ref(false);

const resetModal = reactive({
  open: false,
  user: null,
  password: '',
  loading: false,
  error: '',
  success: false,
});

onMounted(async () => {
  await Promise.all([adminStore.fetchUsers(), adminStore.fetchSettings()]);
});

async function toggleRegistration() {
  settingsLoading.value = true;
  try {
    await adminStore.updateSettings({
      registration_enabled: !adminStore.settings.registration_enabled,
    });
  } finally {
    settingsLoading.value = false;
  }
}

async function handleToggleAdmin(user) {
  try {
    await adminStore.toggleAdmin(user._id);
  } catch (err) {
    // Silently handle — could add toast later
    console.error('Failed to toggle admin:', err);
  }
}

function openResetModal(user) {
  resetModal.open = true;
  resetModal.user = user;
  resetModal.password = '';
  resetModal.error = '';
  resetModal.success = false;
  resetModal.loading = false;
}

async function handleResetPassword() {
  resetModal.error = '';
  resetModal.loading = true;
  try {
    await adminStore.resetPassword(resetModal.user._id, resetModal.password);
    resetModal.success = true;
  } catch (err) {
    resetModal.error = err.response?.data?.error || 'Failed to reset password';
  } finally {
    resetModal.loading = false;
  }
}
</script>
