<template>
  <div class="recipe-manager">
    <div class="content-wrapper">
      <el-card shadow="never" class="main-card">
        <!-- Toolbar -->
        <div class="card-toolbar">
          <div class="tabs-placeholder" style="flex: 1;">
            <div class="tab-label" style="color: #22c55e;">
              <el-icon><Monitor /></el-icon>
              <span>食谱管理</span>
            </div>
          </div>

          <div class="toolbar-right">
            <el-select v-model="auditFilter" placeholder="审核状态" class="filter-select" clearable @change="handleSearch">
              <el-option label="待审核" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
            <el-input
              v-model="keyword"
              placeholder="搜索食谱名称..."
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button class="action-btn" @click="handleSearch">搜索</el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          v-loading="loading"
          :data="recipeList"
          style="width: 100%"
          class="recipe-table"
          :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }"
        >
          <el-table-column label="封面" width="100" align="center">
            <template #default="{ row }">
              <div class="cover-box">
                <img v-if="row.image" :src="row.image" class="cover-img" />
                <div v-else class="cover-placeholder">
                  <el-icon><KnifeFork /></el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="食谱名称" min-width="200">
            <template #default="{ row }">
              <div class="recipe-info">
                <div class="recipe-name">{{ row.title }}</div>
                <div class="recipe-desc" v-if="row.categoryName">{{ row.categoryName }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="作者" width="150">
            <template #default="{ row }">
              <div class="author-cell">
                <el-avatar :size="24" :src="row.authorAvatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
                <span class="author-name">{{ row.authorName || '匿名' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isAudit === 0" type="warning" size="small">待审核</el-tag>
              <el-tag v-else-if="row.isAudit === 1" type="success" size="small">已通过</el-tag>
              <el-tag v-else-if="row.isAudit === 2" type="danger" size="small">已驳回</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="卡路里" width="120">
            <template #default="{ row }">
              <span class="calorie-text">{{ row.calories ? row.calories + ' kcal' : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180" sortable prop="createTime">
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.createTime) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-dropdown trigger="click">
                <el-button link class="more-btn">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.isPrivate === 0 && row.isAudit === 0" @click="handleAudit(row, 1)">
                      <el-icon><Select /></el-icon>通过
                    </el-dropdown-item>
                    <el-dropdown-item v-if="row.isPrivate === 0 && row.isAudit === 0" @click="handleAudit(row, 2)" class="reject-item">
                      <el-icon><CloseBold /></el-icon>驳回
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleEdit(row)">
                      <el-icon><Edit /></el-icon>编辑
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleDelete(row)" class="delete-item">
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
            @size-change="val => { pageSize = val; fetchRecipes(); }"
            @current-change="val => { pageNum = val; fetchRecipes(); }"
          />
        </div>
      </el-card>
    </div>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑公共食谱"
      width="600px"
      class="edit-dialog"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="90px"
        class="edit-form"
      >
        <el-form-item label="封面" prop="cover">
          <div class="cover-uploader-wrapper">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :http-request="customUploadRequest"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="editForm.cover" :src="editForm.cover" class="cover-img-preview" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">建议尺寸比例 4:3，支持 jpg/png 格式</div>
          </div>
        </el-form-item>

        <el-form-item label="标题" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入食谱标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="typeId">
              <el-select v-model="editForm.typeId" placeholder="选择分类" class="w-full">
                <el-option label="减脂" :value="1" />
                <el-option label="增肌" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="卡路里" prop="calories">
              <el-input-number v-model="editForm.calories" :min="0" :max="10000" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="食谱内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入食谱的详细步骤和所需食材..."
            resize="none"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="submitLoading">保存修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Plus, Delete, Edit, MoreFilled,
  KnifeFork, Monitor, User, Select, CloseBold
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import { useTokenStore } from '@/stores/token';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const tokenStore = useTokenStore();
const userStore = useUserStore();

// UI State
const loading = ref(false);
const recipeList = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const auditFilter = ref(null);

// Edit Dialog State
const editDialogVisible = ref(false);
const submitLoading = ref(false);
const editFormRef = ref(null);
const editForm = ref({
  id: null,
  name: '',
  cover: '',
  typeId: null,
  calories: 0,
  content: '',
  isPrivate: 0
});

const editRules = {
  name: [{ required: true, message: '请输入食谱标题', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择食谱分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入食谱内容', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传食谱封面', trigger: 'change' }]
};

// Fetch recipes
const fetchRecipes = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      name: keyword.value || undefined,
      isPrivate: 0, // 只获取公开食谱
      isAudit: auditFilter.value !== null ? auditFilter.value : undefined
    };

    const res = await request.get('/admin/recipe/list', { params });
    if (res.code === 200 || res.code === 0) {
      recipeList.value = res.data?.records || [];
      total.value = res.data?.total || 0;
    }
  } catch (err) {
    ElMessage.error('获取食谱列表失败');
  } finally {
    loading.value = false;
  }
};



const handleSearch = () => {
  pageNum.value = 1;
  fetchRecipes();
};

// Audit recipe
const handleAudit = (row, auditStatus) => {
  const actionText = auditStatus === 1 ? '通过' : '驳回';
  ElMessageBox.confirm(
    `确定要${actionText}食谱「${row.title}」吗？`,
    '审核确认',
    {
      confirmButtonText: `确定${actionText}`,
      cancelButtonText: '取消',
      type: auditStatus === 1 ? 'success' : 'warning',
      center: true
    }
  ).then(async () => {
    try {
      const res = await request.put(`/admin/recipe/audit/${row.id}?isAudit=${auditStatus}`);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success(`食谱已${actionText}`);
        fetchRecipes();
      }
    } catch (err) {
      ElMessage.error(`${actionText}失败`);
    }
  });
};

