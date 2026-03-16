<template>
  <div
    class="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="session-expired-title"
  >
    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-modal w-full max-w-sm animate-scale-in">
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
        <h2 id="session-expired-title" class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Session expired
        </h2>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your session has expired. Sign in again to continue where you left off.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="session-email">
            Email address
          </label>
          <input
            id="session-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="session-password">
            Password
          </label>
          <input
            id="session-password"
            ref="passwordRef"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="input"
            placeholder="••••••••"
          />
        </div>

        <!-- MFA step -->
        <div v-if="mfaPending">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="session-mfa">
            Authentication code
          </label>
          <input
            id="session-mfa"
            ref="mfaRef"
            v-model="mfaCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            required
            class="input text-center tracking-widest font-mono text-lg"
            placeholder="000000"
          />
        </div>

        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
        >
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          {{ errorMsg }}
        </div>

        <div class="flex justify-end gap-3 pt-1">
          <button type="button" @click="handleLogout" class="btn-secondary">
            Log out
          </button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import api, { sessionExpired } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const email = ref(authStore.user?.email || '');
const password = ref('');
const mfaCode = ref('');
const mfaPending = ref(false);
const mfaToken = ref(null);
const errorMsg = ref('');
const loading = ref(false);
const passwordRef = ref(null);
const mfaRef = ref(null);

onMounted(() => {
  if (email.value) {
    passwordRef.value?.focus();
  }
});

async function handleSubmit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    if (mfaPending.value) {
      const { data } = await api.post('/auth/mfa-verify', {
        mfa_token: mfaToken.value,
        code: mfaCode.value,
      });
      authStore.setSession(data);
      sessionExpired.value = false;
    } else {
      const { data } = await api.post('/auth/login', { email: email.value, password: password.value });
      if (data.mfa_required) {
        mfaPending.value = true;
        mfaToken.value = data.mfa_token;
        await nextTick();
        mfaRef.value?.focus();
        return;
      }
      authStore.setSession(data);
      sessionExpired.value = false;
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}

function handleLogout() {
  sessionExpired.value = false;
  authStore.logout();
}
</script>
