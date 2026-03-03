import request from '@/utils/request';

// 根据ID和模块获取评论列表
export const getCommentByPortIdService = (params) => {
    return request.get('/comment/getCommentByPortId', { params });
};

// 添加评论
export const addCommentService = (data) => {
    return request.post('/comment', data);
};

// 修改评论
export const updateCommentService = (data) => {
    return request.put('/comment', data);
};

// 删除评论
export const deleteCommentService = (id) => {
    return request.delete('/comment/delete', { params: { id } });
};

// 批量删除评论
export const batchDeleteCommentService = (ids) => {
    return request.delete('/comment/batchDelete', { params: { ids } });
};

// 点赞评论
export const likeCommentService = (id) => {
    return request.put(`/comment/${id}/like`);
};
