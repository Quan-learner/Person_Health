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
          <el-button type="primary" class="add-btn" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增文章
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
                  <el-dropdown-item @click="handleEdit(row)">
                    <el-icon><Edit /></el-icon>编辑
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

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增健康文章' : '编辑健康文章'"
      width="700px"
      class="article-dialog"
      destroy-on-close
    >
      <el-form
        ref="articleFormRef"
        :model="articleForm"
        :rules="articleRules"
        label-width="100px"
        class="article-form"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="articleForm.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="文章分类" prop="category">
              <el-select v-model="articleForm.category" placeholder="请选择分类" class="w-full">
                <el-option
                  v-for="cat in categories"
                  :key="cat.code"
                  :label="cat.name"
                  :value="cat.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核状态" prop="checkState" v-if="dialogMode === 'edit'">
              <el-select v-model="articleForm.checkState" placeholder="请选择审核状态" class="w-full">
                <el-option label="待审核" :value="0" />
                <el-option label="已通过" :value="1" />
                <el-option label="已驳回" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章封面" prop="cover">
          <div class="cover-upload-wrapper">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :http-request="customUploadRequest"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="articleForm.cover" :src="articleForm.cover" class="cover-preview" />
              <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">建议尺寸 16:9，小于 2MB 的 jpg/png 格式</div>
          </div>
        </el-form-item>

        <el-form-item label="文章简介" prop="briefIntroduction">
          <el-input
            v-model="articleForm.briefIntroduction"
            type="textarea"
            :rows="3"
            placeholder="请输入文章简短介绍..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="文章内容" prop="content">
          <el-input
            v-model="articleForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文章正文内容..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitArticle" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, MoreFilled, 
  CircleCheck, Delete, View, Picture, Plus,
  Edit
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';
import { 
  getArticleListService, 
  getCategoriesService, 
  addArticleService, 
  updateArticleService, 
  deleteArticleService 
} from '@/api/article';
import { uploadFileService } from '@/api/upload';

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
    const res = await getCategoriesService();
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
    const res = await getArticleListService({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      titleport: searchQuery.value || undefined,
      category: selectedCategory.value || undefined,
      checkState: selectedCheckState.value !== null ? selectedCheckState.value : undefined
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

// Dialog State
const dialogVisible = ref(false);
const dialogMode = ref('add'); // 'add' or 'edit'
const submitLoading = ref(false);
const articleFormRef = ref(null);
const articleForm = ref({
  id: null,
  title: '',
  category: null,
  cover: '',
  briefIntroduction: '',
  content: '',
  checkState: 1, // 管理员默认审核通过
  username: ''
});

const articleRules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  cover: [{ required: true, message: '请上传文章封面', trigger: 'change' }],
  briefIntroduction: [{ required: true, message: '请输入文章简介', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
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
    updateState(row.id, 1);
  }).catch(async (action) => {
    if (action === 'cancel') {
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

// Handle Add
const handleAdd = () => {
  dialogMode.value = 'add';
  articleForm.value = {
    id: null,
    title: '',
    category: null,
    cover: '',
    briefIntroduction: '',
    content: '',
    checkState: 1,
    username: userStore.userInfo.username
  };
  dialogVisible.value = true;
};

// Handle Edit
const handleEdit = (row) => {
  dialogMode.value = 'edit';
  articleForm.value = {
    id: row.id,
    title: row.title,
    category: row.category,
    cover: row.cover,
    briefIntroduction: row.briefIntroduction,
    content: row.content,
    checkState: row.checkState,
    username: row.username
  };
  dialogVisible.value = true;
};

// Image Upload
const beforeUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) {
    ElMessage.error('封面只能是 JPG/PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('封面大小不能超过 2MB!');
  }
  return isJPGorPNG && isLt2M;
};

const customUploadRequest = async (options) => {
  const { file, onProgress, onSuccess, onError } = options;
  try {
    const res = await uploadFileService(file);
    if (res.code === 200 || res.code === 0) {
      articleForm.value.cover = res.data;
      onSuccess(res.data);
      ElMessage.success('上传成功');
    } else {
      onError(new Error(res.message || '上传失败'));
      ElMessage.error(res.message || '上传失败');
    }
  } catch (err) {
    onError(err);
    ElMessage.error('上传失败');
  }
};

// Submit Article
const submitArticle = () => {
  if (!articleFormRef.value) return;
  articleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        let res;
        if (dialogMode.value === 'add') {
          res = await addArticleService(articleForm.value);
        } else {
          res = await updateArticleService(articleForm.value);
        }

        if (res.code === 200 || res.code === 0) {
          ElMessage.success(dialogMode.value === 'add' ? '新增成功' : '修改成功');
          dialogVisible.value = false;
          fetchArticles();
        } else {
          ElMessage.error(res.message || '提交失败');
        }
      } catch (err) {
        console.error('提交失败:', err);
        ElMessage.error('提交失败，请重试');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// Handle Delete
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await deleteArticleService(row.id);
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

onMounted(() => {
  fetchCategories();
  fetchArticles();
});
</script>

<style scoped>
.health-info-container {
  padding: 0;
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

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
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

.add-btn {
  height: 36px;
  border-radius: 10px;
  background: #10b981;
  border-color: #10b981;
}

.add-btn:hover {
  background: #059669;
  border-color: #059669;
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

.w-full {
  width: 100%;
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

.cover-upload-wrapper {
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
  background-color: #f8fafc;
}

.cover-uploader:hover {
  border-color: #10b981;
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
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
