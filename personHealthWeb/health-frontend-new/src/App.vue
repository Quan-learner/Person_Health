<template>
  <div id="app-container">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from '@/components/common/ToastContainer.vue'
// 这里不需要引入 Login 和 Register 了，路由会自动处理
</script>

<style>
body { margin: 0; padding: 0; }
</style>