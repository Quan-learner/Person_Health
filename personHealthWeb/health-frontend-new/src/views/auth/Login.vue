<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notification.js';
// 1. 导入你代码中用到的图标
import { User, Lock, EditPen, Odometer, Check } from '@element-plus/icons-vue'; 
import { loginService, registerService } from '@/api/auth.js'; 
import { useTokenStore } from '@/stores/token.js';
import { useUserStore } from '@/stores/user.js';

const router = useRouter();
const tokenStore = useTokenStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();

// --- 状态控制 ---
const isRegister = ref(false); 
const isLoading = ref(false); 
const rememberMe = ref(false); 

// --- 动态样式计算 ---
// 根据模式切换背景图
const bgImage = computed(() => {
  const imgName = isRegister.value 
    ? 'sarah-dorweiler-x2Tmfd1-SgA-unsplash.jpg' 
    : 'jeremy-thomas-FO7bKvgETgQ-unsplash.jpg';
  return new URL(`../../assets/${imgName}`, import.meta.url).href;
});

// 根据模式切换主题色（蓝色 vs 绿色）
const themeColor = computed(() => isRegister.value ? '#67C23A' : '#409EFF');

// --- 表单数据 ---
const authForm = reactive({
    username: '',
    password: '',
    repassword: '', // 对应你代码里的 confirmPass
    role: 'user' 
});

// --- 校验规则 ---
const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    repassword: [
        { required: true, message: '请再次确认密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (isRegister.value && value !== authForm.password) {
                    callback(new Error('两次输入密码不一致!'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ]
};

const loginFormRef = ref(null);

const handleAuth = async () => {
    // ... 前面的校验代码 ...

    try {
        const res = await loginService(authForm);
        console.log("拦截器处理后的结果:", res);

        // 核心修正：注意 res.code 和 res.data.role 的层级
        if (res.code === 0 || res.code === 200) {
            // 1. 存储数据
            tokenStore.setToken(res.data.token);
            userStore.setRole(res.data.role);
            // 存储完整的用户信息
            userStore.setUserInfo(res.data);

            // 2. 获取角色并进行跳转判断
            const role = res.data.role; 
            console.log("准备根据角色跳转，当前角色是:", role);

            if (role === 'admin') {
                console.log("匹配到管理员，正在跳转...");
                router.push('/admin/dashboard');
            } else if (role === 'user') {
                console.log("匹配到普通用户，正在跳转...");
                router.push('/user/home');
            } else {
                console.error("未知的角色类型:", role);
                notificationStore.add("身份校验异常，请联系管理员", 'error');
            }

            notificationStore.add('登录成功');
        } else {
            notificationStore.add(res.message || '登录失败', 'error');
        }
    } catch (err) {
        console.error("登录过程发生错误:", err);
    } finally {
        isLoading.value = false;
    }
};

const switchMode = (mode) => {
    isRegister.value = mode;
    loginFormRef.value.resetFields();
};
</script>

<template>
  <div class="login-container" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="login-box" :class="{ 'reg-mode': isRegister }">
      
      <div class="login-header">
        <div class="logo-icon">
            <el-icon :style="{ color: themeColor }">
                <component :is="isRegister ? EditPen : Odometer" />
            </el-icon>
        </div>
        <h2>{{ isRegister ? '注册新账号' : '康健未来' }}</h2>
        <p class="sub-title">{{ isRegister ? '加入康健未来，开启健康生活' : '您的个人健康管理专家' }}</p>
      </div>

      <el-form ref="loginFormRef" :model="authForm" :rules="rules" class="login-form" size="large">
        
        <el-form-item v-if="!isRegister" class="role-item">
          <el-radio-group v-model="authForm.role" class="role-group">
            <el-radio-button label="user">普通用户</el-radio-button>
            <el-radio-button label="admin">管理员</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="username" class="form-item">
          <el-input v-model="authForm.username" :placeholder="isRegister ? '设置用户名' : '请输入用户名'" :prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password" class="form-item">
          <el-input v-model="authForm.password" type="password" :placeholder="isRegister ? '设置密码' : '请输入密码'" :prefix-icon="Lock" show-password />
        </el-form-item>

        <el-form-item prop="repassword" v-if="isRegister" class="form-item">
          <el-input v-model="authForm.repassword" type="password" placeholder="确认密码" :prefix-icon="Check" show-password />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-if="!isRegister" v-model="rememberMe">记住我</el-checkbox>
          <div v-else></div> 
          <span class="link-btn" @click="switchMode(!isRegister)">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </span>
        </div>

        <el-form-item>
          <el-button 
            :type="isRegister ? 'success' : 'primary'" 
            :loading="isLoading" 
            class="submit-btn" 
            @click="handleAuth" 
            round
          >
            {{ isRegister ? '立即注册' : '立即登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex; justify-content: center; align-items: center; height: 100vh;
  background-size: cover; background-position: center;
}

.login-box {
  width: 390px; padding: 35px; border-radius: 20px;
  background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.login-header { text-align: center; margin-bottom: 25px; }
.logo-icon { font-size: 44px; margin-bottom: 10px; transition: color 0.3s; }
.login-header h2 { margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600; }
.sub-title { margin: 6px 0 0; color: #7f8c8d; font-size: 13px; }

/* 角色选择样式 */
.role-group { width: 100%; display: flex; justify-content: center; }
:deep(.el-radio-button) { flex: 1; margin: 0 10px; }
:deep(.el-radio-button__inner) { width: 100%; border-radius: 20px !important; border: 1px solid #dcdfe6 !important; background: transparent; }

/* 输入框间距 */
.form-item { margin-bottom: 22px !important; }
.role-item { margin-bottom: 25px !important; }

/* 极简底线风格输入框 */
:deep(.el-input__wrapper) {
  background-color: transparent !important; box-shadow: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 0; padding: 4px 0 !important;
}

/* 关键：如果是注册模式，焦点颜色变为绿色 */
.reg-mode :deep(.el-input__wrapper.is-focus) { border-bottom: 1px solid #67C23A !important; }
.reg-mode :deep(.el-input__prefix-icon) { color: #67C23A !important; }

/* 非注册模式（登录）维持蓝色 */
:deep(.el-input__wrapper.is-focus) { border-bottom: 1px solid #409EFF !important; }

.form-options { display: flex; justify-content: space-between; align-items: center; margin: 15px 0 25px; font-size: 13px; }
.link-btn { color: #409EFF; cursor: pointer; transition: color 0.2s; }
.link-btn:hover { text-decoration: underline; }

/* 提交按钮：高大尚渐变 */
.submit-btn { width: 100%; height: 46px; border: none; font-weight: bold; font-size: 16px; letter-spacing: 2px; }
/* 登录模式蓝色渐变 */
.el-button--primary { background: linear-gradient(90deg, #409EFF 0%, #36d1dc 100%); }
/* 注册模式绿色渐变 - 匹配你的代码 */
.el-button--success { background: linear-gradient(90deg, #67C23A 0%, #a8eb12 100%); }
</style>