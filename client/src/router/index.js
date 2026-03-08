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
    name: 'kanban',
    component: () => import('@/views/KanbanView.vue'),
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
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'boards' };
  }
});

export default router;
