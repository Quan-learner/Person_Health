import request from '@/utils/request';

// 获取用户信息
export const getUserInfoService = () => {
    return request.get('/user/userInfo');
};

// 更新用户信息
export const updateUserInfoService = (data) => {
    return request.put('/user/update', data);
};

// 更新用户头像
export const updateUserPicService = (userPic) => {
    return request.patch('/user/userPic', null, { params: { userPic } });
};

// 修改密码
export const updatePwdService = (pwdData) => {
    return request.patch('/user/updatePwd', pwdData);
};
