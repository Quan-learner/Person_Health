import request from '@/utils/request';

// 1. 导出登录接口
export const loginService = (data) => {
    return request.post('/user/login', data);
};

// 2. 导出注册接口 [这就是你漏掉或者名字写错的地方]
export const registerService = (data) => {
    return request.post('/user/register', data);
};