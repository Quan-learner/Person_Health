import request from '@/utils/request';

// 获取所有健康文章列表
export const getArticleListService = (params) => {
    return request.get('/healthPort/list', { params });
};

// 获取首页轮播精选文章
export const getFeaturedArticlesService = () => {
    return request.get('/healthPort/getFeaturedArticlesService');
};

// 获取所有文章分类列表
export const getCategoriesService = () => {
    return request.get('/healthPort/categories');
};

// 获取健康文章详情
export const getHealthPortDetailService = (id) => {
    return request.get('/healthPort/detail', { params: { id } });
};

// 修改健康文章订阅数 (阅读数)
export const updatePortSubscriptionService = (id) => {
    return request.put(`/healthPort/portSubscription?id=${id}`);
};

// 点赞健康文章
export const likeArticleService = (id) => {
    return request.put(`/healthPort/like?id=${id}`);
};

// 添加健康文章
export const addArticleService = (data) => {
    return request.post('/healthPort', data);
};

// 修改健康文章
export const updateArticleService = (data) => {
    return request.put('/healthPort', data);
};

// 删除健康文章
export const deleteArticleService = (id) => {
    return request.delete('/healthPort/delete', { params: { id } });
};
