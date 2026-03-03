<template>
  <div class="health-records-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="divider">|</span>
        <h1 class="page-title">健康记录</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" plain @click="handleAddModel">
          <el-icon><Plus /></el-icon>
          新增模型
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：模型列表区域 -->
      <div class="model-list-section">
        <!-- 工具栏 -->
        <div class="toolbar">
          <!-- 左侧：选项卡和提示 -->
          <div class="tab-group-wrapper">
            <div class="tab-group">
              <button 
                :class="['tab-btn', { 'active': activeTab === 'public' }]"
                @click="activeTab = 'public'"
              >
                公共模型
              </button>
              <button 
                :class="['tab-btn', { 'active': activeTab === 'private' }]"
                @click="activeTab = 'private'"
              >
                私人模型
              </button>
            </div>
          </div>
          
          <!-- 右侧：搜索框 -->
          <div class="actions">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索模型" 
              :prefix-icon="Search"
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">确定</el-button>
          </div>
        </div>

        <!-- 模型列表表格 -->
        <div class="model-table-container" v-loading="loading">
          <table class="model-table">
            <thead>
              <tr>
                <th class="col-icon">图标</th>
                <th class="col-name">模型名</th>
                <th class="col-unit">单位</th>
                <th class="col-symbol">符号</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="model in paginatedModels" 
                :key="model.id"
              >
                <td class="col-icon">
                  <div class="model-icon" :style="{ color: model.iconColor }">
                    <img v-if="isImageUrl(model.icon)" :src="model.icon" class="model-icon-img" />
                    <component v-else :is="model.icon" />
                  </div>
                </td>
                <td class="col-name">
                  <div class="model-name-wrapper">
                    <span class="model-name-text">{{ model.name }}</span>
                    <el-tooltip
                      v-if="model.description"
                      effect="dark"
                      :content="model.description"
                      placement="top"
                    >
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </td>
                <td class="col-unit">{{ model.unit }}</td>
                <td class="col-symbol">{{ model.symbol }}</td>
                <td class="col-action">
                  <div class="action-buttons" @click.stop>
                    <el-dropdown trigger="click" @command="handleCommand($event, model)">
                      <el-button link>
                        <el-icon :size="18"><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <!-- 公共模型：只能选中 -->
                          <template v-if="activeTab === 'public'">
                            <el-dropdown-item command="select">
                              <div class="dropdown-item-content">
                                <el-icon v-if="isModelSelected(model.id)"><Check /></el-icon>
                                <el-icon v-else><Plus /></el-icon>
                                <span>{{ isModelSelected(model.id) ? '取消选中' : '选中该模型' }}</span>
                              </div>
                            </el-dropdown-item>
                          </template>
                          <!-- 私人模型：显示选中、编辑和删除 -->
                          <template v-else>
                            <el-dropdown-item command="select">
                              <div class="dropdown-item-content">
                                <el-icon v-if="isModelSelected(model.id)"><Check /></el-icon>
                                <el-icon v-else><Plus /></el-icon>
                                <span>{{ isModelSelected(model.id) ? '取消选中' : '选中该模型' }}</span>
                              </div>
                            </el-dropdown-item>
                            <el-dropdown-item command="edit" divided>
                              <div class="dropdown-item-content">
                                <el-icon><Edit /></el-icon>
                                <span>编辑模型</span>
                              </div>
                            </el-dropdown-item>
                            <el-dropdown-item command="delete">
                              <div class="dropdown-item-content">
                                <el-icon><Delete /></el-icon>
                                <span>删除模型</span>
                              </div>
                            </el-dropdown-item>
                          </template>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="modelCurrentPage"
            v-model:page-size="modelPageSize"
            :total="filteredModels.length"
            :page-sizes="[9, 18, 27, 36]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>

      <!-- 右侧：健康记录输入面板 -->
      <div class="record-input-section">
        <div v-if="selectedModels.length === 0" class="empty-state">
          <div class="empty-illustration">
            <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="30" width="120" height="90" rx="8" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
              <rect x="55" y="45" width="90" height="12" rx="4" fill="#e8e8e8"/>
              <rect x="55" y="65" width="70" height="8" rx="3" fill="#e8e8e8"/>
              <rect x="55" y="80" width="50" height="8" rx="3" fill="#e8e8e8"/>
              <rect x="55" y="95" width="60" height="8" rx="3" fill="#e8e8e8"/>
              <path d="M100 115 L110 125 L130 105" stroke="#d0d0d0" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="empty-text">请选中模型</p>
        </div>
        
        <div v-else class="record-form-container">
          <!-- 表单头部 -->
          <div class="form-header">
            <h2 class="form-title">记录健康</h2>
            <el-tooltip content="清空选中的模型" placement="top">
              <el-button :icon="Delete" circle size="small" class="form-edit-btn" @click="clearSelection" />
            </el-tooltip>
          </div>
          
          <!-- 表单内容 -->
          <div class="form-content">
            <div 
              v-for="model in selectedModels" 
              :key="model.id"
              class="form-field"
            >
              <div class="field-label">
                <el-tag 
                  :type="model.type === 0 ? 'info' : 'success'" 
                  size="small" 
                  effect="plain" 
                  class="source-tag"
                >
                  {{ model.type === 0 ? '公共' : '我的' }}
                </el-tag>
                <span>{{ model.name }}</span>
                <el-tooltip :content="`单位: ${model.unit}`" placement="top">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <el-input
                v-model="formData[model.id]"
                :placeholder="'请输入值'"
                class="field-input"
              />
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="form-footer">
            <el-button type="primary" class="submit-btn" @click="handleSubmit">
              <el-icon><Check /></el-icon>
              立即新增
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增模型抽屉 -->
    <el-drawer
      v-model="addModelDrawerVisible"
      :title="isEdit ? '编辑健康模型' : '新增健康模型'"
      direction="rtl"
      size="600px"
      :close-on-click-modal="true"
      class="add-model-drawer"
    >
      <div class="drawer-content">
        <el-form
          ref="addModelFormRef"
          :model="newModelForm"
          :rules="newModelFormRules"
          label-position="left"
          label-width="60px"
          class="add-model-form"
        >
          <!-- 图标上传 -->
          <el-form-item label="图标" prop="icon">
            <el-upload
              class="icon-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleIconChange"
              accept="image/*"
            >
              <div v-if="newModelForm.iconUrl" class="icon-preview">
                <img :src="newModelForm.iconUrl" alt="icon" />
              </div>
              <div v-else class="icon-upload-placeholder">
                <el-icon class="upload-icon"><Picture /></el-icon>
                <span style="color:black">点击此上传/替换图片</span>
              </div>
            </el-upload>
          </el-form-item>

          <!-- 名称 -->
          <el-form-item label="名称" prop="name" required>
            <el-input
              v-model="newModelForm.name"
              placeholder="请输入模型名，100个字以内"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <!-- 单位 -->
          <el-form-item label="单位" prop="unit" required>
            <el-input
              v-model="newModelForm.unit"
              placeholder="请输入模型单位"
            />
          </el-form-item>

          <!-- 符号 -->
          <el-form-item label="符号" prop="symbol" required>
            <el-input
              v-model="newModelForm.symbol"
              placeholder="请输入模型符号"
            />
          </el-form-item>

          <!-- 阈值 -->
          <el-form-item label="阈值" prop="threshold" required>
            <el-input
              v-model="newModelForm.threshold"
              placeholder="请输入正常阈值，格式：xxx,xxx"
            />
          </el-form-item>

          <!-- 简介 -->
          <el-form-item label="简介" prop="description" required>
            <el-input
              v-model="newModelForm.description"
              type="textarea"
              placeholder="请输入模型简介，200个字以内"
              maxlength="200"
              show-word-limit
              :rows="4"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button type="primary" @click="submitNewModel" :loading="submitting">{{ isEdit ? '立即修改' : '立即新增' }}</el-button>
          <el-button @click="cancelAddModel" :disabled="submitting">取消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  MoreFilled,
  Check,
  Picture,
  Edit,
  Delete,
  QuestionFilled,
  InfoFilled
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import request from '@/utils/request.js';
import { uploadFileService } from '@/api/upload.js';
import { useNotificationStore } from '@/stores/notification.js';

