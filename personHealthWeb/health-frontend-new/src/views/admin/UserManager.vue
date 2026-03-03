<template>
  <div class="user-manager-container">
    <!-- User Table Card -->
    <el-card shadow="never" class="table-card">
      <div class="card-header-actions">
        <div class="left-filters">
          <div class="custom-tab-group">
            <button 
              v-for="tab in roleTabs" 
              :key="tab.value"
              :class="['tab-btn', { active: roleFilter === tab.value }]"
              @click="roleFilter = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="right-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户"
            class="search-input"
            clearable
            @keyup.enter="fetchUsers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" class="add-btn" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </div>
      
      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="32" :src="row.userPic || defaultAvatar" />
              <span class="nickname">{{ row.name || row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="email" label="邮件" min-width="180" show-overflow-tooltip>
           <template #default="{ row }">
            {{ row.email || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="140">
           <template #default="{ row }">
            {{ row.phone || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="birthday" label="出生年月" min-width="120">
          <template #default="{ row }">
            {{ row.birthday || '--' }}
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

      <!-- Pagination -->
      <div class="pagination-container">
        <span class="total-text">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, sizes, jumper"
          :total="total"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 精准重塑后的弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '修改信息' : '新增用户'"
      width="510px"
      align-center
      destroy-on-close
      class="profile-dialog"
    >
      <div class="dialog-body">
        <!-- 左侧表单内容 -->
        <div class="form-container">
          
          <!-- Tab 1: 核心信息 -->
          <div v-show="activeTab === 'core'" class="tab-content">
            <div class="avatar-upload-section">
              <p class="upload-tip">点击 <el-icon><Camera /></el-icon> 处即可上传头像</p>
              <div class="avatar-area">
                <div class="camera-icon-btn" @click="triggerUpload">
                  <el-icon :size="18"><Camera /></el-icon>
                </div>
                <div class="avatar-wrapper" @click="triggerUpload">
                  <el-avatar :size="120" :src="userForm.userPic || defaultAvatar" class="main-avatar" />
                </div>
              </div>
            </div>

            <el-form ref="userFormRef" :model="userForm" :rules="rules" label-position="top">
              <el-form-item prop="username">
                <template #label>
                  <span class="custom-label">*用户账号</span>
                </template>
                <el-input v-model="userForm.username" placeholder="请输入账号" :disabled="isEdit" class="custom-input disabled-field" />
              </el-form-item>
              
              <el-form-item prop="name">
                <template #label>
                  <span class="custom-label">*用户名</span>
                </template>
                <el-input v-model="userForm.name" placeholder="请输入用户名" class="custom-input" clearable />
              </el-form-item>

              <el-form-item label="登录密码" prop="password" v-if="!isEdit">
                <template #label>
                  <span class="custom-label">*登录密码</span>
                </template>
                <el-input v-model="userForm.password" type="password" placeholder="请输入临时密码" show-password class="custom-input" />
              </el-form-item>
            </el-form>
          </div>

          <!-- Tab 2: 基本信息 -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <el-form :model="userForm" :rules="rules" label-position="top">
              <el-form-item label="用户角色" class="compact-item">
                <el-select v-model="userForm.role" style="width: 100%" class="custom-input">
                  <el-option label="管理员" value="admin" />
                  <el-option label="普通用户" value="user" />
                </el-select>
              </el-form-item>
              <el-form-item label="用户性别">
                <div class="gender-selector">
                  <div 
                    :class="['gender-btn', { active: userForm.gender === '女' }]" 
                    @click="userForm.gender = '女'"
                  >女</div>
                  <div 
                    :class="['gender-btn', { active: userForm.gender === '男' }]" 
                    @click="userForm.gender = '男'"
                  >男</div>
                </div>
              </el-form-item>
              <el-form-item prop="email">
                <template #label>
                  <span class="custom-label">电子邮件</span>
                </template>
                <el-input v-model="userForm.email" placeholder="请输入" clearable class="custom-input" />
              </el-form-item>
              <el-form-item prop="phone">
                <template #label>
                  <span class="custom-label">联系电话</span>
                </template>
                <el-input v-model="userForm.phone" placeholder="请输入" clearable class="custom-input" />
              </el-form-item>
              <el-form-item label="出生年月">
                <el-date-picker
                  v-model="userForm.birthday"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="custom-date-picker"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- Tab 3: 重置密码 (仅编辑模式显示) -->
          <div v-show="activeTab === 'security'" class="tab-content">
            <el-form ref="resetPwdFormRef" :model="resetPwdData" :rules="rules" label-position="top">
              <el-form-item label="新密码" prop="password">
                <template #label>
                  <span class="custom-label">设置新密码</span>
                </template>
                <el-input v-model="resetPwdData.password" type="password" placeholder="请输入新密码" show-password class="custom-input" />
              </el-form-item>
              <p class="security-tip">注：重置后用户需使用新密码登录</p>
            </el-form>
          </div>
        </div>

        <!-- 右侧 Tab 导航 -->
        <div class="tab-sidebar">
          <div 
            :class="['tab-item', { active: activeTab === 'core' }]" 
            @click="activeTab = 'core'"
          >核心信息</div>
          <div 
            :class="['tab-item', { active: activeTab === 'basic' }]" 
            @click="activeTab = 'basic'"
          >基本信息</div>
          <div 
            v-if="isEdit"
            :class="['tab-item', { active: activeTab === 'security' }]" 
            @click="activeTab = 'security'"
          >修改密码</div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="save-btn">确定修改</el-button>
        </div>
      </template>

      <!-- 隐藏的上传 input -->
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept="image/*" 
        @change="onFileChange"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.js';
import { useTokenStore } from '@/stores/token.js';
import request from '@/utils/request.js';
import {
  Search,
  Plus,
  MoreFilled,
  Edit,
  Delete,
  User,
  Odometer,
  Camera
} from '@element-plus/icons-vue';
import { ElLoading, ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const tokenStore = useTokenStore();

const userFormRef = ref(null);
const resetPwdFormRef = ref(null);
const fileInput = ref(null);
const activeTab = ref('core');

// List Data
const userList = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const roleFilter = ref('all');
const searchQuery = ref('');
const loading = ref(false);

const roleTabs = [
  { label: '全部', value: 'all' },
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
];

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// Dialog Data
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const userForm = ref({
  username: '',
  name: '',
  userPic: '',
  password: '',
  role: 'user',
  gender: '男',
  email: '',
  phone: '',
  birthday: ''
});

const resetPwdData = ref({
  password: ''
});

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 5, max: 16, message: '长度在 5 到 16 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 5, max: 16, message: '长度在 5 到 16 个字符', trigger: 'blur' }
  ]
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      query: searchQuery.value || undefined
    };
    if (roleFilter.value !== 'all') {
      params.role = roleFilter.value;
    }
    
    const res = await request.get('/admin/user/list', { params });
    if (res.code === 200 || res.code === 0) {
      userList.value = res.data.records;
      total.value = res.data.total;
    }
  } catch (err) {
    console.error('获取用户列表失败:', err);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  userForm.value = {
    username: '',
    name: '',
    userPic: '',
    password: '',
    role: 'user',
    gender: '男',
    email: '',
    phone: '',
    birthday: ''
  };
  resetPwdData.value.password = '';
  activeTab.value = 'core';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  userForm.value = { ...row };
  resetPwdData.value.password = '';
  activeTab.value = 'core';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (activeTab.value === 'security') {
    handleResetPassword();
    return;
  }

  if (!userFormRef.value) return;
  
  try {
    await userFormRef.value.validate();
    submitLoading.value = true;
    
    const url = isEdit.value ? '/admin/user/update' : '/admin/user/add';
    const method = isEdit.value ? 'put' : 'post';
    
    const res = await request[method](url, userForm.value);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '新增成功');
      dialogVisible.value = false;
      fetchUsers();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (err) {
    console.error('表单校验失败:', err);
  } finally {
    submitLoading.value = false;
  }
};

const handleResetPassword = async () => {
  if (!resetPwdFormRef.value) return;
  try {
    await resetPwdFormRef.value.validate();
    submitLoading.value = true;
    
    const res = await request.put('/admin/user/resetPassword', null, {
      params: {
        id: userForm.value.id,
        password: resetPwdData.value.password
      }
    });
    
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('密码重置成功');
      dialogVisible.value = false;
    } else {
      ElMessage.error(res.message || '重置失败');
    }
  } catch (err) {
    console.error('校验失败:', err);
  } finally {
    submitLoading.value = false;
  }
};

const triggerUpload = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const loading = ElLoading.service({ text: '上传中...' });
  try {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    
    // 上传图片到后端
    const res = await request.post('/upload', uploadForm, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (res && (res.code === 200 || res.code === 0)) {
      userForm.value.userPic = res.data; 
      ElMessage.success('头像上传成功');
    } else {
      ElMessage.error(res.message || '上传失败');
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error('头像上传失败，请检查网络或文件格式');
  } finally {
    loading.close();
    event.target.value = '';
  }
};

const handleDelete = async (row) => {
  try {
    if (confirm(`确定要删除用户 ${row.username} 吗？`)) {
      const res = await request.delete(`/admin/user/${row.id}`);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('删除成功');
        fetchUsers();
      }
    }
  } catch (err) {
    console.error('删除用户失败:', err);
  }
};

watch(roleFilter, () => {
  pageNum.value = 1;
  fetchUsers();
});

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-manager-container {
  padding: 0;
}

/* Custom Tab Styling matching dashboard */
.custom-tab-group {
  display: inline-flex;
  background-color: #e5e7eb;
  padding: 3px;
  border-radius: 10px;
  gap: 3px;
}

.tab-btn {
  padding: 5px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn.active {
  background-color: #ffffff;
  color: #111827;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 250px;
}

:deep(.el-input__wrapper) {
  height: 36px;
  border-radius: 10px;
  background-color: #f3f4f6;
  box-shadow: none !important;
  border: 1px solid transparent;
}

:deep(.el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #10b981;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

.add-btn {
  height: 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  font-weight: 500;
}

.page-container {
  padding: 24px;
}

.table-card {
  border-radius: 16px;
  border: 1px solid #f0f0f0;
}

.card-header-actions {
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-filters {
  display: flex;
  align-items: center;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nickname {
  font-weight: 500;
  color: #1f2937;
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

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.total-text {
  font-size: 14px;
  color: #6b7280;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: #f3f4f6;
  --el-pagination-hover-color: #10b981;
}

:deep(.el-pagination .is-active) {
  background-color: #10b981 !important;
  color: #ffffff !important;
}

/* Dialog Styling (Reuse Profile Dialog Style) */
:deep(.el-dialog.profile-dialog) {
  --el-dialog-border-radius: 12px !important;
  border-radius: var(--el-dialog-border-radius) !important;
  overflow: hidden !important;
}

:deep(.profile-dialog .el-dialog__header) {
  padding: 24px 24px 10px;
  margin-right: 0;
}

:deep(.profile-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.dialog-body {
  display: flex;
  min-height: 480px;
  padding: 0;
}

.form-container {
  flex: 1;
  padding: 20px 30px;
}

.tab-sidebar {
  width: 110px;
  border-left: 1px solid #eef0f2;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}

.tab-item {
  padding: 12px 20px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-item.active {
  color: #409eff;
  font-weight: 500;
}

.tab-item.active::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 0;
  height: 100%;
  width: 2px;
  background-color: #409eff;
}

/* Avatar Section Sync */
.avatar-upload-section {
  text-align: center;
  margin-bottom: 25px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.avatar-area {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 200px;
}

.avatar-wrapper {
  display: inline-block;
  cursor: pointer;
  z-index: 1;
}

.main-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.camera-icon-btn {
  position: absolute;
  left: 0; /* Align to left of avatar area as per image */
  bottom: 20px;
  width: 36px;
  height: 36px;
  background-color: #e8f3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003a70;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
}

.camera-icon-btn:hover {
  background-color: #d1e9ff;
}

/* Gender Selector Sync */
.gender-selector {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 3px;
  width: 140px;
}

.gender-btn {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
  color: #606266;
  font-size: 13px;
}

.gender-btn.active {
  background-color: #fff;
  color: #333;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

/* Input Styles Sync */
.custom-input :deep(.el-input__wrapper), 
.custom-input :deep(.el-select .el-input__wrapper) {
  height: 38px;
  background-color: #ffffff !important;
  box-shadow: none !important;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 0 12px;
}

.disabled-field :deep(.el-input__wrapper) {
  background-color: #f5f7fa !important;
  border-color: #e4e7ed !important;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff !important;
}

.custom-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: inline-block;
  margin-bottom: 2px;
}

.security-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

:deep(.el-form-item__label) {
  padding: 0 !important;
  line-height: 24px !important;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

.dialog-footer {
  padding: 10px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.save-btn {
  height: 38px;
  padding: 0 24px;
  border-radius: 4px;
  background-color: #409eff;
  border-color: #409eff;
  font-weight: 500;
}

.cancel-btn {
  height: 38px;
  padding: 0 24px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  color: #606266;
  background-color: #fff;
}

.cancel-btn:hover {
  background-color: #f5f7fa;
  color: #409eff;
  border-color: #c6e2ff;
}
</style>

<style>
/* Global style to ensure consistent border-radius on teleported dialogs */
.el-dialog.profile-dialog {
  border-radius: 12px !important;
}
</style>
