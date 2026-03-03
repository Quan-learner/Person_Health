<template>
  <div class="home-container">
    <!-- 整体布局：左侧主内容 + 右侧推荐栏 -->
    <div class="page-layout">
      <!-- 左侧主内容区 -->
      <div class="left-content">
        <!-- 顶部热门文章轮播 -->
        <h2 class="section-title">最热资讯</h2>
        <section class="featured-carousel" v-if="carouselArticles?.length > 0">
          <div class="carousel-wrapper">
            <!-- 左侧文章 -->
            <div class="carousel-item side left" @click="prevSlide">
              <img
                :src="carouselArticles[prevIndex].image"
                :alt="carouselArticles[prevIndex].title"
              />
              <div class="carousel-overlay">
                <h3>{{ carouselArticles[prevIndex].title }}</h3>
              </div>
            </div>

            <!-- 中间主文章 -->
            <div class="carousel-item center">
              <img
                :src="carouselArticles[currentIndex].image"
                :alt="carouselArticles[currentIndex].title"
              />
              <div class="carousel-content">
                <h1 class="carousel-title">
                  {{ carouselArticles[currentIndex].title }}
                </h1>
                <p class="carousel-desc">
                  {{ carouselArticles[currentIndex].description }}
                </p>
                <div class="carousel-actions">
                  <el-button
                    type="primary"
                    class="view-detail-btn"
                    round
                    @click="goToArticle(carouselArticles[currentIndex].id)"
                  >
                    <el-icon><View /></el-icon>
                    查看详情
                  </el-button>
                  <div class="carousel-dots">
                    <span
                      v-for="(article, index) in carouselArticles"
                      :key="article.id"
                      :class="['dot', { active: index === currentIndex }]"
                      @click="goToSlide(index)"
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧文章 -->
            <div class="carousel-item side right" @click="nextSlide">
              <img
                :src="carouselArticles[nextIndex].image"
                :alt="carouselArticles[nextIndex].title"
              />
              <div class="carousel-overlay">
                <h3>{{ carouselArticles[nextIndex].title }}</h3>
              </div>
            </div>
          </div>
        </section>

        <!-- 文章列表区 -->
        <section class="articles-section">
          <!-- 分类标签和搜索 -->
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
                placeholder="搜索健康资讯"
                class="search-input"
                :prefix-icon="Search"
                clearable
              />
            </div>
          </div>

          <!-- 文章网格 -->
          <div class="articles-grid" v-loading="loading">
            <div
              v-for="article in articles"
              :key="article.id"
              class="article-card"
              @click="goToArticle(article.id)"
            >
              <div class="article-image">
                <img :src="article.image" :alt="article.title" />
              </div>
              <div class="article-info">
                <h3 class="article-title">{{ article.title }}</h3>
                <div class="article-meta">
                  <span class="meta-item">
                    <el-icon><View /></el-icon>
                    <span>{{ article.portSubscription || 0 }}</span>
                  </span>
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatDate(article.releaseTime) }}</span>
                  </span>
                </div>
              </div>
            </div>
            <!-- 空状态 -->
            <el-empty
              v-if="!loading && articles?.length === 0"
              description="暂无相关文章"
            />
          </div>

          <!-- 分页器 -->
          <div class="pagination-wrapper" v-if="total > 0">
            <el-pagination
              :current-page="params.pageNum"
              :page-size="params.pageSize"
              @update:current-page="params.pageNum = $event"
              @update:page-size="params.pageSize = $event"
              :page-sizes="[4, 8, 12, 16]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </section>
      </div>

      <!-- 右侧推荐栏 -->
      <aside class="sidebar">
        <h2 class="sidebar-title">推荐资讯</h2>
        <div class="recommend-list">
          <div
            v-for="article in recommendedArticles"
            :key="article.id"
            class="recommend-item"
            @click="goToArticle(article.id)"
          >
            <img
              :src="article.image"
              :alt="article.title"
              class="recommend-img"
            />
            <div class="recommend-info">
              <h4 class="recommend-title">{{ article.title }}</h4>
              <div class="recommend-meta">
                <el-icon><View /></el-icon>
                <span class="view-count">{{ article.portSubscription || 0 }}</span>
                <el-icon style="margin-left: 8px;"><ChatDotRound /></el-icon>
                <span class="view-count">{{ article.commentCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 发布/管理文章入口 -->
        <div class="user-article-actions">
          <el-button 
            type="primary" 
            class="manage-articles-btn"
            @click="router.push('/user/my-articles')"
          >
            <el-icon><EditPen /></el-icon>
            我的健康文章
          </el-button>
        </div>

        <!-- 回到顶部功能 -->
        <div class="back-to-top-section">
          <el-button
            type="info"
            circle
            class="back-to-top-btn"
            @click="scrollToTop"
          >
            <el-icon :size="20"><CaretTop /></el-icon>
          </el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import {
  View,
  Search,
  Histogram,
  ArrowLeft,
  ArrowRight,
  CaretTop,
  Calendar,
  ChatDotRound,
  EditPen,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { 
  getArticleListService,
  getFeaturedArticlesService,
  getCategoriesService,
} from "@/api/article.js";
import { useNotificationStore } from "@/stores/notification.js";

const notificationStore = useNotificationStore();

const router = useRouter();

// 轮播文章数据
const carouselArticles = ref([]);
const currentIndex = ref(0);
let autoPlayTimer = null;

// 分类数据
const categories = ref([]);
const activeCategory = ref(0); // 0 代表全部
const searchQuery = ref("");

// 文章列表数据
const articles = ref([]);
const loading = ref(false);
const total = ref(0);

// 推荐文章（取精选的前5篇作为辅助展示）
const recommendedArticles = computed(() => {
  const featured = carouselArticles.value || [];
  const regular = articles.value || [];
  
  // 合并精选和普通文章，并进行去重
  const combined = [...featured, ...regular];
  const unique = [];
  const seenIds = new Set();
  
  for (const item of combined) {
    if (!seenIds.has(item.id)) {
      unique.push(item);
      seenIds.add(item.id);
    }
    if (unique.length >= 5) break; // 确保取 5 篇
  }
  
  return unique;
});
const params = ref({
  pageNum: 1,
  pageSize: 8,
  titleport: "",
  category: null,
});

// 计算轮播索引
const prevIndex = computed(() => {
  if (carouselArticles.value.length === 0) return 0;
  return (
    (currentIndex.value - 1 + carouselArticles.value.length) %
    carouselArticles.value.length
  );
});

const nextIndex = computed(() => {
  if (carouselArticles.value.length === 0) return 0;
  return (currentIndex.value + 1) % carouselArticles.value.length;
});

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getCategoriesService();
    console.log("获取分类成功:", res);
    if (res.code === 200 || res.code === 0) {
      // 兼容后端返回 code 或 id 的情况
      const categoryData = Array.isArray(res.data) ? res.data : [];
      categories.value = [
        { id: 0, name: "全部" },
        ...categoryData.map((item) => ({
          id: item.id || item.code,
          name: item.name,
        })),
      ];
    }
  } catch (error) {
    console.error("获取分类失败:", error);
  }
};

// 获取轮播图数据
const fetchFeaturedArticles = async () => {
  try {
    const res = await getFeaturedArticlesService();
    if (res.code === 200 || res.code === 0) {
      carouselArticles.value = res.data || [];
    }
  } catch (error) {
    console.error("获取推荐文章失败:", error);
  }
};

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true;
  try {
    // 处理搜索和分类参数
    params.value.titleport = searchQuery.value;
    params.value.category =
      activeCategory.value === 0 ? null : activeCategory.value;

    // 清理 null 参数，避免后端解析错误
    const requestParams = { ...params.value };
    if (!requestParams.category) delete requestParams.category;
    if (!requestParams.titleport) delete requestParams.titleport;

    console.log("发送请求参数:", requestParams);

    const res = await getArticleListService(requestParams);
    console.log("获取文章列表成功:", res);
    if (res.code === 200 || res.code === 0) {
      // 兼容直接返回数组或对象包装的情况
      if (res.data && res.data.records) {
        articles.value = res.data.records;
        total.value = res.data.total;
      } else {
        articles.value = res.data || [];
        total.value = articles.value.length;
      }
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
    // 错误已经在 request.js 中处理了
  } finally {
    loading.value = false;
  }
};

// 轮播控制
const prevSlide = () => {
  if (carouselArticles.value.length <= 1) return;
  currentIndex.value = prevIndex.value;
  resetAutoPlay();
};

const nextSlide = () => {
  if (carouselArticles.value.length <= 1) return;
  currentIndex.value = nextIndex.value;
  resetAutoPlay();
};

const goToSlide = (index) => {
  currentIndex.value = index;
  resetAutoPlay();
};

const goToArticle = (id) => {
  router.push(`/user/article/${id}`);
};

// 处理分页跳转
const handlePageChange = async () => {
  await fetchArticles();
  await nextTick();
  // 滚动回文章列表顶部
  const articleSection = document.querySelector(".articles-section");
  if (articleSection) {
    const top = articleSection.offsetTop - 80;
    window.scrollTo({
      top: top > 0 ? top : 0,
      behavior: "smooth",
    });
  }
};

// 处理每页条数变化
const handleSizeChange = () => {
  params.value.pageNum = 1;
  fetchArticles();
};

// 回到顶部逻辑
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// 自动轮播
const startAutoPlay = () => {
  if (carouselArticles.value.length <= 1) return;
  autoPlayTimer = setInterval(() => {
    currentIndex.value = nextIndex.value;
  }, 5000);
};

const resetAutoPlay = () => {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  startAutoPlay();
};

// 监听分类和搜索变化
watch(activeCategory, () => {
  params.value.pageNum = 1;
  fetchArticles();
});

let searchTimer = null;
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    params.value.pageNum = 1;
    fetchArticles();
  }, 500);
});

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchFeaturedArticles(),
    fetchArticles(),
  ]);
  startAutoPlay();
});

