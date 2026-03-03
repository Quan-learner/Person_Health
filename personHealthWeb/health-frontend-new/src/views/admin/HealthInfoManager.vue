<template>
  <div class="health-info-container">
    <!-- Article Table Card -->
    <el-card shadow="never" class="table-card">
      <div class="card-header-actions">
        <div class="left-filters">
          <el-select
            v-model="selectedCategory"
            placeholder="全部分类"
            clearable
            class="category-select"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.code"
              :label="cat.name"
              :value="cat.code"
            />
          </el-select>
        </div>

        <div class="right-actions">
          <el-select v-model="selectedCheckState" placeholder="审核状态" class="filter-select" clearable @change="handleFilterChange">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
          <el-input
            v-model="searchQuery"
            placeholder="搜索健康资讯"
            class="search-input"
            clearable
            @keyup.enter="fetchArticles"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button class="action-btn" @click="fetchArticles">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>
      <el-table :data="articleList" style="width: 100%" v-loading="loading">
        <el-table-column label="文章封面" width="140">
          <template #default="{ row }">
            <el-image 
              :src="row.cover" 
              class="article-cover-thumb" 
              :preview-src-list="[row.cover]"
              preview-teleported
              fit="cover"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="article-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文章分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.categoryName || '健康资讯' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag 
              size="small" 
              :type="getCheckStateType(row.checkState)"
            >
              {{ getCheckStateLabel(row.checkState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览量" width="100" sortable prop="portSubscription">
          <template #default="{ row }">
            <div class="view-count">
              <el-icon class="view-icon"><View /></el-icon>
              <span>{{ row.portSubscription || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发布者" width="120">
          <template #default="{ row }">
            <span class="publisher-name">{{ row.username || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170" sortable prop="releaseTime">
          <template #default="{ row }">
            <span class="release-time">{{ formatTime(row.releaseTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button link class="more-btn">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.checkState === 0" @click="handleCheck(row)">
                    <el-icon><CircleCheck /></el-icon>审批
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleView(row)">
                    <el-icon><View /></el-icon>预览
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleDelete(row)" divided class="delete-item">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <span class="total-text">共 {{ total }} 条</span>
        <el-pagination
          :current-page="pageNum"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, sizes, jumper"
          :total="total"
          @size-change="val => { pageSize = val; fetchArticles(); }"
          @current-change="val => { pageNum = val; fetchArticles(); }"
        />
      </div>
    </el-card>

    <!-- Read-only View Dialog (Optional, currently uses handleView which opens new window) -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, MoreFilled, 
  CircleCheck, Delete, View, Picture, Plus,
  ArrowDown
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const tokenStore = useTokenStore();
const userStore = useUserStore();

// Table Data
const loading = ref(false);
const articleList = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const selectedCategory = ref(null);
const selectedCheckState = ref(null);

watch(selectedCategory, () => {
  pageNum.value = 1;
  fetchArticles();
});

const handleFilterChange = () => {
  pageNum.value = 1;
  fetchArticles();
};

// Categories
const categories = ref([]);

// Fetch Categories
const fetchCategories = async () => {
  try {
    const res = await request.get('/healthPort/categories');
    if (res.code === 200 || res.code === 0) {
      categories.value = res.data;
    }
  } catch (err) {
    console.error('获取分类失败:', err);
  }
};

// Fetch Articles
const fetchArticles = async () => {
  loading.value = true;
  try {
    const res = await request.get('/healthPort/list', {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        titleport: searchQuery.value || undefined,
        category: selectedCategory.value || undefined,
        checkState: selectedCheckState.value !== null ? selectedCheckState.value : undefined
      }
    });
    if (res.code === 200 || res.code === 0) {
      articleList.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('获取资讯列表失败:', err);
  } finally {
    loading.value = false;
  }
};

// Get Check State Labels
const getCheckStateLabel = (state) => {
  const map = {
    0: '未审核',
    1: '通过',
    2: '驳回'
  };
  return map[state] || '未知';
};

const getCheckStateType = (state) => {
  const map = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  };
  return map[state] || 'info';
};

// Format Time
const formatTime = (time) => {
  if (!time) return '--';
  return time.replace('T', ' ').substring(0, 19);
};

// Handle Check (Audit)
const handleCheck = (row) => {
  ElMessageBox.confirm(
    `请对资讯「${row.title}」进行审核操作`,
    '文章审核',
    {
      confirmButtonText: '通过',
      cancelButtonText: '驳回',
      distinguishCancelAndClose: true,
      type: 'info',
      center: true
    }
  ).then(async () => {
    // Approve
    updateState(row.id, 1);
  }).catch(async (action) => {
    if (action === 'cancel') {
      // Reject
      updateState(row.id, 2);
    }
  });
};

const updateState = async (id, state) => {
  try {
    const res = await request.put('/healthPort/checkState', {
      id: id,
      checkState: state
    });
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(state === 1 ? '文章已审核通过' : '文章已驳回');
      fetchArticles();
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

// Handle View
const handleView = (row) => {
  window.open(`/#/user/article/${row.id}`, '_blank');
};

// Handle Delete
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.delete('/healthPort/delete', { params: { id: row.id } });
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功');
      fetchArticles();
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败:', err);
    }
  }
};

// Handle Add
const handleAdd = () => {
  ElMessage.info('新增资讯功能开发中，敬请期待');
};

onMounted(() => {
  fetchCategories();
  fetchArticles();
});
</script>

<style scoped>
.health-info-container {
  padding: 0;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
}

.right-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: #f9fafb;
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.add-btn {
  border-radius: 8px;
  padding: 0 20px;
  height: 36px;
}

.table-card {
  border-radius: 16px;
  border: 1px solid #f0f0f0;
}

.card-header-actions {
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-filters {
  display: flex;
  align-items: center;
}

.category-select {
  width: 160px;
}

.category-select :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.category-select :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-select {
  width: 130px;
}

.filter-select :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.filter-select :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

.search-input {
  width: 220px;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

.action-btn {
  height: 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  font-weight: 500;
  color: #ffffff;
}

.action-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #ffffff;
}

.table-card :deep(.el-card__body) {
  padding: 0px 16px;
}

.article-cover-thumb {
  width: 100px;
  height: 56px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: block;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #a8abb2;
  font-size: 20px;
}

.article-title {
  font-weight: 600;
  color: #1a1a1a;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.view-icon {
  font-size: 16px;
  color: #909399;
}

.publisher-name {
  color: #4b5563;
}

.release-time {
  color: #9ca3af;
  font-size: 13px;
}

.more-btn {
  color: #6b7280;
}

.delete-item {
  color: #ef4444 !important;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
  border-top: 1px solid #f0f0f0;
}

.total-text {
  color: #6b7280;
  font-size: 13px;
}

/* Dialog Styles */
.article-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
  margin-right: 0;
}

.article-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.cover-upload {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cover-uploader {
  width: 160px;
  height: 90px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
