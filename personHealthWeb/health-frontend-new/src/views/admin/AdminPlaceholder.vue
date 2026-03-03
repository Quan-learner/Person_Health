<template>
  <div class="placeholder-container">
    <el-card shadow="never">
      <el-empty :description="title + ' 正在开发中...'">
        <el-button type="primary" @click="$router.push('/admin/dashboard')">返回仪表盘</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => {
  const path = route.path;
  if (path.includes('users')) return '用户管理';
  if (path.includes('articles')) return '健康资讯管理';
  if (path.includes('models')) return '健康模型管理';
  if (path.includes('records')) return '健康记录管理';
  if (path.includes('comments')) return '评论管理';
  if (path.includes('recipes')) return '食谱管理';
  if (path.includes('diet')) return '饮食记录';
  return '该模块';
});
</script>

<style scoped>
.placeholder-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
