import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const preference = ref(localStorage.getItem('theme') ?? 'system');

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const systemDark = ref(mq.matches);
  mq.addEventListener('change', (e) => { systemDark.value = e.matches; });

  const isDark = computed(() => {
    if (preference.value === 'dark') return true;
    if (preference.value === 'light') return false;
    return systemDark.value;
  });

  watch([preference, systemDark], () => {
    document.documentElement.classList.toggle('dark', isDark.value);
  }, { immediate: true });

  function cycle() {
    const next = { system: 'light', light: 'dark', dark: 'system' };
    preference.value = next[preference.value];
    localStorage.setItem('theme', preference.value);
  }

  return { preference, isDark, cycle };
});
