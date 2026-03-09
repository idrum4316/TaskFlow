<template>
  <div class="min-h-screen flex">
    <!-- Left panel: branding -->
    <div
      class="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-900 text-white relative overflow-hidden"
    >
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div class="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div class="relative flex items-center gap-2.5">
        <AppLogo class="w-8 h-8 text-brand-300" />
        <span class="text-xl font-bold tracking-tight">TaskFlow</span>
      </div>

      <div class="relative space-y-5">
        <h2 class="text-4xl font-bold leading-tight tracking-tight">
          Organize your work,<br />ship what matters.
        </h2>
        <p class="text-brand-200 text-lg leading-relaxed max-w-xs">
          Kanban boards, lists, and calendars — everything your team needs.
        </p>
      </div>

      <p class="relative text-brand-400 text-sm">© {{ year }} TaskFlow</p>
    </div>

    <!-- Right panel: form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-900">
      <div class="w-full max-w-sm animate-slide-up">
        <!-- Mobile logo -->
        <div class="flex items-center gap-2 mb-10 lg:hidden">
          <AppLogo class="w-7 h-7 text-brand-600" />
          <span class="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">TaskFlow</span>
        </div>

        <div class="mb-8">
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Welcome back</h1>
          <p class="mt-1 text-zinc-500 dark:text-zinc-400 text-sm">Sign in to your account to continue</p>
        </div>

        <!-- MFA Challenge Step -->
        <template v-if="authStore.mfaChallenge">
          <div class="space-y-4">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Two-factor authentication</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">Enter the code from your authenticator app</p>
              </div>
            </div>

            <form @submit.prevent="handleMfaSubmit" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="mfa-code">
                  Authentication code
                </label>
                <input
                  id="mfa-code"
                  v-model="mfaCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  required
                  class="input text-center tracking-widest font-mono text-lg"
                  placeholder="000000"
                  autofocus
                />
              </div>

              <div
                v-if="mfaError"
                role="alert"
                class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
              >
                {{ mfaError }}
              </div>

              <button type="submit" :disabled="mfaLoading" class="btn-primary w-full">
                <svg v-if="mfaLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ mfaLoading ? 'Verifying…' : 'Verify' }}
              </button>
            </form>

            <button
              @click="authStore.cancelMfa(); mfaCode = ''; mfaError = '';"
              class="w-full text-center text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </template>

        <!-- Normal Login Form -->
        <template v-else>
        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="email">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="input"
              placeholder="you@example.com"
              :aria-invalid="!!errorMsg"
              aria-describedby="login-error"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="password">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="input"
              placeholder="••••••••"
            />
          </div>

          <div
            v-if="errorMsg"
            id="login-error"
            role="alert"
            class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg"
          >
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
            {{ errorMsg }}
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p v-if="registrationEnabled" class="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?
          <RouterLink to="/register" class="text-brand-600 hover:text-brand-700 font-semibold underline-offset-2 hover:underline">
            Create one free
          </RouterLink>
        </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/client';
import AppLogo from '@/components/AppLogo.vue';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);
const registrationEnabled = ref(true);
const year = computed(() => new Date().getFullYear());

// MFA
const mfaCode = ref('');
const mfaError = ref('');
const mfaLoading = ref(false);

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/registration-status');
    registrationEnabled.value = data.registration_enabled;
  } catch {
    registrationEnabled.value = true;
  }
});

async function handleSubmit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    const result = await authStore.login(email.value, password.value);
    // If MFA is required, the store already set mfaChallenge — template will switch
    if (result?.mfa_required) {
      // Stay on page, MFA form will appear
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function handleMfaSubmit() {
  mfaError.value = '';
  mfaLoading.value = true;
  try {
    await authStore.verifyMfa(mfaCode.value);
  } catch (err) {
    mfaError.value = err.response?.data?.error || 'Invalid code. Please try again.';
  } finally {
    mfaLoading.value = false;
  }
}
</script>
