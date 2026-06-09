import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/store";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    component: () => import("@/views/Layout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
      },
      {
        path: "wedding",
        name: "Wedding",
        component: () => import("@/views/Wedding.vue"),
      },
      {
        path: "checklist",
        name: "Checklist",
        component: () => import("@/views/Checklist.vue"),
      },
      {
        path: "my-tasks",
        name: "MyTasks",
        component: () => import("@/views/MyTasks.vue"),
      },
      {
        path: "vendors",
        name: "Vendors",
        component: () => import("@/views/Vendors.vue"),
      },
      {
        path: "budget",
        name: "Budget",
        component: () => import("@/views/Budget.vue"),
      },
      {
        path: "stats",
        name: "Stats",
        component: () => import("@/views/Stats.vue"),
      },
      {
        path: "schedule",
        name: "Schedule",
        component: () => import("@/views/Schedule.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else if (to.path === "/login" && authStore.isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
