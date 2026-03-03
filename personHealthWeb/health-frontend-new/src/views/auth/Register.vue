<template>
  <div class="login-container">
    <div class="login-box glass-effect">
      <div class="login-header">
        <div class="logo-icon"><el-icon><EditPen /></el-icon></div>
        <h2>注册新账号</h2>
        <p class="sub-title">加入康健未来，开启健康生活</p>
      </div>

      <el-form :model="regForm" :rules="rules" ref="regFormRef" size="large">
        
        <el-form-item prop="username">
          <el-input v-model="regForm.username" placeholder="设置用户名" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="regForm.password" type="password" placeholder="设置密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <el-form-item prop="confirmPass">
          <el-input v-model="regForm.confirmPass" type="password" placeholder="确认密码" prefix-icon="Check" show-password />
        </el-form-item>

        <div class="form-options">
           <span></span> <span class="link-btn" @click="$emit('switch-view', 'login')">
             已有账号？去登录
           </span>
        </div>

        <el-form-item>
          <el-button type="success" class="login-btn" @click="handleRegister" round>
            立即注册
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useNotificationStore } from '@/stores/notification.js'

const emit = defineEmits(['switch-view'])
const regFormRef = ref(null)
const notificationStore = useNotificationStore()

const regForm = reactive({
  username: '',
  password: '',
  confirmPass: ''
})

// 验证两次密码是否一致
const validatePass2 = (rule, value, callback) => {
  if (value !== regForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPass: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const handleRegister = () => {
  regFormRef.value.validate((valid) => {
    if(valid) {
      notificationStore.add('注册成功，请登录！')
      // 注册成功后，自动跳回登录页
      emit('switch-view', 'login')
    }
  })
}
</script>

<style scoped>
/* 直接复用 Login.vue 的样式，为了节省篇幅，这里用了同样的类名 */
/* 建议：实际开发中可以把公共样式提取到单独的 css 文件中 */
.login-container {
  display: flex; justify-content: center; align-items: center; height: 100vh;
  background-image: url(src/assets/sarah-dorweiler-x2Tmfd1-SgA-unsplash.jpg);
  background-size: cover; background-position: center;
}
.login-box {
  width: 380px; padding: 30px; border-radius: 16px;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.5s ease-out;
}
.login-header { text-align: center; margin-bottom: 25px; }
.logo-icon { font-size: 40px; color: #67C23A; margin-bottom: 10px; } /* 注册页用绿色 */
.login-header h2 { margin: 0; color: #2c3e50; }
.sub-title { margin: 8px 0 0; color: #606266; font-size: 13px; }

/* 极简输入框复用 */
:deep(.el-input__wrapper) {
  background-color: transparent !important; box-shadow: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1); border-radius: 0;
  padding-left: 0; padding-bottom: 5px; transition: all 0.3s ease;
}
:deep(.el-input__wrapper.is-focus) { border-bottom: 1px solid #67C23A; } /* 注册页用绿色线条 */
:deep(.el-input__inner) { font-size: 16px; height: 40px; color: #333; }

.form-options { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
.link-btn { color: #409EFF; cursor: pointer; transition: color 0.2s; }
.link-btn:hover { text-decoration: underline; }

.login-btn {
  width: 100%; background: linear-gradient(90deg, #67C23A 0%, #a8eb12 100%); /* 绿色按钮 */
  border: none; font-weight: bold; font-size: 16px; color: white;
}
.login-btn:hover { opacity: 0.9; transform: scale(1.02); }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>