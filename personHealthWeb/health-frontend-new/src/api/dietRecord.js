import request from '@/utils/request';

// 获取个人饮食记录
export const getDietRecordListService = (params) => {
    return request.get('/dietRecord/list', { params });
};

// 获取今日总热量
export const getTodayCaloriesService = () => {
    return request.get('/dietRecord/todayCalories');
};

// 添加饮食记录
export const addDietRecordService = (data) => {
    return request.post('/dietRecord', data);
};

// 批量添加饮食记录
export const addBatchDietRecordService = (data) => {
    return request.post('/dietRecord/batch', data);
};

// 删除饮食记录
export const deleteDietRecordService = (id) => {
    return request.delete('/dietRecord/delete', { params: { id } });
};

// 批量删除饮食记录
export const batchDeleteDietRecordService = (ids) => {
    return request.delete('/dietRecord/batchDelete', { params: { ids: ids.join(',') } });
};
