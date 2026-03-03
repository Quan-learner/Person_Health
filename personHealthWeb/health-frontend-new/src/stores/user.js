import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 存储用户角色：'admin' 或 'user'
  const role = ref(localStorage.getItem('userRole') || '')
  // 存储详细用户信息
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || {})

  // 设置角色（登录成功后调用）
  const setRole = (newRole) => {
    role.value = newRole
    localStorage.setItem('userRole', newRole)
  }

  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  // 退出登录时清除
  const clearUserInfo = () => {
    role.value = ''
    userInfo.value = {}
    localStorage.removeItem('userRole')
    localStorage.removeItem('userInfo')
  }

  return { role, userInfo, setRole, setUserInfo, clearUserInfo }
})