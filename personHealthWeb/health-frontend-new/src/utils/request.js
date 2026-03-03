import axios from 'axios';
import { useTokenStore } from "@/stores/token.js";
import { useNotificationStore } from "@/stores/notification.js";
import router from "@/router/index.js";

// 1. 基础配置
const baseURL = '/api'; // 提醒：配合 Vite 的 proxy 使用，防止跨域
const instance = axios.create({
    baseURL,
    timeout: 30000 // 增加到 30 秒，处理文件上传或后端响应慢的情况
})

// 2. 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const tokenStore = useTokenStore();
        // 如果 Pinia 中有 token，则放入请求头
        if (tokenStore.token) {
            // 注意：这里的名字必须和后端 request.getHeader("Authorization") 完全一致
            config.headers.Authorization = tokenStore.token;
        }
        return config;
    },
    (err) => {
        return Promise.reject(err); // 必须 return
    }
)

// 3. 响应拦截器
instance.interceptors.response.use(
    (result) => {
        const notificationStore = useNotificationStore();
        // 判断业务状态码。注意：这里要看你后端 Result 类定义的成功码是多少
        // 如果后端成功是 200，这里就改 200
        if (result.data.code === 200 || result.data.code === 0) {
            return result.data; // 直接返回后端的 Result 对象
        }

        // 业务失败处理（如账号密码错误）
        notificationStore.add(result.data.message || '服务异常', 'error');
        return Promise.reject(result.data);
    },
    (err) => {
        const notificationStore = useNotificationStore();
        // HTTP 状态码错误处理
        if (err.response && err.response.status === 401) {
            notificationStore.add("身份过期，请重新登录", 'error');
            const tokenStore = useTokenStore();
            tokenStore.removeToken(); // 清除过期的 token
            router.push('/login');
        } else {
            notificationStore.add(err.response?.data?.message || "网络繁忙，请稍后再试", 'error');
        }
        return Promise.reject(err);
    }
)

export default instance;