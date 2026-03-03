import request from '@/utils/request';

// 文件上传
export const uploadFileService = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};