const notificationStore = useNotificationStore();

// 自定义图标组件
const HeartIcon = markRaw({
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
});

const HeartRateIcon = markRaw({
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
  </svg>`
});

const BMIIcon = markRaw({
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 12l4-4"/>
    <path d="M6 12a6 6 0 0 1 12 0"/>
    <text x="12" y="19" font-size="5" text-anchor="middle" font-weight="bold" fill="currentColor">BMI</text>
  </svg>`
});

const BPIcon = markRaw({
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>
    <circle cx="17.5" cy="7.5" r="4.5"/>
    <path d="m17.5 7.5 2-2"/>
  </svg>`
});

const WeightIcon = markRaw({
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 1 4 4c0 .73-.19 1.41-.53 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h2.53A4 4 0 0 1 8 7a4 4 0 0 1 4-4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>`
});

// 图标映射
const iconMap = {
  'HeartIcon': HeartIcon,
  'HeartRateIcon': HeartRateIcon,
  'BMIIcon': BMIIcon,
  'BPIcon': BPIcon,
  'BloodPressureIcon': BPIcon,
  'BloodSugarIcon': HeartIcon, // 复用
  'OxygenIcon': HeartRateIcon, // 复用
  'BodyFatIcon': BMIIcon, // 复用
  'SleepIcon': HeartIcon, // 复用
  'WeightIcon': WeightIcon
};

