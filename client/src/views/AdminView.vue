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

    <!-- Email settings card -->
    <section class="mb-10">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Email Settings</h3>
      <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <form @submit.prevent="handleSaveEmail" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="smtp-host">SMTP Host</label>
              <input id="smtp-host" v-model="emailForm.smtp_host" type="text" class="input" placeholder="smtp.example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="smtp-port">SMTP Port</label>
              <input id="smtp-port" v-model="emailForm.smtp_port" type="number" class="input" placeholder="587" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="smtp-user">SMTP Username</label>
              <input id="smtp-user" v-model="emailForm.smtp_user" type="text" class="input" placeholder="user@example.com" autocomplete="off" />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="smtp-pass">SMTP Password</label>
              <input id="smtp-pass" v-model="emailForm.smtp_pass" type="password" class="input" placeholder="••••••••" autocomplete="off" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="email-from">From Address</label>
              <input id="email-from" v-model="emailForm.email_from" type="email" class="input" placeholder="noreply@example.com" />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="emailForm.smtp_secure" type="checkbox" class="w-4 h-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 dark:border-zinc-600 dark:bg-zinc-700" />
                <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Use TLS/SSL</span>
              </label>
            </div>
          </div>

          <div v-if="emailStatus.error" role="alert" class="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800">
            {{ emailStatus.error }}
          </div>
          <div v-if="emailStatus.saved" role="status" class="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2.5 rounded-lg dark:text-green-400 dark:bg-green-950/30 dark:border-green-800">
            Email settings saved
          </div>

          <div class="flex justify-end">
            <button type="submit" :disabled="emailStatus.saving" class="btn-primary">
              {{ emailStatus.saving ? 'Saving…' : 'Save email settings' }}
            </button>
          </div>
        </form>

        <!-- Test email -->
        <div class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-700">
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="test-email-to">Send test email to</label>
              <input id="test-email-to" v-model="testEmailTo" type="email" class="input" placeholder="you@example.com" />
            </div>
            <button @click="handleSendTestEmail" :disabled="emailStatus.testing || !testEmailTo" class="btn-primary flex-shrink-0">
              {{ emailStatus.testing ? 'Sending…' : 'Send test email' }}
            </button>
          </div>
          <div v-if="emailStatus.testError" role="alert" class="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg dark:text-red-400 dark:bg-red-950/30 dark:border-red-800">
            {{ emailStatus.testError }}
          </div>
          <div v-if="emailStatus.testSuccess" role="status" class="mt-3 flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2.5 rounded-lg dark:text-green-400 dark:bg-green-950/30 dark:border-green-800">
            Test email sent successfully!
          </div>
        </div>
      </div>
    </section>

    <!-- Invitation links section -->
    <section class="mb-10">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Invitation Links</h3>
      <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Single-use invite links</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Generate links that allow one person to register, even when registration is disabled
            </p>
          </div>
          <button
            @click="handleCreateInvite"
            :disabled="creatingInvite"
            class="btn-primary text-xs !py-1.5 !px-3"
          >
            {{ creatingInvite ? 'Generating…' : 'Generate link' }}
          </button>
        </div>

        <!-- Copied confirmation -->
        <div
          v-if="copiedToken"
          role="status"
          class="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2.5 rounded-lg dark:text-green-400 dark:bg-green-950/30 dark:border-green-800 mb-4"
        >
          Link copied to clipboard!
        </div>

        <!-- Token list -->
        <div v-if="adminStore.inviteTokens.length > 0" class="divide-y divide-zinc-100 dark:divide-zinc-700">
          <div
            v-for="t in adminStore.inviteTokens"
            :key="t.token"
            class="flex items-center justify-between py-3 gap-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <code class="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">{{ t.token }}</code>
                <span
                  v-if="t.used"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                >
                  Used
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                >
                  Active
                </span>
              </div>
              <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Created {{ formatDate(t.created_at) }}
                <template v-if="t.used_at"> · Used {{ formatDate(t.used_at) }}</template>
              </p>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button
                v-if="!t.used"
                @click="copyInviteLink(t.token)"
                class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
                title="Copy link"
              >
                Copy link
              </button>
              <button
                @click="handleRevokeInvite(t.token)"
                class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-colors"
                title="Revoke"
              >
                {{ t.used ? 'Remove' : 'Revoke' }}
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-zinc-400 dark:text-zinc-500">No invitation links generated yet.</p>
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
const creatingInvite = ref(false);
const copiedToken = ref(false);

const emailForm = reactive({
  smtp_host: '',
  smtp_port: '',
  smtp_secure: false,
  smtp_user: '',
  smtp_pass: '',
  email_from: '',
});
const testEmailTo = ref('');
const emailStatus = reactive({
  saving: false,
  saved: false,
  error: '',
  testing: false,
  testSuccess: false,
  testError: '',
});

const resetModal = reactive({
  open: false,
  user: null,
  password: '',
  loading: false,
  error: '',
  success: false,
});

onMounted(async () => {
  await Promise.all([adminStore.fetchUsers(), adminStore.fetchSettings(), adminStore.fetchInviteTokens(), adminStore.fetchEmailSettings()]);
  Object.assign(emailForm, adminStore.emailSettings);
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
    console.error('Failed to toggle admin:', err);
  }
}

async function handleCreateInvite() {
  creatingInvite.value = true;
  try {
    const { token } = await adminStore.createInviteToken();
    await copyInviteLink(token);
  } finally {
    creatingInvite.value = false;
  }
}

async function copyInviteLink(token) {
  const link = `${window.location.origin}/register?token=${token}`;
  try {
    await navigator.clipboard.writeText(link);
    copiedToken.value = true;
    setTimeout(() => { copiedToken.value = false; }, 3000);
  } catch {
    // Fallback: select the token text for manual copy
  }
}

async function handleRevokeInvite(token) {
  try {
    await adminStore.revokeInviteToken(token);
  } catch (err) {
    console.error('Failed to revoke token:', err);
  }
}

async function handleSaveEmail() {
  emailStatus.saving = true;
  emailStatus.error = '';
  emailStatus.saved = false;
  try {
    const data = await adminStore.updateEmailSettings({ ...emailForm });
    Object.assign(emailForm, data);
    emailStatus.saved = true;
    setTimeout(() => { emailStatus.saved = false; }, 3000);
  } catch (err) {
    emailStatus.error = err.response?.data?.error || 'Failed to save email settings';
  } finally {
    emailStatus.saving = false;
  }
}

async function handleSendTestEmail() {
  emailStatus.testing = true;
  emailStatus.testError = '';
  emailStatus.testSuccess = false;
  try {
    await adminStore.sendTestEmail(testEmailTo.value);
    emailStatus.testSuccess = true;
    setTimeout(() => { emailStatus.testSuccess = false; }, 5000);
  } catch (err) {
    emailStatus.testError = err.response?.data?.error || 'Failed to send test email';
  } finally {
    emailStatus.testing = false;
  }
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
