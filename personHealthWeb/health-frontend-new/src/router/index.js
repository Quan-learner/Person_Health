import { createRouter, createWebHistory } from "vue-router";
// 1. 确保引入的 Store 名称正确 (假设你叫 user.js)
import { useUserStore } from "@/stores/user.js";

const routes = [
  { path: "/login", component: () => import("@/views/auth/Login.vue"), meta: { title: "登录" } },
  { path: "/", redirect: "/login" },

  // 管理员模块（建议使用嵌套路由，以便统一使用 AdminLayout）
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"), // 统一的侧边栏布局
    redirect: "/admin/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/admin/AdminDashboard.vue"),
        meta: { requiresAuth: true, role: "admin", title: "数据中心" },
      },
      {
        path: "users",
        component: () => import("@/views/admin/UserManager.vue"),
        meta: { requiresAuth: true, role: "admin", title: "用户管理" },
      },
      {
        path: "articles",
        component: () => import("@/views/admin/HealthInfoManager.vue"),
        meta: { requiresAuth: true, role: "admin", title: "健康资讯管理" },
      },
      {
        path: "models",
        component: () => import("@/views/admin/HealthModelManager.vue"),
        meta: { requiresAuth: true, role: "admin", title: "健康模型管理" },
      },
      {
        path: "comments",
        component: () => import("@/views/admin/CommentManager.vue"),
        meta: { requiresAuth: true, role: "admin", title: "评论管理" },
      },
      {
        path: "recipes",
        component: () => import("@/views/admin/RecipeManager.vue"),
        meta: { requiresAuth: true, role: "admin", title: "食谱管理" },
      },
      {
        path: "diet",
        component: () => import("@/views/admin/AdminPlaceholder.vue"),
        meta: { requiresAuth: true, role: "admin", title: "未分配管理" },
      },
    ],
  },

  // 普通用户模块
  {
    path: "/user",
    component: () => import("@/layouts/UserLayout.vue"), // 统一的顶部导航布局
    children: [
      {
        path: "home",
        component: () => import("@/views/user/UserHome.vue"),
        meta: { requiresAuth: true, role: "user", title: "首页" },
      },
      {
        path: "recipes",
        component: () => import("@/views/user/UserRecipes.vue"),
        meta: { requiresAuth: true, role: "user", title: "健康食谱" },
      },
      {
        path: "diet",
        component: () => import("@/views/user/UserDietRecord.vue"),
        meta: { requiresAuth: true, role: "user", title: "饮食记录" },
      },
      {
        path: "data",
        component: () => import("@/views/user/UserData.vue"),
        meta: { requiresAuth: true, role: "user", title: "数据统计" },
      },
      {
        path: "article/:id",
        component: () => import("@/views/user/UserArticleDetail.vue"),
        meta: { requiresAuth: true, role: "user", title: "资讯详情" },
      },
      {
        path: "recipe/:id",
        component: () => import("@/views/user/RecipeDetail.vue"),
        meta: { requiresAuth: true, role: "user", title: "食谱详情" },
      },
      {
        path: "records",
        component: () => import("@/views/user/UserHealthRecords.vue"),
        meta: { requiresAuth: true, role: "user", title: "健康档案" },
      },
      {
        path: "favorites",
        component: () => import("@/views/user/UserCollections.vue"),
        meta: { requiresAuth: true, role: "user", title: "我的收藏" },
      },
      {
        path: "my-articles",
        component: () => import("@/views/user/MyArticles.vue"),
        meta: { requiresAuth: true, role: "user", title: "我的动态" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore(); // 现在变量名匹配了

  // 逻辑 A：如果页面需要登录 (requiresAuth) 且用户没登录
  // (这里假设你的 store 里有个变量叫 role)
  if (to.meta.requiresAuth && !userStore.role) {
    alert("请先登录");
    return next("/login");
  }

  // 逻辑 B：如果页面限定了角色 (role)，但当前用户角色不匹配
  if (to.meta.role && to.meta.role !== userStore.role) {
    alert("权限不足，您无法访问此页面");
    // 如果是管理员页面进不去，可以退回到登录页或用户首页
    return next("/login");
  }

  // 动态设置标题
  const baseTitle = '康健未来';
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }

  next(); // 只有以上规则都通过了，才放行
});

export default router;
