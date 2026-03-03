<template>
  <div class="admin-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside width="240px" class="aside">
        <div class="logo-container">
          <div class="logo-icon-wrapper">
            <el-icon class="logo-icon" :size="24"><Odometer /></el-icon>
          </div>
          <span class="logo-title">康健未来</span>
        </div>

        <el-menu
          :default-active="activePath"
          class="admin-menu"
          router
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/articles">
            <el-icon><Document /></el-icon>
            <span>健康资讯管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/models">
            <el-icon><List /></el-icon>
            <span>健康模型管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/comments">
            <el-icon><ChatLineRound /></el-icon>
            <span>评论管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/recipes">
            <el-icon><KnifeFork /></el-icon>
            <span>食谱管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container direction="vertical">
        <!-- 顶部导航栏 -->
        <el-header class="admin-header">
          <div class="header-left">
            <h2 class="module-title">{{ route.meta.title || '管理后台' }}</h2>
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click">
              <span class="user-action-link">
                <el-avatar 
                  :size="36" 
                  :src="adminAvatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" 
                />
                <span class="admin-name">{{ adminName }}</span>
                <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.js';
import { useTokenStore } from '@/stores/token.js';
import {
  CirclePlusFilled,
  Odometer,
  User,
  Document,
  List,
  FolderOpened,
  ChatLineRound,
  KnifeFork,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tokenStore = useTokenStore();

// Admin Info
const adminName = ref('');
const adminAvatar = ref('');

const fetchAdminInfo = async () => {
  try {
    const res = await request.get('/user/userInfo');
    if (res.code === 200 || res.code === 0) {
      adminName.value = res.data.name || res.data.username;
      adminAvatar.value = res.data.userPic;
    }
  } catch (err) {
    console.error('获取管理员信息失败:', err);
  }
};

onMounted(() => {
  fetchAdminInfo();
  document.documentElement.classList.remove('dark');
});
const activePath = ref('/admin/dashboard');

watch(() => route.path, (newPath) => {
  activePath.value = newPath;
}, { immediate: true });

const handleLogout = () => {
  tokenStore.removeToken();
  userStore.clearUserInfo();
  router.push('/login');
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

/* Sidebar Theme Colors */
:root {
  --aside-bg: #f8fafc; /* Light Slate / Whiteish */
  --aside-logo-text: #1a202c;
  --aside-menu-item-color: #64748b;
  --aside-menu-hover-bg: #f1f5f9;
  --aside-menu-hover-color: #10b981;
}

html.dark {
  --aside-bg: #022c22; /* Premium Dark Emerald */
  --aside-logo-text: #ffffff;
  --aside-menu-item-color: rgba(255, 255, 255, 0.7);
  --aside-menu-hover-bg: rgba(255, 255, 255, 0.08);
  --aside-menu-hover-color: #ffffff;
}

.aside {
  background-color: var(--aside-bg, #022c22);
  border-right: none;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  margin-bottom: 10px;
}

.logo-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  color: #ffffff !important;
}

.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--aside-logo-text, #ffffff);
  transition: color 0.3s;
}

.admin-menu {
  border-right: none;
  flex: 1;
  background-color: transparent;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 12px;
  border-radius: 8px;
  color: var(--aside-menu-item-color, rgba(255, 255, 255, 0.7));
  transition: all 0.3s;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; /* Match logo gradient */
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); /* Soft green shadow */
}

:deep(.el-menu-item:hover) {
  background-color: var(--aside-menu-hover-bg, rgba(255, 255, 255, 0.08));
  color: var(--aside-menu-hover-color, #ffffff);
}





.main {
  background-color: #f8fafc;
  padding: 24px;
  overflow-y: auto;
}

/* Header Styles */
.admin-header {
  background-color: #ffffff;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #f1f5f9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  z-index: 10;
}

.module-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.user-action-link {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-action-link:hover {
  background-color: #f1f5f9;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.dropdown-arrow {
  font-size: 12px;
  color: #94a3b8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
