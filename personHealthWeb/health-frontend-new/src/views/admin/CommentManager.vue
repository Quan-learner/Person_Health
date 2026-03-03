<template>
  <div class="comment-manager">
    <!-- Comment Table Card -->
    <div class="content-wrapper">
      <el-card shadow="never" class="main-card">
        <!-- Toolbar -->
        <div class="card-toolbar">
          <div class="toolbar-left">
            <el-button type="danger" plain :disabled="selectedIds.length === 0" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>批量删除 ({{ selectedIds.length }})
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="keyword"
              placeholder="搜索评论内容或用户名..."
              class="search-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button class="action-btn" @click="handleSearch">搜索</el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          v-loading="loading"
          :data="commentList"
          style="width: 100%"
          class="comment-table"
          :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />

          <el-table-column label="用户" width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32" :src="row.userPic || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
                <span class="username">{{ row.username || '匿名用户' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="评论内容" min-width="280">
            <template #default="{ row }">
              <div class="comment-content">
                <p class="content-text">{{ row.content }}</p>
                <span v-if="row.replyUsername" class="reply-badge">
                  回复 @{{ row.replyUsername }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="所属文章" width="200">
            <template #default="{ row }">
              <span class="article-title">{{ row.articleTitle || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="点赞" width="80" align="center">
            <template #default="{ row }">
              <span class="like-count">{{ row.likes || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="评论时间" width="180" sortable prop="createTime">
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.createTime) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-dropdown trigger="click">
                <el-button link class="more-btn">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleDelete(row)" class="delete-item">
                      <el-icon><Delete /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-container">
          <span class="total-text">共 {{ total }} 条</span>
          <el-pagination
            :current-page="pageNum"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="prev, pager, next, sizes, jumper"
            :total="total"
            @size-change="val => { pageSize = val; fetchComments(); }"
            @current-change="val => { pageNum = val; fetchComments(); }"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Delete, MoreFilled
} from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();

// Table Data
const loading = ref(false);
const commentList = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const selectedIds = ref([]);

// Fetch Comments
const fetchComments = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/comment/list', {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined
      }
    });
    if (res.code === 200 || res.code === 0) {
      commentList.value = res.data.items || res.data.rows || res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (err) {
    ElMessage.error('获取评论列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageNum.value = 1;
  fetchComments();
};

const handleSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id);
};

// Delete single comment
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该条评论吗？`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    }
  ).then(async () => {
    try {
      const res = await request.delete('/admin/comment/delete', {
        params: { id: row.id }
      });
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('评论已删除');
        fetchComments();
      }
    } catch (err) {
      ElMessage.error('删除失败');
    }
  });
};

// Batch delete
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 条评论吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    }
  ).then(async () => {
    try {
      const res = await request.delete('/admin/comment/batchDelete', {
        params: { ids: selectedIds.value.join(',') }
      });
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('批量删除成功');
        selectedIds.value = [];
        fetchComments();
      }
    } catch (err) {
      ElMessage.error('批量删除失败');
    }
  });
};

// Helpers
const formatTime = (t) => t ? t.replace('T', ' ').substring(0, 19) : '--';

onMounted(() => {
  fetchComments();
});
</script>

<style scoped>
.comment-manager {
   /* Restored some top padding, reduced side padding */
  min-height: 100%;
}

.content-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.main-card {
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

/* Table */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

.comment-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-text {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reply-badge {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
}

.article-title {
  font-size: 13px;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.like-count {
  font-weight: 600;
  color: #ef4444;
  font-size: 14px;
}

.time-text {
  font-size: 13px;
  color: #94a3b8;
}

.more-btn {
  color: #9ca3af;
  font-size: 18px;
}

.more-btn:hover {
  color: #111827;
}

.delete-item {
  color: #ef4444;
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.total-text {
  font-size: 13px;
  color: #94a3b8;
}

/* Dialog */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
}

.action-btn {
  height: 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  font-weight: 500;
  color: #ffffff;
}

.action-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #ffffff;
}
</style>
