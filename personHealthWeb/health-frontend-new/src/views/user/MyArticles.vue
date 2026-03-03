<template>
  <div class="my-articles-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">我的健康文章</h2>
        <p class="page-subtitle">管理并分享您的健康心得与见解</p>
      </div>
      <el-button type="primary" class="add-article-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>发布新文章
      </el-button>
    </div>

    <!-- Stats Section -->
    <div class="stats-cards">
      <div class="stats-card">
        <div class="stats-info">
          <span class="stats-label">总发布</span>
          <span class="stats-value">{{ total }}</span>
        </div>
        <div class="stats-icon-box blue">
          <el-icon><Document /></el-icon>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-info">
          <span class="stats-label">待审核</span>
          <span class="stats-value">{{ pendingCount }}</span>
        </div>
        <div class="stats-icon-box orange">
          <el-icon><Timer /></el-icon>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-info">
          <span class="stats-label">总阅读</span>
          <span class="stats-value">{{ totalViews }}</span>
        </div>
        <div class="stats-icon-box green">
          <el-icon><View /></el-icon>
        </div>
      </div>
    </div>

    <!-- Article Table Card -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文章标题..."
              class="search-input"
              :prefix-icon="Search"
              clearable
              @clear="fetchArticles"
              @keyup.enter="fetchArticles"
            />
          </div>
          <div class="filter-box">
            <el-radio-group v-model="statusFilter" @change="fetchArticles">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button :label="0">待审核</el-radio-button>
              <el-radio-button :label="1">已发布</el-radio-button>
              <el-radio-button :label="2">未通过</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="articleList" v-loading="loading" style="width: 100%" class="article-table">
        <el-table-column label="封面" width="140">
          <template #default="{ row }">
            <el-image 
              :src="row.image || row.cover" 
              class="article-cover"
              :preview-src-list="[row.image || row.cover]"
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
        
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="article-title-text">{{ row.title }}</span>
              <span class="article-category-tag">{{ getCategoryName(row.category) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.checkState)" effect="light" round size="small">
              {{ getStatusLabel(row.checkState) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="互动数据" width="180">
          <template #default="{ row }">
            <div class="metrics-cell">
              <span class="metric-item">
                <el-icon><View /></el-icon>
                {{ row.portSubscription || 0 }}
              </span>
              <span class="metric-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ row.commentCount || 0 }}
              </span>
              <span class="metric-item">
                <el-icon><Star /></el-icon>
                {{ row.likeCount || 0 }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.releaseTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-tooltip content="编辑" placement="top">
                <el-button circle size="small" @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button circle size="small" type="danger" plain @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-footer">
        <el-pagination
          :current-page="pageNum"
          :page-size="pageSize"
          @update:current-page="pageNum = $event"
          @update:page-size="pageSize = $event"
          :total="total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchArticles"
          @current-change="fetchArticles"
        />
      </div>
    </el-card>

    <!-- Drawer for Add/Edit -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEdit ? '编辑健康文章' : '发布新健康文章'"
      size="600px"
      direction="rtl"
      destroy-on-close
    >
      <el-form 
        ref="articleFormRef" 
        :model="articleForm" 
        :rules="rules" 
        label-position="top"
        class="article-form"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="articleForm.title" placeholder="给文章起一个吸引人的标题吧" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="文章分类" prop="category">
          <el-select v-model="articleForm.category" placeholder="选择最合适的分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.code"
              :label="cat.name"
              :value="cat.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文章摘要" prop="briefIntroduction">
          <el-input 
            v-model="articleForm.briefIntroduction" 
            type="textarea" 
            :rows="3" 
            placeholder="简短介绍一下文章内容..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="封面图片" prop="cover">
          <div class="cover-uploader-wrapper">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :http-request="customUploadRequest"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="articleForm.cover" :src="articleForm.cover" class="cover-img" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              <p>支持 jpg/png 格式</p>
              <p>建议尺寸 800x450 (16:9)</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="文章内容" prop="content">
          <el-input 
            v-model="articleForm.content" 
            type="textarea" 
            :rows="12" 
            placeholder="开始创作您的健康内容..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '确认修改' : '立即发布' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { 
  Plus, Search, View, ChatDotRound, Star, 
  Delete, Edit, Picture, Document, Timer 
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getArticleListService, 
  getCategoriesService,
  addArticleService,
  updateArticleService,
  deleteArticleService
} from '@/api/article.js';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user.js';

const userStore = useUserStore();

// Article Data
const articleList = ref([]);
const loading = ref(false);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const statusFilter = ref('');

// Stats
const pendingCount = computed(() => articleList.value.filter(a => a.checkState === 0).length);
const totalViews = computed(() => articleList.value.reduce((sum, a) => sum + (a.portSubscription || 0), 0));

// Categories
const categories = ref([]);

// Form & Drawer
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const articleFormRef = ref(null);
const articleForm = ref({
  id: null,
  title: '',
  category: null,
  cover: '',
  briefIntroduction: '',
  content: '',
  username: userStore.userInfo.username
});

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  briefIntroduction: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面', trigger: 'change' }]
};



// Fetch Categories
const fetchCategories = async () => {
  try {
    const res = await getCategoriesService();
    if (res.code === 200 || res.code === 0) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// Fetch My Articles
const fetchArticles = async () => {
  loading.value = true;
  try {
    const res = await getArticleListService({
      userid: userStore.userInfo.id,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      titleport: searchQuery.value || undefined,
      checkState: statusFilter.value === '' ? undefined : statusFilter.value
    });
    
    if (res.code === 200 || res.code === 0) {
      articleList.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取文章列表失败');
  } finally {
    loading.value = false;
  }
};

// Category Mapping
const getCategoryName = (code) => {
  const cat = categories.value.find(c => c.code === code);
  return cat ? cat.name : '未分类';
};

// Status Formatting
const getStatusLabel = (state) => {
  const map = { 0: '待审核', 1: '已发布', 2: '未通过' };
  return map[state] || '未知';
};

const getStatusType = (state) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' };
  return map[state] || 'info';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return dateStr.replace('T', ' ').substring(0, 16);
};

// Upload Logic
const beforeUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) ElMessage.error('只能上传 JPG/PNG 格式图片!');
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB!');
  
  return isJPGorPNG && isLt2M;
};

const customUploadRequest = async (options) => {
  const { file, onProgress, onSuccess, onError } = options;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent });
        }
      }
    });
    if (res && (res.code === 200 || res.code === 0)) {
      articleForm.value.cover = res.data;
      onSuccess(res.data);
      ElMessage.success('封面上传成功');
    } else {
      onError(new Error(res.message || '上传失败'));
      ElMessage.error(res.message || '封面上传失败');
    }
  } catch (err) {
    onError(err);
    ElMessage.error('网络繁忙，封面上传失败');
  }
};

