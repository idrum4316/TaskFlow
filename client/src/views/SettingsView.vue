<template>
  <div class="max-w-screen-xl mx-auto px-6 py-10">
    <!-- Page header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h2>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your password, security, and accessibility settings</p>
    </div>

    <div class="space-y-8 max-w-xl">
      <!-- Accessibility -->
      <section>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Accessibility</h3>
        <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p id="thick-scrollbars-label" class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Thick scrollbars</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">Make scrollbars twice as wide for easier grabbing</p>
            </div>
            <button
              @click="toggleThickScrollbars"
              :disabled="a11yLoading"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
              :class="accountStore.preferences?.thick_scrollbars ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'"
              :aria-checked="accountStore.preferences?.thick_scrollbars"
              aria-labelledby="thick-scrollbars-label"
              role="switch"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="accountStore.preferences?.thick_scrollbars ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          <div
            v-if="a11yError"
            role="alert"
            class="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
          >
            {{ a11yError }}
          </div>
        </div>
      </section>

      <!-- Change Password -->
      <section>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Change password</h3>
        <form
          @submit.prevent="handleChangePassword"
          class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="current-pw">
              Current password
            </label>
            <input
              id="current-pw"
              v-model="pw.current"
              type="password"
              required
              autocomplete="current-password"
              class="input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-pw">
              New password
            </label>
            <input
              id="new-pw"
              v-model="pw.next"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="input"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="confirm-pw">
              Confirm new password
            </label>
            <input
              id="confirm-pw"
              v-model="pw.confirm"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="input"
              placeholder="Re-enter new password"
            />
          </div>

          <div
            v-if="pw.error"
            role="alert"
            class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
          >
            {{ pw.error }}
          </div>
          <div
            v-if="pw.success"
            role="status"
            class="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2.5 rounded-lg dark:text-green-400 dark:bg-green-950/30 dark:border-green-800"
          >
            Password changed successfully
          </div>

          <div class="flex justify-end">
            <button type="submit" :disabled="pw.loading" class="btn-primary">
              {{ pw.loading ? 'Saving…' : 'Update password' }}
            </button>
          </div>
        </form>
      </section>

      <!-- MFA Section -->
      <section>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Two-factor authentication (2FA)
        </h3>

        <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
          <!-- Loading state -->
          <div v-if="mfaLoading" class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>

          <!-- MFA Enabled: show status + disable -->
          <template v-else-if="accountStore.mfaEnabled && !mfaSetupActive">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">2FA is enabled</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">Your account is protected with an authenticator app</p>
                </div>
              </div>
              <button
                @click="disableStep = 'confirm'"
                class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-colors"
              >
                Disable 2FA
              </button>
            </div>

            <!-- Disable confirmation -->
            <div v-if="disableStep === 'confirm'" class="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 space-y-3">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Enter a code from your authenticator app to disable 2FA:
              </p>
              <div class="flex gap-2">
                <input
                  v-model="disableCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  class="input w-32 text-center tracking-widest font-mono"
                  placeholder="000000"
                  @keyup.enter="handleDisableMfa"
                />
                <button
                  @click="handleDisableMfa"
                  :disabled="disableLoading"
                  class="btn-primary"
                >
                  {{ disableLoading ? 'Disabling…' : 'Confirm' }}
                </button>
                <button
                  @click="disableStep = null; disableCode = ''; disableError = ''"
                  class="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div
                v-if="disableError"
                role="alert"
                class="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
              >
                {{ disableError }}
              </div>
            </div>
          </template>

          <!-- MFA Not Enabled: show setup flow -->
          <template v-else-if="!mfaSetupActive">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                  <svg class="w-5 h-5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">2FA is not enabled</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">Add an extra layer of security to your account</p>
                </div>
              </div>
              <button
                @click="handleStartSetup"
                :disabled="setupLoading"
                class="btn-primary"
              >
                {{ setupLoading ? 'Setting up…' : 'Enable 2FA' }}
              </button>
            </div>
          </template>

          <!-- MFA Setup Flow -->
          <template v-if="mfaSetupActive">
            <div class="space-y-5">
              <div>
                <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Step 1: Scan QR code</h4>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
                </p>
                <div class="flex flex-col items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <img
                    :src="accountStore.mfaSetup?.qr"
                    alt="MFA QR Code"
                    class="w-48 h-48"
                  />
                  <div class="text-center">
                    <p class="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                      Or enter this key manually:
                    </p>
                    <code class="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded select-all break-all">
                      {{ accountStore.mfaSetup?.secret }}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Step 2: Enter verification code</h4>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Enter the 6-digit code from your authenticator app to confirm setup:
                </p>
                <div class="flex gap-2">
                  <input
                    v-model="setupCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    class="input w-32 text-center tracking-widest font-mono"
                    placeholder="000000"
                    @keyup.enter="handleVerifySetup"
                  />
                  <button
                    @click="handleVerifySetup"
                    :disabled="verifyLoading"
                    class="btn-primary"
                  >
                    {{ verifyLoading ? 'Verifying…' : 'Verify & enable' }}
                  </button>
                  <button
                    @click="cancelSetup"
                    class="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div
                v-if="setupError"
                role="alert"
                class="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
              >
                {{ setupError }}
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAccountStore } from '@/stores/account';