// 存储待上传的图标文件
const selectedIconFile = ref(null);

const router = useRouter();

// 状态
const activeTab = ref('public');
const searchQuery = ref('');
const appliedSearchQuery = ref('');
const modelCurrentPage = ref(1);
const modelPageSize = ref(9);
const selectedModelIds = ref(new Set());
const publicModels = ref([]);
const privateModels = ref([]);
const loading = ref(false);

// 新增模型抽屉状态
// 新增模型抽屉状态
const addModelDrawerVisible = ref(false);
const addModelFormRef = ref(null);
const isEdit = ref(false);
const currentEditId = ref(null);
const submitting = ref(false); // 保存模型过程中的加载状态

const newModelForm = reactive({
  icon: 'HeartIcon', // 默认图标
  iconUrl: '',
  name: '',
  unit: '',
  symbol: '',
  threshold: '',
  description: '',
  type: 1 // 默认私人模型
});

// 表单验证规则
const newModelFormRules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入模型单位', trigger: 'blur' }],
  symbol: [{ required: true, message: '请输入模型符号', trigger: 'blur' }],
  description: [{ required: true, message: '请输入模型简介', trigger: 'blur' }]
};
const formData = reactive({});

// 获取模型列表
const fetchModels = async () => {
  loading.value = true;
  try {
    const [publicRes, privateRes] = await Promise.all([
      request.get('/healthModel/public'),
      request.get('/healthModel/private')
    ]);
    
    const mapModel = m => ({
      ...m,
      icon: iconMap[m.icon] || m.icon || HeartIcon
    });

    publicModels.value = (publicRes.data || []).map(mapModel);
    privateModels.value = (privateRes.data || []).map(mapModel);
  } catch (err) {
    console.error('获取模型列表失败:', err);
    notificationStore.add('加载模型列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchModels();
});

// 计算当前显示的模型列表
const currentModels = computed(() => {
  return activeTab.value === 'public' ? publicModels.value : privateModels.value;
});

// 过滤后的模型列表
const filteredModels = computed(() => {
  if (!appliedSearchQuery.value) return currentModels.value;
  const query = appliedSearchQuery.value.toLowerCase();
  return currentModels.value.filter(model => 
    model.name.toLowerCase().includes(query) || 
    model.symbol.toLowerCase().includes(query)
  );
});

// 分页后的模型列表
const paginatedModels = computed(() => {
  const start = (modelCurrentPage.value - 1) * modelPageSize.value;
  const end = start + modelPageSize.value;
  return filteredModels.value.slice(start, end);
});

// 处理搜索
const handleSearch = () => {
  appliedSearchQuery.value = searchQuery.value;
  modelCurrentPage.value = 1; // 搜索时重置到第一页
};

// 选中的模型列表
const selectedModels = computed(() => {
  // 合并搜索所有模型以防跨 tab 选中
  const allModels = [...publicModels.value, ...privateModels.value];
  return allModels.filter(model => selectedModelIds.value.has(model.id));
});

// 判断模型是否被选中
const isModelSelected = (modelId) => {
  return selectedModelIds.value.has(modelId);
};

// 切换模型选中状态
const toggleModel = (model) => {
  if (selectedModelIds.value.has(model.id)) {
    selectedModelIds.value.delete(model.id);
    delete formData[model.id];
  } else {
    selectedModelIds.value.add(model.id);
    formData[model.id] = '';
  }
  // 触发响应式更新
  selectedModelIds.value = new Set(selectedModelIds.value);
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 处理下拉菜单命令
const handleCommand = (command, model) => {
  if (command === 'select') {
    toggleModel(model);
  } else if (command === 'edit') {
    handleEditModel(model);
  } else if (command === 'delete') {
    handleDeleteModel(model);
  }
};

// 新增模型
const handleAddModel = () => {
  isEdit.value = false;
  currentEditId.value = null;
  resetForm();
  addModelDrawerVisible.value = true;
};

// 编辑模型
const handleEditModel = (model) => {
  isEdit.value = true;
  currentEditId.value = model.id;
  
  // 填充数据
  newModelForm.name = model.name;
  newModelForm.unit = model.unit;
  newModelForm.symbol = model.symbol;
  newModelForm.threshold = model.threshold || '';
  newModelForm.description = model.description || '';
  newModelForm.type = model.type;
  newModelForm.icon = model.icon; // 如果是固定图标
  if (isImageUrl(model.icon)) {
      newModelForm.iconUrl = model.icon;
  } else {
      newModelForm.iconUrl = '';
  }
  
  addModelDrawerVisible.value = true;
};

// 重置表单逻辑提取
const resetForm = () => {
    if (addModelFormRef.value) {
        addModelFormRef.value.resetFields();
    }
    newModelForm.name = '';
    newModelForm.unit = '';
    newModelForm.symbol = '';
    newModelForm.threshold = '';
    newModelForm.description = '';
    newModelForm.iconUrl = '';
    newModelForm.icon = 'HeartIcon';
    selectedIconFile.value = null;
};

// 删除模型
const handleDeleteModel = (model) => {
  import('element-plus').then(({ ElMessageBox }) => {
    ElMessageBox.confirm(
      `确定要删除健康模型“${model.name}”吗？这将同时删除该模型下的所有历史记录。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      try {
        await request.delete(`/healthModel/delete/${model.id}`);
        notificationStore.add('模型已删除');
        fetchModels();
        // 如果被选中了，移除它
        if (selectedModelIds.value.has(model.id)) {
            toggleModel(model);
        }
      } catch (err) {
        console.error('删除模型失败:', err);
        notificationStore.add('删除失败，请重试', 'error');
      }
    }).catch(() => {});
  });
};

// 判断是否为图片 URL
const isImageUrl = (icon) => {
  return typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('data:image'));
};

// 处理图标切换
const handleIconChange = (file) => {
  selectedIconFile.value = file.raw;
  newModelForm.iconUrl = URL.createObjectURL(file.raw);
};

// 提交保存模型 (新增或更新)
const submitNewModel = async () => {
  if (!addModelFormRef.value) return;
  
  await addModelFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        let finalIcon = newModelForm.icon;
        
        // 如果选择了新图标文件，先上传
        if (selectedIconFile.value) {
          const uploadRes = await uploadFileService(selectedIconFile.value);
          if (uploadRes.code === 200 || uploadRes.code === 0 || uploadRes.data) {
            finalIcon = uploadRes.data;
          }
        }

        const payload = {
            ...newModelForm,
            icon: finalIcon,
            type: newModelForm.type
        };

        if (isEdit.value) {
            await request.put(`/healthModel/update/${currentEditId.value}`, payload);
            notificationStore.add('模型更新成功！');
        } else {
            await request.post('/healthModel/add', payload);
            notificationStore.add('模型新增成功！');
        }
        
        fetchModels();
        cancelAddModel();
      } catch (err) {
        console.error('保存模型失败:', err);
        // 如果是超时错误，给予更明确的提示
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          notificationStore.add('保存超时，请检查网络或图片大小', 'error');
        } else {
          notificationStore.add('操作失败，请重试', 'error');
        }
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 取消新增模型
const cancelAddModel = () => {
  addModelDrawerVisible.value = false;
  resetForm();
};

// 清空选中的模型
const clearSelection = () => {
  selectedModelIds.value.clear();
  selectedModelIds.value = new Set();
  Object.keys(formData).forEach(key => delete formData[key]);
};

// 提交记录
const handleSubmit = async () => {
  // 验证是否有数据
  const validRecords = selectedModels.value
    .filter(model => formData[model.id] && formData[model.id].toString().trim() !== '')
    .map(model => ({
      modelId: model.id,
      recordValue: formData[model.id].toString().trim(),
      recordDate: new Date().toISOString().split('T')[0]
    }));
  
  if (validRecords.length === 0) {
    notificationStore.add('请至少填写一个模型的数据', 'warning');
    return;
  }
  
  try {
    await request.post('/healthModel/record', validRecords);
    notificationStore.add('统计记录已提交！');
    
    // 清空表单
    clearSelection();
  } catch (err) {
    console.error('提交记录失败:', err);
    notificationStore.add('提交失败，请重试', 'error');
  }
};

// 切换 tab 时重置搜索状态
watch(activeTab, () => {
  searchQuery.value = '';
  appliedSearchQuery.value = '';
  modelCurrentPage.value = 1; // 切换 tab 重置页码
});
</script>

<style scoped>
.health-records-page {
  padding: 20px 24px;
  background-color: #fff;
  min-height: calc(100vh - 64px);
}

/* 顶部导航栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  color: #606266;
  font-size: 14px;
  padding: 8px 12px;
}

.back-btn:hover {
  color: #10b981;
}

.divider {
  color: #dcdfe6;
  font-weight: 300;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-health-text {
  font-size: 14px;
  color: #303133;
}

.record-btn {
  border: none;
  background-color: transparent;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 24px;
}

/* 左侧模型列表区域 */
.model-list-section {
  flex: 1;
  min-width: 0;
}

.tab-group-wrapper {
  display: flex;
  align-items: center;
}

.maintenance-note {
  font-size: 12px;
  color: #909399;
  margin-left: 12px;
  font-weight: 400;
  white-space: nowrap;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 表格操作列 */
.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-buttons :deep(.el-button) {
  padding: 0; /* 消除内边距，确保图标与表头文字“操作”左对齐 */
  margin: 0;
  height: auto;
}

/* 下拉菜单项布局 */
.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 24px;
  padding-bottom: 24px;
  padding-left: 4px;
}

/* 自定义分页样式，匹配图片 */
.pagination-container :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #f2f2f2 !important;
  color: #1a1a1a !important;
  font-weight: 700;
}

.pagination-container :deep(.el-pagination.is-background .el-pager li) {
  background-color: transparent;
  color: #606266;
  min-width: 32px;
  border-radius: 4px;
}

.pagination-container :deep(.el-pagination) {
  --el-pagination-button-bg-color: transparent;
  --el-pagination-hover-color: #409eff;
}

/* 新选项卡样式 (匹配图片1) */
.tab-group {
  display: inline-flex;
  padding: 4px;
  background-color: #f2f2f2;
  border-radius: 8px;
  gap: 4px;
}

.tab-btn {
  padding: 6px 20px;
  font-size: 14px;
  border: none;
  background-color: transparent;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  font-weight: 500;
}

.tab-btn:hover {
  color: #303133;
}

.tab-btn.active {
  background-color: #fff;
  color: #303133;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* 模型表格 */
.model-table-container {
  overflow-x: auto;
}

.model-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed; /* 强制列宽固定，确保严丝合缝 */
}

.model-table th {
  text-align: left;
  padding: 12px 20px; /* 统一 Padding-left 为 20px */
  color: #000000;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.model-table td {
  padding: 16px 20px; /* 统一 Padding-left 为 20px，确保与标题对齐 */
  border-bottom: 1px solid #f5f5f5;
  color: #3f4041;
  text-align: left;
}

.model-table tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-table tbody tr:hover {
  background-color: #fafafa;
}

.col-icon {
  width: 70px;
}

.col-name {
  width: 320px; /* 模型名增加宽度，平衡留白 */
}

.model-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-name-text {
  font-size: 14px;
  font-weight: 500;
}

.info-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.info-icon:hover {
  color: #303133;
}

.col-unit {
  width: 160px;
  color: #909399;
}

.col-symbol {
  width: 140px;
}

.col-action {
  width: 80px;
  text-align: left; /* 与其他列保持一致，左对齐且共享 20px padding */
}

.model-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.model-icon svg {
  width: 36px;
  height: 36px;
}

.model-icon .model-icon-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.action-btn {
  padding: 4px;
  color: #909399;
}

.action-btn:hover {
  color: #303133;
}

/* 右侧记录输入面板 */
.record-input-section {
  width: 400px;
  flex-shrink: 0;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
  min-height: 350px;
}

.empty-illustration {
  width: 160px;
  height: 120px;
  margin-bottom: 16px;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  color: #c0c4cc;
  font-size: 14px;
  margin: 0;
}

/* 表单容器 */
.record-form-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.model-icon-img {
  width: 90%;
  height: 90%;
  object-fit: contain;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-edit-btn {
  border: none;
  background-color: transparent;
  color: #303133;
}

.form-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.source-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
}

.help-icon {
  color: #909399;
  font-size: 14px;
  cursor: help;
}

.field-input {
  width: 100%;
}

.field-input :deep(.el-input__wrapper) {
  border-radius: 6px;
  padding: 8px 12px;
}

.field-input :deep(.el-input__inner) {
  font-size: 14px;
}

.field-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
}

.form-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
  background-color: #303133;
  border-color: #303133;
}

.submit-btn:hover {
  background-color: #1a1a1a;
  border-color: #1a1a1a;
}

/* 新增模型抽屉样式 */
.add-model-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.add-model-drawer :deep(.el-drawer__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.add-model-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.drawer-content {
  padding: 24px;
}

.add-model-form :deep(.el-form-item__label) {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 14px;
  height: 40px; /* 匹配默认输入框高度 */
  display: flex;
  align-items: center;
}

/* 针对非必填项（图标）添加左侧内边距，以对齐由于带星号产生的位移 */
.add-model-form :deep(.el-form-item:not(.is-required) .el-form-item__label) {
  padding-left: 12px;
}

.add-model-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

/* 图标上传样式 */
.icon-uploader {
  width: 100%;
}

.icon-uploader :deep(.el-upload) {
  width: 100%;
  display: block;
}

.icon-upload-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  height: 40px; /* 匹配默认输入框高度 */
  width: 100%;
}

.add-model-form :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  line-height: normal;
}

.icon-upload-placeholder:hover {
  color: #409eff;
}

.upload-icon {
  font-size: 20px;
}

.icon-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 抽屉底部按钮 */
.drawer-footer {
  display: flex;
  gap: 12px;
}

.drawer-footer .el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.drawer-footer .el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>