// Add/Edit Actions
const handleAdd = () => {
  isEdit.value = false;
  articleForm.value = {
    id: null,
    title: '',
    category: null,
    cover: '',
    briefIntroduction: '',
    content: '',
    username: userStore.userInfo.username
  };
  drawerVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  articleForm.value = {
    id: row.id,
    title: row.title,
    category: row.category,
    cover: row.cover,
    briefIntroduction: row.briefIntroduction,
    content: row.content,
    username: userStore.userInfo.username
  };
  drawerVisible.value = true;
};

const handleSubmit = async () => {
  if (!articleFormRef.value) return;
  
  try {
    await articleFormRef.value.validate();
    submitting.value = true;
    
    const service = isEdit.value ? updateArticleService : addArticleService;
    const res = await service(articleForm.value);
    
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(isEdit.value ? '文章修改成功' : '文章发布成功, 请等待审核');
      drawerVisible.value = false;
      fetchArticles();
    }
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除文章「${row.title}」吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteArticleService(row.id);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('删除成功');
        fetchArticles();
      }
    } catch (error) {
      ElMessage.error('删除操作失败');
    }
  }).catch(() => {});
};

watch(() => userStore.userInfo.id, (newId) => {
  if (newId) {
    fetchArticles();
  }
}, { immediate: true });

onMounted(() => {
  fetchCategories();
  // fetchArticles handled by watch immediate
});
</script>

<style scoped>
.my-articles-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
}

.add-article-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 10px;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.add-article-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 30px;
}

.stats-card {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
}

.stats-info {
  display: flex;
  flex-direction: column;
}

.stats-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stats-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stats-icon-box.blue { background: #eff6ff; color: #3b82f6; }
.stats-icon-box.orange { background: #fff7ed; color: #f97316; }
.stats-icon-box.green { background: #f0fdf4; color: #22c55e; }

/* Table Section */
.table-card {
  border-radius: 16px;
  border: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input {
  width: 300px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 12px;
  background-color: #f9fafb;
}

.article-table {
  border-radius: 12px;
}

.article-cover {
  width: 110px;
  height: 62px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.article-title-text {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.article-category-tag {
  font-size: 11px;
  background: #f3f4f6;
  color: #6b7280;
  padding: 1px 8px;
  border-radius: 4px;
  width: fit-content;
}

.metrics-cell {
  display: flex;
  gap: 12px;
  color: #9ca3af;
  font-size: 13px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-text {
  color: #6b7280;
  font-size: 13px;
}

.action-btns {
  display: flex;
  gap: 12px;
}

.pagination-footer {
  padding: 24px 0 0;
  display: flex;
  justify-content: center;
}

/* Form & Drawer Styles */
.article-form {
  padding: 0 10px;
}

.cover-uploader-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.cover-uploader {
  width: 240px;
  height: 135px;
  border: 1px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-uploader:hover {
  border-color: #10b981;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-icon {
  font-size: 32px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
</style>
