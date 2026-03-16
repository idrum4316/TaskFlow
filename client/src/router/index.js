import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    name: 'boards',
    component: () => import('@/views/BoardsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/boards/:id',
    name: 'board',
    component: () => import('@/views/BoardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'boards' };
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'boards' };
  }
});

// After a new deployment, old lazy-loaded chunk files no longer exist on the
// server.  The catch-all returns index.html (text/html) instead, which the
// browser rejects as a non-JS MIME type.  Detect this and do a full reload so
// the browser fetches the updated index.html with the correct asset references.
router.onError((error, to) => {
  if (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  ) {
    window.location.assign(to.fullPath);
  }
});

export default router;