onUnmounted(() => {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
</script>

<style scoped>
.home-container {
  padding: 0 40px; /* 增加页面两侧内边距 */
  max-width: 1900px; /* 进一步增大主体区域宽度限制 (v4) */
  margin: 0 auto;
}

/* 整体页面布局 */
.page-layout {
  display: flex;
  gap: 12px; /* 减小间距，因为侧边栏增加了 padding */
  align-items: flex-start;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 0;
  margin-bottom: 20px;
  padding: 4px 20px 0; /* 顶部微调对齐 */
}

/* 轮播区域 */
.featured-carousel {
  position: relative;
  margin-bottom: 48px; /* 增加与下方列表的间距 */
  padding: 0 20px;
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 320px;
}

.carousel-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.4s ease;
  cursor: pointer;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 两侧文章样式 */
.carousel-item.side {
  width: 180px;
  height: 240px;
  flex-shrink: 0;
  opacity: 0.7;
  filter: brightness(0.8);
}

.carousel-item.side:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: #fff;
}

.carousel-overlay h3 {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 中间主文章样式 */
.carousel-item.center {
  flex: 1;
  max-width: 700px;
  height: 320px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
}

.carousel-item.center img {
  position: absolute;
  right: 0;
  top: 0;
  width: 50%;
  height: 100%;
  object-fit: cover;
  mask-image: linear-gradient(to right, transparent, black 30%);
  -webkit-mask-image: linear-gradient(to right, transparent, black 30%);
}

.carousel-content {
  position: relative;
  z-index: 1;
  padding: 32px 40px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 60%;
}

.carousel-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.4;
}

.carousel-desc {
  font-size: 14px;
  line-height: 1.8;
  opacity: 0.95;
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.carousel-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-detail-btn {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  padding: 10px 24px;
  font-size: 14px;
}

.view-detail-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.7);
}

