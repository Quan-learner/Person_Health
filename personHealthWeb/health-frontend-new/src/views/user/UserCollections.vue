<template>
  <div class="collections-container">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <p class="page-subtitle">保存你感兴趣的内容，随时查看</p>
    </div>

    <div class="collections-layout">
      <div class="tabs-header-wrapper">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
          <!-- 精选文章 Tab -->
          <el-tab-pane label="精选文章" name="articles">
            <div class="articles-grid" v-if="paginatedArticles.length > 0">
              <div
                v-for="article in paginatedArticles"
                :key="article.id"
                class="article-card"
                :class="{ 'is-selected': isSelected(article.id) }"
                @click="handleItemClick(article.id, 'article')"
              >
                <div v-if="isManageMode" class="card-selection">
                  <el-checkbox :model-value="isSelected(article.id)" style="pointer-events: none" />
                </div>
                <div v-else class="delete-btn" @click.stop="handleCancelCollection(article.id, 'article')">
                  <el-icon><Delete /></el-icon>
                </div>
                <div class="article-image">
                  <img :src="article.image" :alt="article.title" />
                </div>
                <div class="article-info">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="meta-item">
                      <el-icon><View /></el-icon>
                      <span>{{ article.views || 0 }}</span>
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      <span>{{ article.date }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无收藏的文章" />
            
            <div class="pagination-wrapper" v-if="collectedArticles.length > 0">
              <el-pagination
                :current-page="articlePage"
                @update:current-page="articlePage = $event"
                :page-size="10"
                layout="prev, pager, next"
                :total="collectedArticles.length"
              />
            </div>
          </el-tab-pane>

          <!-- 美味食谱 Tab -->
          <el-tab-pane label="美味食谱" name="recipes">
            <div class="recipes-grid" v-if="paginatedRecipes.length > 0">
              <div
                v-for="recipe in paginatedRecipes"
                :key="recipe.id"
                class="recipe-card"
                :class="{ 'is-selected': isSelected(recipe.id) }"
                @click="handleItemClick(recipe.id, 'recipe')"
              >
                <div v-if="isManageMode" class="card-selection">
                  <el-checkbox :model-value="isSelected(recipe.id)" style="pointer-events: none" />
                </div>
                <div v-else class="delete-btn" @click.stop="handleCancelCollection(recipe.id, 'recipe')">
                  <el-icon><Delete /></el-icon>
                </div>
                <div class="recipe-image">
                  <img :src="recipe.image" :alt="recipe.title" />
                </div>
                <div class="recipe-info">
                  <div class="author-info">
                    <el-avatar :size="20" :src="recipe.authorAvatar" />
                    <span class="author-name">{{ recipe.authorName }}</span>
                  </div>
                  <h3 class="recipe-title">{{ recipe.title }}</h3>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无收藏的食谱" />

            <div class="pagination-wrapper" v-if="collectedRecipes.length > 0">
              <el-pagination
                :current-page="recipePage"
                @update:current-page="recipePage = $event"
                :page-size="10"
                layout="prev, pager, next"
                :total="collectedRecipes.length"
              />
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="collections-controls">
          <template v-if="isManageMode">
            <el-checkbox 
              v-model="allSelected" 
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
              class="select-all-check"
            >
              全选
            </el-checkbox>
            <el-button 
              type="danger" 
              :disabled="selectedIds.length === 0"
              @click="handleBatchDelete"
            >
              取消收藏 ({{ selectedIds.length }})
            </el-button>
          </template>
          <el-button 
            :type="isManageMode ? 'primary' : 'default'" 
            :plain="!isManageMode"
            @click="toggleManageMode"
          >
            {{ isManageMode ? '退出管理' : '批量管理' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { View, Calendar, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getCollectedArticlesService, 
  getCollectedRecipesService,
  toggleCollectionService,
  batchDeleteCollectionService
} from '@/api/collection.js';
import { useNotificationStore } from '@/stores/notification.js';

const notificationStore = useNotificationStore();
const router = useRouter();
const activeTab = ref('articles');
const loading = ref(false);

// 管理模式
const isManageMode = ref(false);
const selectedIds = ref([]);
const allSelected = ref(false);
const isIndeterminate = ref(false);

// 分页数据
const articlePage = ref(1);
const recipePage = ref(1);
const pageSize = 10;

// 收藏的文章数据
const collectedArticles = ref([]);

// 收藏的食谱数据
const collectedRecipes = ref([]);

// 计算分页数据
const paginatedArticles = computed(() => {
  const start = (articlePage.value - 1) * pageSize;
  return collectedArticles.value.slice(start, start + pageSize);
});

const paginatedRecipes = computed(() => {
  const start = (recipePage.value - 1) * pageSize;
  return collectedRecipes.value.slice(start, start + pageSize);
});

// 获取收藏的文章
const fetchCollectedArticles = async () => {
  loading.value = true;
  try {
    const res = await getCollectedArticlesService();
    if (res.code === 200 || res.code === 0) {
      collectedArticles.value = (res.data || []).map(item => ({
        id: item.id,
        title: item.title,
        image: item.image || item.cover,
        views: item.portSubscription || 0,
        date: formatDate(item.releaseTime)
      }));
    }
  } catch (error) {
    console.error('获取收藏文章失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取收藏的食谱
const fetchCollectedRecipes = async () => {
  loading.value = true;
  try {
    const res = await getCollectedRecipesService();
    if (res.code === 200 || res.code === 0) {
      collectedRecipes.value = (res.data || []).map(item => ({
        id: item.id,
        title: item.title,
        image: item.image,
        authorName: item.authorName || '匿名用户',
        authorAvatar: item.authorAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      }));
    }
  } catch (error) {
    console.error('获取收藏食谱失败:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const goToArticle = (id) => {
  router.push(`/user/article/${id}`);
};

const goToRecipe = (id) => {
  router.push(`/user/recipe/${id}`);
};

// 切换管理模式
const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value;
  selectedIds.value = [];
  allSelected.value = false;
  isIndeterminate.value = false;
};

// 选择逻辑
const isSelected = (id) => selectedIds.value.includes(id);

const toggleSelection = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
  updateSelectAllState();
};

const handleItemClick = (id, type) => {
  if (isManageMode.value) {
    toggleSelection(id);
  } else {
    if (type === 'article') goToArticle(id);
    else goToRecipe(id);
  }
};

const updateSelectAllState = () => {
  const currentList = activeTab.value === 'articles' ? collectedArticles.value : collectedRecipes.value;
  const count = selectedIds.value.length;
  allSelected.value = count > 0 && count === currentList.length;
  isIndeterminate.value = count > 0 && count < currentList.length;
};

const handleSelectAll = (val) => {
  if (val) {
    const currentList = activeTab.value === 'articles' ? collectedArticles.value : collectedRecipes.value;
    selectedIds.value = currentList.map(item => item.id);
  } else {
    selectedIds.value = [];
  }
  isIndeterminate.value = false;
};

const handleTabChange = () => {
  if (isManageMode.value) {
    selectedIds.value = [];
    allSelected.value = false;
    isIndeterminate.value = false;
  }
};

// 取消收藏处理
const handleCancelCollection = async (id, type) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消收藏吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        roundButton: true
      }
    );
    
    const res = await toggleCollectionService(id, type);
    if (res.code === 200 || res.code === 0) {
      notificationStore.add('已取消收藏');
      // 刷新列表
      if (type === 'article') {
        fetchCollectedArticles();
      } else {
        fetchCollectedRecipes();
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error);
      ElMessage.error('操作失败，请重试');
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要取消收藏选中的 ${selectedIds.value.length} 个项目吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        roundButton: true
      }
    );
    
    const res = await batchDeleteCollectionService(selectedIds.value, activeTab.value === 'articles' ? 'article' : 'recipe');
    if (res.code === 200 || res.code === 0) {
      notificationStore.add('批量取消收藏成功');
      isManageMode.value = false;
      selectedIds.value = [];
      if (activeTab.value === 'articles') {
        fetchCollectedArticles();
      } else {
        fetchCollectedRecipes();
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量取消收藏失败:', error);
      ElMessage.error('操作失败，请重试');
    }
  }
};

onMounted(() => {
  fetchCollectedArticles();
  fetchCollectedRecipes();
});
</script>

<style scoped>
.collections-container {
  padding: 0 40px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  padding: 0 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.collections-layout {
  background: transparent;
  position: relative;
}

.tabs-header-wrapper {
  position: relative;
}

.collections-controls {
  position: absolute;
  top: -2px;
  right: 20px;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 10;
}

.select-all-check {
  margin-right: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-bottom: 40px;
}

/* Tabs 样式定制 */
.custom-tabs :deep(.el-tabs__header) {
  margin-bottom: 30px;
  padding-left: 20px;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #f0f0f0;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 24px;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #22c55e;
  font-weight: 600;
}

.custom-tabs :deep(.el-tabs__active-bar) {
  background-color: #22c55e;
  height: 3px;
  border-radius: 3px;
}

/* 文章网格 (5列) */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 0 20px 20px;
}

.article-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  position: relative;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4d4f;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  opacity: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-card:hover .delete-btn,
.recipe-card:hover .delete-btn {
  opacity: 1;
}

.card-selection {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  width: 28px;
  height: 28px;
  border-radius: 50%; /* Back to circular style */
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.article-card.is-selected .card-selection,
.recipe-card.is-selected .card-selection {
  background: #22c55e;
  border-color: #22c55e;
  transform: scale(1.05);
}

.card-selection :deep(.el-checkbox__inner) {
  width: 20px;
  height: 20px;
  border-radius: 50%; /* Matching circular container */
  border: 1.5px solid #dcdfe6;
  background-color: transparent;
  transition: all 0.2s ease;
}

.article-card.is-selected .card-selection :deep(.el-checkbox__inner) {
  background-color: transparent;
  border-color: transparent;
}

.card-selection :deep(.el-checkbox__inner::after) {
  width: 5px;
  height: 10px;
  left: 9px;   /* Adjusted for 20px circular box */
  top: 9px;    /* Adjusted for 20px circular box */
  border-width: 2px;
  transition: transform 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46);
}

.card-selection :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #fff; /* White check on green background */
}

/* Hide the default hover border of element plus */
.card-selection :deep(.el-checkbox:hover .el-checkbox__inner) {
  border-color: #22c55e;
}

.article-card.is-selected,
.recipe-card.is-selected {
  border-color: #22c55e;
  background-color: #f0fdf4;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: #fff;
  transform: scale(1.1);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #e8f5e9;
}

.article-image {
  height: 160px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.article-info {
  padding: 16px;
}

.article-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 45px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 食谱网格 (5列) */
.recipes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 0 20px 20px;
}

.recipe-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: #e8f5e9;
}

.recipe-image {
  height: 140px;
  overflow: hidden;
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
  gap: 8px;
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
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .articles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .recipes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .articles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .recipes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
