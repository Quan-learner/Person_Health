<template>
  <el-dialog
    v-model="visible"
    title="个人中心"
    width="510px"
    class="profile-dialog"
    :show-close="false"
    align-center
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
                <el-avatar :size="120" :src="formData.userPic || defaultAvatar" class="main-avatar" />
              </div>
            </div>
          </div>

          <el-form :model="formData" label-position="top">
            <el-form-item>
              <template #label>
                <div class="label-with-note">
                  <span>*用户账号</span>
                  <span class="note-text">(不可修改)</span>
                </div>
              </template>
              <el-input v-model="formData.username" disabled class="custom-input disabled-field" />
            </el-form-item>
            <el-form-item label="*用户名">
              <el-input 
                v-model="formData.name" 
                placeholder="请输入用户名" 
                clearable 
                class="custom-input"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- Tab 2: 基本信息 -->
        <div v-show="activeTab === 'basic'" class="tab-content">
          <el-form ref="basicFormRef" :model="formData" :rules="formRules" label-position="top">
            <el-form-item label="用户性别">
              <div class="gender-selector">
                <div 
                  :class="['gender-btn', { active: formData.gender === '女' }]" 
                  @click="formData.gender = '女'"
                >女</div>
                <div 
                  :class="['gender-btn', { active: formData.gender === '男' }]" 
                  @click="formData.gender = '男'"
                >男</div>
              </div>
            </el-form-item>
            <el-form-item label="电子邮件" prop="email">
              <el-input v-model="formData.email" placeholder="请输入" clearable class="custom-input" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入" clearable class="custom-input" />
            </el-form-item>
            <el-form-item label="出生年月">
              <el-date-picker
                v-model="formData.birthday"
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

        <!-- Tab 3: 修改密码 -->
        <div v-show="activeTab === 'security'" class="tab-content">
          <el-form ref="pwdFormRef" :model="pwdData" :rules="formRules" label-position="top">
            <el-form-item label="原密码" prop="old_pwd">
              <el-input v-model="pwdData.old_pwd" type="password" placeholder="请输入原密码" show-password class="custom-input" />
            </el-form-item>
            <el-form-item label="新密码" prop="new_pwd">
              <el-input v-model="pwdData.new_pwd" type="password" placeholder="请输入新密码" show-password class="custom-input" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="re_pwd">
              <el-input v-model="pwdData.re_pwd" type="password" placeholder="请再次输入新密码" show-password class="custom-input" />
            </el-form-item>
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
          :class="['tab-item', { active: activeTab === 'security' }]" 
          @click="activeTab = 'security'"
        >修改密码</div>
      </div>
    </div>

    <!-- 弹窗底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="handleSave" class="save-btn" :loading="saving">确定修改</el-button>
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
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { Camera } from '@element-plus/icons-vue';
import { ElLoading, ElMessage } from 'element-plus';
import request from '@/utils/request';
import { getUserInfoService, updateUserInfoService, updateUserPicService, updatePwdService } from '@/api/user.js';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue', 'refresh']);

const visible = ref(false);
const activeTab = ref('core');
const saving = ref(false);
const fileInput = ref(null);
const basicFormRef = ref(null);
const pwdFormRef = ref(null);
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';

const formData = reactive({
  id: null,
  username: '',
  name: '',
  userPic: '',
  email: '',
  phone: '',
  gender: '男',
  birthday: ''
});

const pwdData = reactive({
  old_pwd: '',
  new_pwd: '',
  re_pwd: ''
});

