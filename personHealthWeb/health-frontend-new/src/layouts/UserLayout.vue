<template>
  <div class="user-layout">
    <el-header class="nav-header">
      <div class="header-content">
        
        <!-- 左侧 Logo -->
        <div class="logo">
          <div class="logo-icon-wrapper">
            <el-icon class="logo-icon" :size="24"><Odometer /></el-icon>
          </div>
          <span class="logo-text">康健未来</span>
        </div>

        <div class="nav-content">
          <el-menu
            :default-active="activePath"
            class="nav-menu"
            mode="horizontal"
            router
            :ellipsis="false"
          >
            <el-menu-item index="/user/home">
              <span class="menu-item-text" data-text="首页">首页</span>
            </el-menu-item>
            <el-menu-item index="/user/recipes">
              <span class="menu-item-text" data-text="食谱信息">食谱信息</span>
            </el-menu-item>
            <el-menu-item index="/user/data">
              <span class="menu-item-text" data-text="健康数据">健康数据</span>
            </el-menu-item>
          </el-menu>
        </div>

        <div class="nav-right">
          <!-- 功能工具箱 (健康专题) -->
          <div class="apps-dropdown">
            <el-dropdown trigger="hover">
              <div class="apps-icon-wrapper">
                <el-icon :size="20"><More /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="health-apps-menu">
                  <el-dropdown-item @click="router.push('/user/diet')">
                    <el-icon><Dessert /></el-icon>
                    饮食记录
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/user/records')">
                    <el-icon><Document /></el-icon>
                    健康记录
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/user/my-articles')">
                    <el-icon><EditPen /></el-icon>
                    我的文章
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/user/favorites')">
                    <el-icon><Star /></el-icon>
                    我的收藏
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 用户头像和名称 -->
          <div class="user-action">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-avatar 
                  :size="36" 
                  :src="userAvatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" 
                />
                <span class="user-name">{{ userName }}</span>
                <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showProfileDialog = true">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon class="logout-icon"><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

      </div>
    </el-header>

    <el-main :class="['user-main', { 'no-top-padding': route.path === '/user/data' }]">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- 个人中心弹窗 -->
    <UserProfileDialog v-model="showProfileDialog" @refresh="handleProfileRefresh" />
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Odometer,
  More,
  HomeFilled,
  Star,
  Bowl, 
  Dessert,
  DataLine, 
  Document, 
  ArrowDown,
  User,
  SwitchButton,
  EditPen
} from '@element-plus/icons-vue';
import UserProfileDialog from '@/views/user/components/UserProfileDialog.vue';
import { useNotificationStore } from '@/stores/notification.js';
import { useUserStore } from '@/stores/user.js';
import { useTokenStore } from '@/stores/token.js';
import { getUserInfoService } from '@/api/user.js';

const notificationStore = useNotificationStore();
const userStore = useUserStore();
const tokenStore = useTokenStore();

const route = useRoute();
const router = useRouter();
const activePath = ref('/user/home');

// 用户名称 - 可以从后端获取或localStorage读取
const userName = ref(localStorage.getItem('userName') || '用户');

const showProfileDialog = ref(false);
const userAvatar = ref('');

// 加载用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfoService();
    if ((res.code === 200 || res.code === 0) && res.data) {
      userName.value = res.data.name || res.data.username || '用户';
      userAvatar.value = res.data.userPic || '';
      localStorage.setItem('userName', userName.value);
      // 同步到 store
      userStore.setUserInfo(res.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(() => {
  fetchUserInfo();
});

// 为什么要用 watchEffect：
// 确保用户直接输入网址或刷新页面时，导航栏的高亮位置与当前路径保持一致
watchEffect(() => {
  activePath.value = route.path;
});

const handleProfileRefresh = () => {
  // 重新获取用户信息，更新头像和名称
  fetchUserInfo();
};

const handleLogout = () => {
  tokenStore.removeToken();
  userStore.clearUserInfo();
  localStorage.removeItem('userName');
  router.push('/login');
  notificationStore.add('已安全退出');
};
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 白色背景导航栏 */
.nav-header {
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e8e8e8;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

/* Logo 样式 */
.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-right: 40px; /* 增加与菜单的间距 */
}

.logo-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.logo-icon {
  color: #ffffff !important;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.nav-content {
  flex: 1;
  display: flex;
  align-items: center;
}

/* 右侧导航容器 */
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto; /* 推到右侧 */
}

/* 导航菜单样式 */
.nav-menu {
  background-color: transparent !important;
  border-bottom: none !important;
}

:deep(.el-menu--horizontal) {
  border-bottom: none !important;
}

:deep(.el-menu-item) {
  font-size: 14px;
  font-weight: 500;
  color: #606266 !important;
  padding: 0 18px !important;
  height: 64px !important;
  line-height: 64px !important;
  border-bottom: none !important;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

:deep(.el-menu-item:hover) {
  color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.05) !important;
}

:deep(.el-menu-item.is-active) {
  color: #10b981 !important;
  font-weight: 600;
  background-color: transparent !important;
  border-bottom: none !important;
}

/* 解决菜单项文字加粗导致的宽度抖动 */
.menu-item-text {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.menu-item-text::after {
  content: attr(data-text);
  height: 0;
  visibility: hidden;
  overflow: hidden;
  user-select: none;
  pointer-events: none;
  font-weight: 600; /* 这里的权重应与 active 状态一致 */
}

:deep(.el-menu-item.is-active::after) {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 2px;
}

/* 下拉菜单子项激活样式 */
:deep(.el-menu--horizontal .el-menu .el-menu-item.is-active) {
  color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.05) !important;
}

/* 右侧工具箱图标 */
.apps-dropdown {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.apps-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s ease;
}

.apps-icon-wrapper:hover {
  background-color: #f5f7fa;
  color: #10b981;
}

.health-apps-menu :deep(.el-dropdown-menu__item) {
  font-size: 14px;
  padding: 10px 20px;
  min-width: 140px;
}

.health-apps-menu :deep(.el-dropdown-menu__item:hover) {
  color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.05) !important;
}

/* 用户操作区域 */
.user-action {
  display: flex;
  align-items: center;
  margin-left: 24px;
  padding-left: 24px;
  border-left: 1px solid #e8e8e8;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  outline: none !important; /* 移除外边框 */
}

.el-dropdown-link:focus-visible {
  outline: none !important;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-left: 10px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 12px;
  color: #909399;
  margin-left: 6px;
  transition: transform 0.3s ease;
}

.el-dropdown-link:hover .dropdown-arrow {
  transform: rotate(180deg);
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
}

.logout-icon {
  color: #f5222d !important; /* 调整为更醒目的红色 */
}

/* 主内容区域 */
.user-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  overflow: visible !important; /* 确保 position: sticky 生效 */
  min-height: calc(100vh - 64px); /* 防止页面高度变化导致跳动 */
}

.user-main.no-top-padding {
  padding-top: 0;
}

/* 页面过渡动画 - 简化为仅透明度，消除垂直跳动感 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.1s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
}
</style>