const accountStore = useAccountStore();

// --- Accessibility ---
const a11yLoading = ref(false);
const a11yError = ref('');

onMounted(async () => {
  try {
    await accountStore.fetchPreferences();
  } catch {
    // ignore
  }
  try {
    await accountStore.fetchMfaStatus();
  } finally {
    mfaLoading.value = false;
  }
});

async function toggleThickScrollbars() {
  a11yError.value = '';
  a11yLoading.value = true;
  try {
    const next = !accountStore.preferences?.thick_scrollbars;
    await accountStore.updatePreferences({ thick_scrollbars: next });
  } catch (err) {
    a11yError.value = err.response?.data?.error || 'Failed to save preference';
  } finally {
    a11yLoading.value = false;
  }
}

// --- Password ---
const pw = ref({
  current: '',
  next: '',
  confirm: '',
  loading: false,
  error: '',
  success: false,
});

async function handleChangePassword() {
  pw.value.error = '';
  pw.value.success = false;

  if (pw.value.next !== pw.value.confirm) {
    pw.value.error = 'New passwords do not match';
    return;
  }

  pw.value.loading = true;
  try {
    await accountStore.changePassword(pw.value.current, pw.value.next);
    pw.value.success = true;
    pw.value.current = '';
    pw.value.next = '';
    pw.value.confirm = '';
  } catch (err) {
    pw.value.error = err.response?.data?.error || 'Failed to change password';
  } finally {
    pw.value.loading = false;
  }
}

// --- MFA ---
const mfaLoading = ref(true);
const mfaSetupActive = ref(false);
const setupLoading = ref(false);
const setupCode = ref('');
const setupError = ref('');
const verifyLoading = ref(false);

const disableStep = ref(null);
const disableCode = ref('');
const disableError = ref('');
const disableLoading = ref(false);

async function handleStartSetup() {
  setupLoading.value = true;
  setupError.value = '';
  try {
    await accountStore.startMfaSetup();
    mfaSetupActive.value = true;
  } catch (err) {
    setupError.value = err.response?.data?.error || 'Failed to start MFA setup';
  } finally {
    setupLoading.value = false;
  }
}

async function handleVerifySetup() {
  setupError.value = '';
  verifyLoading.value = true;
  try {
    await accountStore.verifyMfaSetup(setupCode.value);
    mfaSetupActive.value = false;
    setupCode.value = '';
  } catch (err) {
    setupError.value = err.response?.data?.error || 'Invalid code. Please try again.';
  } finally {
    verifyLoading.value = false;
  }
}

function cancelSetup() {
  mfaSetupActive.value = false;
  setupCode.value = '';
  setupError.value = '';
  accountStore.mfaSetup = null;
}

async function handleDisableMfa() {
  disableError.value = '';
  disableLoading.value = true;
  try {
    await accountStore.disableMfa(disableCode.value);
    disableStep.value = null;
    disableCode.value = '';
  } catch (err) {
    disableError.value = err.response?.data?.error || 'Invalid code. Please try again.';
  } finally {
    disableLoading.value = false;
  }
}
</script>
