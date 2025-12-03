import { createRouter, createWebHistory } from "vue-router";

// Cau hinh cac duong dan cho ung dung
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
      name: "dashboard-home",
      component: () => import("@/views/Dashboard.vue"),
    },
    {
      path: "/assignment",
      name: "dashboard",
      component: () => import("@/views/AssignmentView.vue"),
    },
    {
      path: "/dictionary",
      name: "dictionary",
      component: () => import("@/views/DictionarySearchView.vue"),
    },
    {
      path: "/writing",
      name: "writing",
      component: () => import("@/views/WritingView.vue"),
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
  // Dat lai vi tri cuon trang khi dieu huong de cac view luon bat dau o dau trang
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
