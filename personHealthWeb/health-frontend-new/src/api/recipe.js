import request from '@/utils/request';

// 获取食谱列表
export const getRecipeListService = (params) => {
    return request.get('/recipe/list', { params });
};

// 获取推荐食谱
export const getRecommendedRecipesService = () => {
    return request.get('/recipe/recommended');
};

// 根据ID获取食谱详情
export const getRecipeDetailService = (id) => {
    return request.get(`/recipe/${id}`);
};

// 新增食谱
export const addRecipeService = (data) => {
    return request.post('/recipe', data);
};

// 修改食谱
export const updateRecipeService = (data) => {
    return request.put('/recipe', data);
};

// 删除食谱
export const deleteRecipeService = (id) => {
    return request.delete(`/recipe/${id}`);
};

// 点赞/取消点赞食谱
export const toggleRecipeLikeService = (id) => {
    return request.post(`/recipe/like/${id}`);
};
