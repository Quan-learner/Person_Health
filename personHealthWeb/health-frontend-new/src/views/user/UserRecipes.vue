<template>
  <div class="recipes-container">
    <div class="page-layout">
      <!-- 左侧主内容区 -->
      <div class="left-content">
        <!-- 分类和搜索栏 -->
        <div class="filter-bar">
          <div class="category-tabs">
            <span
              v-for="cat in categories"
              :key="cat.id"
              :class="['category-tab', { active: activeCategory === cat.id }]"
              @click="activeCategory = cat.id"
            >
              {{ cat.name }}
            </span>
          </div>
          <div class="search-wrapper">
            <el-input
              v-model="searchQuery"
              placeholder="搜索食谱"
              class="search-input"
              :prefix-icon="Search"
              clearable
            />
          </div>
        </div>

        <!-- 食谱网格 -->
        <div class="recipes-grid" v-loading="loading">
          <div
            v-for="recipe in recipes"
            :key="recipe.id"
            class="recipe-card"
            @click="goToDetail(recipe.id)"
          >
            <div class="recipe-image">
              <img :src="recipe.image" :alt="recipe.title" />
            </div>
            <div class="recipe-info">
              <div class="author-info">
                <el-avatar :size="20" :src="recipe.authorAvatar" />
                <span class="author-name">{{ recipe.authorName }}</span>
              </div>
              <div class="title-row">
                <h3 class="recipe-title">{{ recipe.title }}</h3>
                <span class="like-count">
                  <el-icon :size="14"><Star /></el-icon>
                  {{ recipe.likeCount || 0 }}
                </span>
              </div>
            </div>
          </div>
          
          <el-empty
            v-if="!loading && (!recipes || recipes.length === 0)"
            description="暂无相关食谱"
          />
        </div>

        <!-- 分页器 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <el-pagination
            :current-page="params.pageNum"
            :page-size="params.pageSize"
            @update:current-page="params.pageNum = $event"
            @update:page-size="params.pageSize = $event"
            :page-sizes="[10, 20, 30, 40]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <aside class="sidebar">
        <!-- 引导卡片 -->
        <div class="guide-card" @click="goToDietRecord">
          <div class="guide-content">
            <h2 class="guide-title">健康饮食，从此开始</h2>
            <p class="guide-subtitle">在这里记录每一餐的营养价值</p>
            <div class="guide-action">
              <span>去记录饮食</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
          <!-- 装饰性背景图标 -->
          <el-icon class="bg-icon"><Bowl /></el-icon>
        </div>

        <!-- 推荐食谱 -->
        <div class="recommend-section">
          <h2 class="sidebar-title">推荐食谱</h2>
          <div class="recommend-list">
            <div
              v-for="item in recommendedRecipes"
              :key="item.id"
              class="recommend-item"
              @click="goToDetail(item.id)"
            >
              <img :src="item.image" :alt="item.title" class="recommend-img" />
              <div class="recommend-info">
                <h4 class="recommend-title">{{ item.title }}</h4>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, ArrowRight, Bowl, Star } from '@element-plus/icons-vue';
import { getRecipeListService, getRecommendedRecipesService } from '@/api/recipe.js';

const router = useRouter();
const loading = ref(false);
const searchQuery = ref('');
const activeCategory = ref(0);
const total = ref(0);

const params = reactive({
  pageNum: 1,
  pageSize: 10,
  typeId: 0,
  name: ''
});

const categories = [
  { id: 0, name: '全部' },
  { id: 1, name: '减脂' },
  { id: 2, name: '增肌' }
];

const recipes = ref([]);
const recommendedRecipes = ref([]);

// 获取食谱数据
const fetchRecipes = async () => {
  loading.value = true;
  try {
    const reqParams = {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
      name: searchQuery.value || undefined,
      isPrivate: 0
    };
    if (activeCategory.value > 0) {
      reqParams.typeId = activeCategory.value;
    }
    const res = await getRecipeListService(reqParams);
    recipes.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    console.error('获取食谱失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取推荐数据
const fetchRecommended = async () => {
  try {
    const res = await getRecommendedRecipesService();
    recommendedRecipes.value = res.data || [];
  } catch (error) {
    console.error('获取推荐食谱失败:', error);
  }
};

// 监听分类和搜索
watch(activeCategory, () => {
  params.pageNum = 1;
  fetchRecipes();
});

watch(searchQuery, () => {
  params.pageNum = 1;
  fetchRecipes();
});

const handlePageChange = (val) => {
  params.pageNum = val;
  fetchRecipes();
};

const goToDetail = (id) => {
  router.push(`/user/recipe/${id}`);
};

const goToDietRecord = () => {
  router.push('/user/diet');
};

onMounted(() => {
  fetchRecipes();
  fetchRecommended();
});
</script>

<style scoped>
.recipes-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-layout {
  display: flex;
  gap: 24px;
}

.left-content {
  flex: 1;
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.category-tabs {
  display: flex;
  gap: 8px;
}

.category-tab {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f5f5;
}

.category-tab:hover {
  color: #22c55e;
}

.category-tab.active {
  background: #22c55e;
  color: #fff;
}

.search-input {
  width: 240px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 20px;
}

/* 食谱网格 */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.recipe-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.recipe-image {
  height: 140px;
  overflow: hidden;
  position: relative;
}

.recipe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.recipe-info {
  padding: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.author-name {
  font-size: 12px;
  color: #909399;
}

.recipe-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.like-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* 分页器 */
.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #22c55e !important;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.guide-card {
  position: relative;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  background-size: 200% 200%;
  animation: gradientFlow 6s ease infinite;
  border-radius: 12px;
  padding: 18px;
  color: #fff;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  user-select: none;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.guide-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.3);
}

.guide-card:active {
  transform: translateY(-4px) scale(0.97);
  transition: all 0.1s;
}

.guide-content {
  position: relative;
  z-index: 2;
}

.guide-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;
  line-height: 1.4;
  letter-spacing: 0.5px;
}

.guide-subtitle {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.guide-action {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  width: fit-content;
  padding: 6px 14px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.guide-card:hover .guide-action {
  background: rgba(255, 255, 255, 0.25);
  padding-right: 20px;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.guide-card:hover .arrow-icon {
  transform: translateX(4px);
}

.bg-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 70px;
  opacity: 0.15;
  color: #fff;
  transform: rotate(-15deg);
  z-index: 1;
  transition: all 0.5s ease;
}

.guide-card:hover .bg-icon {
  transform: rotate(0deg) scale(1.1);
  opacity: 0.2;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.recommend-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommend-item:last-child {
  border-bottom: none;
}

.recommend-item:hover {
  transform: translateX(4px);
}

.recommend-img {
  width: 100px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.recommend-info {
  flex: 1;
}

.recommend-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .recipes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .page-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
  .recipes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
