import request from '@/utils/request';

// 切换收藏状态（收藏/取消收藏）
export const toggleCollectionService = (itemId, itemType) => {
    return request.post(`/userCollection/toggle?itemId=${itemId}&itemType=${itemType}`);
};

// 检查收藏状态
export const checkCollectionStatusService = (itemId, itemType) => {
    return request.get('/userCollection/status', { params: { itemId, itemType } });
};

// 获取收藏的文章列表
export const getCollectedArticlesService = () => {
    return request.get('/userCollection/articles');
};

// 获取收藏的食谱列表
export const getCollectedRecipesService = () => {
    return request.get('/userCollection/recipes');
};

// 获取收藏数量
export const getCollectionCountService = (itemId, itemType) => {
    return request.get('/userCollection/count', { params: { itemId, itemType } });
};

// 批量取消收藏
export const batchDeleteCollectionService = (itemIds, itemType) => {
    return request.delete('/userCollection/batch', {
        params: {
            itemIds: itemIds.join(','),
            itemType
        }
    });
};
