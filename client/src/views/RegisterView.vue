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
          Get started<br />in seconds.
        </h2>
        <p class="text-brand-200 text-lg leading-relaxed max-w-xs">
          Free forever. No credit card needed. Your boards are ready the moment you sign up.
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
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create your account</h1>
          <p class="mt-1 text-zinc-500 dark:text-zinc-400 text-sm">Start organizing your work today</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="username">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              class="input"
              placeholder="johndoe"
              :aria-invalid="!!errorMsg"
            />
          </div>

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
              autocomplete="new-password"
              minlength="8"
              class="input"
              placeholder="Min. 8 characters"
              aria-describedby="register-error"
            />
          </div>

          <div
            v-if="errorMsg"
            id="register-error"
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
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?
          <RouterLink to="/login" class="text-brand-600 hover:text-brand-700 font-semibold underline-offset-2 hover:underline">
            Sign in
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppLogo from '@/components/AppLogo.vue';

const authStore = useAuthStore();
const username = ref('');
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);
const year = computed(() => new Date().getFullYear());

async function handleSubmit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    await authStore.register(username.value, email.value, password.value);
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