// 表单验证规则
const formRules = {
  email: [
    { 
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
      message: '请输入正确的邮箱格式', 
      trigger: 'blur' 
    }
  ],
  phone: [
    { 
      pattern: /^1[3-9]\d{9}$/, 
      message: '请输入正确的手机号码', 
      trigger: 'blur' 
    }
  ],
  old_pwd: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' }
  ],
  new_pwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 5, max: 16, message: '密码长度在 5 到 16 个字符', trigger: 'blur' }
  ],
  re_pwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdData.new_pwd) {
          callback(new Error('两次输入密码不一致!'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    fetchUserInfo();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const fetchUserInfo = async () => {
  try {
    const res = await getUserInfoService();
    console.log('getUserInfoService response:', res);
    if ((res.code === 200 || res.code === 0) && res.data) {
      Object.assign(formData, res.data);
      // 后端 LocalDate 返回可能需要简单处理
      if (formData.birthday && Array.isArray(formData.birthday)) {
        // 如果后端返回的是数组 [2024, 1, 1]
        const [y, m, d] = formData.birthday;
        formData.birthday = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

const triggerUpload = () => {
  fileInput.value.click();
};

const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 这里应该调用后端的上传接口，暂时模拟
  const loading = ElLoading.service({ text: '上传中...' });
  try {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    // 使用项目统一的 request 实例，确保携带 Token 并走业务拦截器
    const res = await request.post('/upload', formDataUpload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // request.js 拦截器会返回 result.data，即后端的 Result 对象
    // Result.success(url) 返回的结构是 { code: 200, data: "url..." }
    if (res && res.data) {
      formData.userPic = res.data; 
      ElMessage.success('上传成功');
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error('上传失败');
  } finally {
    loading.close();
  }
};

const handleSave = async () => {
  if (activeTab.value === 'security') {
    await handleUpdatePwd();
    return;
  }
  
  saving.value = true;
  try {
    // 如果头像有更新，先调用单独的头像更新 API
    if (formData.userPic && formData.userPic.startsWith('http')) {
      await updateUserPicService(formData.userPic);
    }
    
    const res = await updateUserInfoService(formData);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('信息更新成功');
      visible.value = false;
      emit('refresh');
    }
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    saving.value = false;
  }
};

const handleUpdatePwd = async () => {
  if (!pwdFormRef.value) return;
  
  try {
    await pwdFormRef.value.validate();
    saving.value = true;
    const res = await updatePwdService(pwdData);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('密码修改成功，请重新登录');
      visible.value = false;
      // 修改密码后后端会删除 token，前端跳转到登录页
      location.reload(); 
    }
  } catch (error) {
    console.error('修改密码验证失败或请求失败:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
:deep(.el-dialog.profile-dialog) {
  --el-dialog-border-radius: 12px !important;
  border-radius: var(--el-dialog-border-radius) !important;
  overflow: hidden !important;
}

:deep(.profile-dialog .el-dialog__header) {
  padding: 20px 24px 20px;
  margin-right: 0;
}

:deep(.profile-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.dialog-body {
  display: flex;
  min-height: 420px;
  padding: 0 0px ;
}

.form-container {
  flex: 1;
  padding-right: 10px;
  padding-top: 20px;
}

.tab-sidebar {
  width: 100px;
  border-left: 3px solid #e7e8ea;
  display: flex;
  flex-direction: column;
  padding-left: 0;
}

.tab-item {
  padding: 10px 12px;
  font-size: 15px;
  color: #101010;
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
  left: -3px;
  top: 10%;
  height: 80%;
  width: 3px;
  background-color: #409eff;
  border-radius: 0 2px 2px 0;
}

/* 核心信息样式 */
.avatar-upload-section {
  text-align: center;
  margin-bottom: 58px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-tip {
  font-size: 13px;
  color: #787878;
  margin-bottom: 12px;
}

.avatar-wrapper {
  display: inline-block;
  cursor: pointer;
}

.main-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.avatar-area {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
}

.camera-icon-btn {
  position: absolute;
  left: 0;
  bottom: -40px;
  width: 44px;
  height: 44px;
  background-color: #e8f3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003a70;
  cursor: pointer;
  transition: background-color 0.3s;
}

.camera-icon-btn:hover {
  background-color: #d1e9ff;
}

/* 性别选择器 */
.gender-selector {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 4px;
  width: 180px;
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
}

.gender-btn.active {
  background-color: #fff;
  color: #333;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

/* 表单输入框统一样式 */
.custom-input :deep(.el-input__wrapper) {
  background-color: #ffffff !important;
  box-shadow: none !important;
  border: 1px solid #403f3f24;
  border-radius: 5px;
  padding: 4px 12px;
  transition: all 0.3s;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1) !important;
}

/* 禁用状态（用户账号）独立样式 */
.disabled-field :deep(.el-input__wrapper) {
  background-color: #f5f7fa !important;
  border-color: #e4e7ed !important;
  cursor: not-allowed;
}

.disabled-field :deep(.el-input__inner) {
  color: #909399 !important;
  cursor: not-allowed;
}

.label-with-note {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-text {
  font-size: 12px;
  color: #a8abb2;
  font-weight: normal;
}

:deep(.el-form-item__label) {
  font-size: 14.5px;
  font-weight: 400;
  color: #303133;
  padding-bottom: 0px !important;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

.custom-date-picker :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1) !important;
}

.dialog-footer {
  padding: 0px 10px ;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.save-btn {
  border-radius: 6px;
  background-color: #409eff;
  font-size: 13px;
  font-weight: 500;
}

.cancel-btn {
  padding: 8px 20px;
  border-radius: 6px;
  background-color: #fff;
  color: #606266;
  font-size: 13px;
  border: 1px solid #dcdfe6;
}
</style>

<style>
/* 全局样式：确保被 teleport 到 body 的弹窗能应用圆角 */
.el-dialog.profile-dialog {
  border-radius: 12px !important;
  overflow: hidden !important;
}
</style>