.carousel-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: #fff;
  width: 24px;
  border-radius: 4px;
}

/* 导航按钮 */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.carousel-nav:hover {
  background: #22c55e;
  color: #fff;
}

.carousel-nav.prev {
  left: 0;
}

.carousel-nav.next {
  right: 0;
}

/* 主内容区域布局 */
.main-content {
  display: flex;
  gap: 24px;
}

.articles-section {
  flex: 1;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 确保垂直方向居中对齐 */
  margin-bottom: 32px; /* 增加下方间距，增强层次感 */
  flex-wrap: nowrap; /* 宽屏下防止换行 */
  gap: 24px;
  min-height: 48px;
}

.category-tabs {
  display: flex;
  gap: 4px; /* 缩短间隔 */
  flex-wrap: nowrap; /* 禁止换行 */
  overflow-x: auto; /* 万一太长可以滚动 */
  scrollbar-width: none; /* 隐藏滚动条 */
}
.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f5f5;
  white-space: nowrap; /* 确保文字不换行 */
}

.category-tab:hover {
  background: #e8f5e9;
  color: #22c55e;
}

.category-tab.active {
  background: #22c55e;
  color: #fff;
}

.search-wrapper {
  width: 220px; /* 缩窄占位宽度 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.search-input {
  width: 200px; /* 进一步缩窄固定宽度 */
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 20px;
  background: #fff;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  transition: border-color 0.4s, box-shadow 0.4s, transform 0.4s;
  backface-visibility: hidden;
  transform: translateZ(0); /* 开启 GPU 加速 */
}

:deep(.search-input:hover .el-input__wrapper) {
  border-color: #22c55e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

:deep(.search-input .el-input__wrapper.is-focus) {
  border-color: #22c55e;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25) !important;
  /* 移除 transform: translateY(-1px); 确保垂直方向绝对静止 */
}

/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 调整为 4 列 */
  gap: 24px; /* 增大间距，适应 1800px 宽度 */
}