// Delete recipe
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除食谱「${row.title}」吗？`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    }
  ).then(async () => {
    try {
      const res = await request.delete(`/admin/recipe/delete/${row.id}`);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('食谱已删除');
        fetchRecipes();
      }
    } catch (err) {
      ElMessage.error('删除失败');
    }
  });
};

// Edit Support
const handleEdit = (row) => {
  editForm.value = {
    id: row.id,
    name: row.title,
    cover: row.image,
    typeId: row.typeId,
    calories: row.calories || 0,
    content: row.content,
    isPrivate: row.isPrivate
  };
  editDialogVisible.value = true;
};

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
      editForm.value.cover = res.data;
      onSuccess(res.data);
      ElMessage.success('封面上传成功');
      if (editFormRef.value) editFormRef.value.validateField('cover');
    } else {
      onError(new Error(res.message || '上传失败'));
      ElMessage.error(res.message || '封面上传失败');
    }
  } catch (err) {
    onError(err);
    ElMessage.error('网络繁忙，封面上传失败');
  }
};

const submitEdit = () => {
  if (!editFormRef.value) return;
  editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const res = await request.put('/admin/recipe/update', editForm.value);
        if (res.code === 200 || res.code === 0) {
          ElMessage.success('食谱修改成功');
          editDialogVisible.value = false;
          fetchRecipes();
        } else {
          ElMessage.error(res.message || '修改失败');
        }
      } catch (err) {
        ElMessage.error('服务器异常，修改失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// Helpers
const formatTime = (t) => t ? String(t).replace('T', ' ').substring(0, 19) : '--';

onMounted(() => {
  fetchRecipes();
});
</script>

<style scoped>
.recipe-manager {
   /* Restored some top padding, reduced side padding */
  min-height: 100%;
}

/* Header */
.recipe-manager-container {
  padding: 0;
}
.content-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.main-card {
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 260px;
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

/* Table */
.cover-box {
  width: 56px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 20px;
}

.recipe-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.recipe-desc {
  font-size: 12px;
  color: #64748b;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  color: #334155;
}

.calorie-text {
  font-size: 13px;
  color: #f59e0b;
  font-weight: 600;
}

.time-text {
  font-size: 13px;
  color: #94a3b8;
}

.more-btn {
  color: #9ca3af;
  font-size: 18px;
}

.more-btn:hover {
  color: #111827;
}

.delete-item {
  color: #ef4444;
}

.reject-item {
  color: #f59e0b;
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

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.total-text {
  font-size: 13px;
  color: #94a3b8;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Upload & Dialog Forms */
.w-full {
  width: 100%;
}

.cover-uploader-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-uploader :deep(.el-upload) {
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 160px;
  height: 120px;
  background-color: #fafafa;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #22c55e;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 160px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.cover-img-preview {
  width: 160px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
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
</style>
