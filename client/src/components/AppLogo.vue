<template>
  <!-- Checkmark-in-box task icon -->
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="$attrs.class"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" opacity="0.15" />
    <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" stroke-width="2.5" />
    <path d="M9 16.5L13.5 21L23 11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup>
defineOptions({ inheritAttrs: false });
</script>