.article-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.article-image {
  position: relative;
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
  padding: 12px 14px 16px;
}

.article-title {
  font-size: 14px;
  font-weight: 500; /* 调低字重 */
  color: #444; /* 柔化颜色 */
  line-height: 1.5;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 分页器样式 */
.pagination-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end; /* 右对齐 */
  padding-right: 4px;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: #f4f4f5;
  --el-pagination-hover-color: #22c55e;
  font-weight: 400;
}

:deep(.el-pagination .el-pager li) {
  background-color: #f4f4f5;
  color: #606266;
  border-radius: 4px;
  margin: 0 4px;
  min-width: 32px;
  height: 32px;
}

:deep(.el-pagination .el-pager li.is-active) {
  background-color: #22c55e !important; /* 强制背景绿色 */
  color: #fff !important; /* 文字白色 */
  font-weight: 700;
}

:deep(.el-pagination .el-pager li:not(.is-active):hover) {
  color: #22c55e !important;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #22c55e !important;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: #f4f4f5;
  border-radius: 4px;
  margin: 0 4px;
}

:deep(.el-pagination .el-input__inner) {
  text-align: center;
}

:deep(.el-pagination__total),
:deep(.el-pagination__jump) {
  color: #606266;
  font-size: 14px;
}

/* 右侧推荐栏 */
.sidebar {
  width: 250px; /* 进一步缩窄侧边栏，为左侧腾出空间 */
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  z-index: 10;
  padding: 0; /* 移除内边距，靠右边线对齐 */
  margin-top: 0; /* 对齐主内容顶部 */
}

.sidebar-title {
  font-size: 20px; /* 进一步增大标题 */
  font-weight: 800;
  color: #000;
  margin-top: 0;
  margin-bottom: 20px; /* 增加下方间距 */
  padding-top: 4px; /* 匹配左侧微调 */
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 0; /* 移除间距，改用 border-bottom 和 padding 控制 */
}

.recommend-item {
  display: flex;
  flex-direction: row; /* 水平排列 */
  gap: 12px; /* 增加间距 */
  cursor: pointer;
  transition: all 0.3s ease;
  align-items: flex-start; /* 改为 flex-start 以保证顶部对齐 */
  padding: 12px 0; /* 增加间距 */
  border-bottom: 1.5px solid #ebeef5; /* 更显眼的底边框 */
}

.recommend-item:last-child {
  border-bottom: none; /* 最后一项移除底边框 */
}

.recommend-item:hover {
  background-color: #fcfdfc; /* 悬浮背景色 */
  transform: translateX(4px); /* 向右微移 */
}

.recommend-item:hover .recommend-title {
  color: #22c55e;
}

.recommend-img {
  width: 120px; /* 增大宽度 */
  height: 72px; /* 增大高度 */
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.recommend-info {
  flex: 1;
  min-width: 0;
  height: 72px; /* 与图片高度一致 */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 撑开标题和底部的浏览量 */
  padding: 0;
}

.recommend-title {
  font-size: 14px;
  font-weight: 500; /* 还原为普通字重 */
  color: #333; /* 还原为自然黑色 */
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  margin-top: 0;
  margin-bottom: 0;
}

.recommend-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px; /* 增大字号 */
  color: #666; /* 加深颜色 */
  margin-top: 4px; /* 保证底部不会紧贴标题 */
}

.recommend-meta .el-icon {
  font-size: 12px;
}

/* 回到顶部 */
.back-to-top-section {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.back-to-top-btn {
  width: 44px;
  height: 44px;
  background: #fff;
  border: 1px solid #e4e7ed;
  color: #909399;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.back-to-top-btn:hover {
  background: #22c55e;
  border-color: #22c55e;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

/* My Articles Button Styles */
.user-article-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.manage-articles-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.manage-articles-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  filter: brightness(1.1);
}

.manage-articles-btn:active {
  transform: translateY(0);
}

@media (max-width: 1000px) {
  .carousel-item.side {
    display: none;
  }

  .carousel-item.center {
    max-width: 100%;
  }

  .featured-carousel {
    padding: 0;
  }

  .carousel-nav {
    display: none;
  }
}

/* 分页器样式优化 */
.pagination-wrapper :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #22c55e !important;
}

.pagination-wrapper :deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #22c55e !important;
}

@media (max-width: 900px) {
  .page-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    padding: 24px 0 0 0;
    border-left: none;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
