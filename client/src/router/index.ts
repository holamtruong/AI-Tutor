import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "onboarding",
      component: () => import("@/views/OnboardingView.vue"),
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
    },
    {
      path: "/dictionary",
      name: "dictionary",
      component: () => import("@/views/DictionarySearchView.vue"),
    },
    {
      path: "/dictionary/result",
      name: "dictionary-result",
      component: () => import("@/views/DictionaryResultView.vue"),
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("@/views/ChatView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
