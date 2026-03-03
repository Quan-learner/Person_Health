<template>
  <div class="health-model-manager">
    <!-- Model Cards Grid -->
    <div class="content-wrapper">
      <el-card shadow="never" class="main-card">
        <div class="card-toolbar">
          <el-tabs v-model="activeTab" class="model-tabs">
            <el-tab-pane name="public">
              <template #label>
                <span class="tab-label" style="color: #1e293b;">
                  <el-icon><Monitor /></el-icon>公共模型
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>

          <div class="toolbar-right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索模型名称或符号..."
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="add-btn" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增模型
            </el-button>
          </div>
        </div>

        <el-table 
          v-loading="loading"
          :data="filteredList" 
          style="width: 100%"
          class="model-table"
          :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }"
        >
          <el-table-column label="模型图标" width="100" align="center">
            <template #default="{ row }">
              <div class="model-icon-box" :style="{ backgroundColor: (row.iconColor || '#f0f9ff') + '15' }">
                <img v-if="row.icon && row.icon.startsWith('http')" :src="row.icon" class="model-icon-img" />
                <span v-else class="model-icon-text" :style="{ color: row.iconColor || '#3b82f6' }">
                  {{ row.name ? row.name.charAt(0) : '?' }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="模型名称" min-width="180">
            <template #default="{ row }">
              <div class="model-info">
                <div class="model-name">{{ row.name }}</div>
                <div class="model-desc" v-if="row.description">{{ row.description }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="单位/符号" width="150">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" class="unit-tag">{{ row.symbol || '--' }}</el-tag>
              <span class="unit-text">{{ row.unit || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.createTime) }}</span>
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
      </el-card>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模型' : '新增健康模型'"
      width="600px"
      class="premium-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="模型图标">
          <div class="icon-upload-area">
            <div class="current-icon-preview" v-if="form.icon && form.icon.startsWith('http')">
              <img :src="form.icon" class="preview-icon-img" />
            </div>
            <el-button type="primary" plain @click="triggerIconUpload">
              <el-icon><Upload /></el-icon>{{ form.icon && form.icon.startsWith('http') ? '更换图标' : '上传图标' }}
            </el-button>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="如：心率" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="符号" prop="symbol">
              <el-input v-model="form.symbol" placeholder="如：bpm" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：次/分" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述模型用途及指标范围..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 隐藏的图标上传 input -->
    <input
      type="file"
      ref="iconFileInput"
      style="display: none"
      accept="image/*"
      @change="onIconFileChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, Plus, 
  Monitor, MoreFilled, Edit, Delete, Upload
} from '@element-plus/icons-vue';
import { ElLoading } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();

// UI State
const loading = ref(false);
const activeTab = ref('public');
const rawList = ref([]);
const searchQuery = ref('');

// Form Context
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const iconFileInput = ref(null);
const form = ref({
  id: null,
  name: '',
  unit: '',
  symbol: '',
  icon: '',
  iconColor: '',
  description: '',
  type: 0,
  status: 1
});

const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  symbol: [{ required: true, message: '请输入符号', trigger: 'blur' }],
};

// Computed filtered list
const filteredList = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  return rawList.value.filter(item => {
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) || 
      (item.symbol && item.symbol.toLowerCase().includes(query));
    return matchesSearch;
  });
});

// Fetch Models
const fetchModels = async () => {
  loading.value = true;
  try {
    const res = await request.get('/healthModel/public');
    if (res.code === 200 || res.code === 0) {
      rawList.value = res.data || [];
    }
  } catch (err) {
    ElMessage.error('获取模型列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
};

// Handlers
const handleAdd = () => {
  isEdit.value = false;
  form.value = {
    id: null,
    name: '',
    unit: '',
    symbol: '',
    icon: '',
    iconColor: '',
    description: '',
    type: activeTab.value === 'public' ? 0 : 1,
    status: 1
  };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除模型「${row.name}」吗？`, '安全警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    center: true
  }).then(async () => {
    try {
      const res = await request.delete(`/healthModel/delete/${row.id}`);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('模型已删除');
        fetchModels();
      }
    } catch (err) {
      ElMessage.error('操作失败');
    }
  });
};

// Handle Audit
const handleAudit = (row) => {
  ElMessageBox.confirm(
    `请对模型「${row.name}」进行审核操作`,
    '模型审核',
    {
      confirmButtonText: '通过',
      cancelButtonText: '驳回',
      distinguishCancelAndClose: true,
      type: 'info',
      center: true
    }
  ).then(async () => {
    updateModelStatus(row.id, 1);
  }).catch(async (action) => {
    if (action === 'cancel') {
      updateModelStatus(row.id, 2);
    }
  });
};

const updateModelStatus = async (id, status) => {
  try {
    const res = await request.put('/healthModel/status', null, {
      params: { id, status }
    });
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(status === 1 ? '模型已审核通过' : '模型已驳回');
      fetchModels();
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    const isUpdating = !!form.value.id;
    const endpoint = isUpdating ? `/healthModel/update/${form.value.id}` : '/healthModel/add';
    const method = isUpdating ? 'put' : 'post';
    
    const res = await request[method](endpoint, form.value);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(isUpdating ? '模型已更新' : '模型创建成功');
      dialogVisible.value = false;
      fetchModels();
    }
  } catch (err) {
    if (err !== false) ElMessage.error('表单校验未通过');
  } finally {
    submitLoading.value = false;
  }
};

// Icon Upload
const triggerIconUpload = () => {
  if (iconFileInput.value) iconFileInput.value.click();
};

const onIconFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const loadingInstance = ElLoading.service({ text: '上传中...' });
  try {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    const res = await request.post('/upload', uploadForm, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res && (res.code === 200 || res.code === 0)) {
      form.value.icon = res.data;
      ElMessage.success('图标上传成功');
    } else {
      ElMessage.error(res.message || '上传失败');
    }
  } catch (error) {
    ElMessage.error('图标上传失败');
  } finally {
    loadingInstance.close();
    event.target.value = '';
  }
};

// Helpers
const getStatusLabel = (s) => ['待审核', '已通过', '未通过'][s] || '未知';
const getStatusType = (s) => ['warning', 'success', 'danger'][s] || 'info';
const formatTime = (t) => t ? t.replace('T', ' ').substring(0, 19) : '--';

onMounted(() => {
  fetchModels();
});
</script>

<style scoped>
.health-model-manager {
  padding: 0;
  min-height: 100%;
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
  gap: 16px;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.add-btn {
  border-radius: 10px;
  font-weight: 600;
  padding: 0 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: #ffffff;
}

.add-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border: none;
  color: #ffffff;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

/* Table */
.model-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.model-icon-text {
  font-size: 18px;
  font-weight: 700;
}

.model-icon-img {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: cover;
}

.model-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.model-desc {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-tag {
  margin-right: 8px;
  border-radius: 4px;
}

.unit-text {
  font-size: 13px;
  color: #64748b;
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

/* Icon Upload */
.icon-upload-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.preview-icon-img {
  width: 36px;
  height: 36px;
  object-fit: cover;
}

/* Dialog */
.premium-dialog :deep(.el-dialog__header) {
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.premium-dialog :deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
