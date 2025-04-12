import App from '@/App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/horizon'),
  routes: [
    {
      path: "/",
      redirect: '/home/question',
    },
    {
      path: "/home",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { showBanner: true },
      children: [
        {
          path: 'question',
          name: 'question',
          component: () => import('@/views/QuestionView.vue'),
          meta: { showBanner: true }
        },
        {
          path: 'contest',
          name: 'contest',
          component: () => import('@/views/ContestView.vue'),
          meta: { showBanner: true }
        }
      ]
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
    },
  ],
})

export default router
