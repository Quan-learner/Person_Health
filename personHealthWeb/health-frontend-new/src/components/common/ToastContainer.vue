<template>
  <div class="toast-container">
    <transition-group name="toast-list">
      <div 
        v-for="item in notifications" 
        :key="item.id" 
        :class="['toast-item', item.type]"
      >
        <div class="toast-content">
          <span class="message">{{ item.message }}</span>
          <el-icon class="close-icon" @click="notificationStore.remove(item.id)"><Close /></el-icon>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { Close } from '@element-plus/icons-vue'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  min-width: 260px;
  max-width: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border-left: 4px solid #ddd;
}

.toast-item.success {
  border-left-color: #22c55e;
}

.toast-item.error {
  border-left-color: #ef4444;
}

.toast-item.warning {
  border-left-color: #f59e0b;
}

.toast-item.info {
  border-left-color: #3b82f6;
}

.toast-content {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.message {
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
  font-weight: 500;
}

.close-icon {
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #64748b;
}

/* 动画 */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
