<template>
  <div class="recipe-detail-container" v-loading="loading">
    <div class="page-header">
      <div class="back-link" @click="router.push('/user/recipes')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <div class="header-divider"></div>
      <div class="detail-label">食谱详情</div>
    </div>

    <div class="page-layout">
      <!-- 左侧内容区 -->
      <main class="left-content" v-if="recipe">
        <h1 class="recipe-title">{{ recipe.title }}</h1>
        
        <div class="author-meta">
          <el-avatar :size="24" :src="recipe.authorAvatar || defaultAvatar" />
          <div class="author-info">
            <span class="author-name">{{ recipe.authorName }}</span>
            <span class="meta-divider">·</span>
            <span class="publish-time">发布于 {{ formatDate(recipe.createTime) }}</span>
            <span class="meta-divider">·</span>
            <span class="publish-time">{{ recipe.likeCount || 0 }} 点赞</span>
            <span class="meta-divider" v-if="totalCount > 0">·</span>
            <span class="publish-time" v-if="totalCount > 0">{{ totalCount }} 条评论</span>
          </div>
        </div>

        <div class="recipe-content-card">
          <h2 class="content-title">{{ recipe.title }}制作步骤</h2>
          <div class="steps-content" v-html="recipe.content"></div>
        </div>

        <div class="interaction-bar">
          <el-button 
            :type="isLiked ? 'danger' : 'default'" 
            plain 
            round
            @click="toggleLike"
          >
            <el-icon><Star v-if="!isLiked" /><StarFilled v-else /></el-icon>
            {{ isLiked ? '取消点赞' : '点赞' }}
          </el-button>
          <el-button 
            :type="isCollected ? 'warning' : 'default'" 
            plain 
            round
            @click="toggleCollect"
          >
            <el-icon><CollectionTag /></el-icon>
            {{ isCollected ? '取消收藏' : '收藏' }}
          </el-button>
        </div>

        <!-- 评论区域 -->
        <section class="comment-section">
          <h2 class="section-title">评论 <span>({{ totalCount }})</span></h2>
          
          <!-- 发表评论 -->
          <div class="comment-input-area">
            <el-avatar :size="40" :src="userAvatar" />
            <div class="input-wrapper">
              <el-input
                v-model="commentText"
                ref="commentInput"
                type="textarea"
                :rows="3"
                placeholder="请友好交流"
                maxlength="300"
              />
              <div class="input-footer">
                <span class="char-count">{{ commentText.length }}/300</span>
                <el-button 
                  class="theme-green-btn"
                  round 
                  :disabled="!commentText.trim()"
                  @click="submitComment"
                >
                  评论
                </el-button>
              </div>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comment-list" v-loading="commentLoading">
            <div v-for="item in commentList" :key="item.id" class="comment-item">
              <el-avatar :size="40" :src="item.userPic || item.user_pic || defaultAvatar" />
              <div class="comment-content-wrapper">
                <div class="comment-header">
                  <span class="username">{{ item.username }}</span>
                  <el-tag v-if="item.userId === currentUserId" size="small" effect="plain" class="self-tag">我自己</el-tag>
                </div>
                <p class="comment-text">{{ item.content }}</p>
                <div class="comment-footer">
                  <div class="footer-left">
                    <span class="time">{{ formatCommentDate(item.createTime) }}</span>
                    <span class="action-item" @click="handleReply(item)">
                      <el-icon><ChatDotRound /></el-icon> {{ activeReplyId === item.id ? '取消回复' : '回复' }}
                    </span>
                    <span 
                      v-if="item.userId === currentUserId" 
                      class="action-item delete" 
                      @click="handleDeleteComment(item.id)"
                    >
                      <el-icon><Delete /></el-icon> 删除
                    </span>
                  </div>
                  <div class="footer-right">
                    <span class="action-item like" @click="handleLikeComment(item)">
                      <el-icon :class="{ 'is-liked': item.isLiked }">
                        <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
                          <path d="M810 400H704V192c0-17.7-14.3-32-32-32H544c-17.7 0-32 14.3-32 32v113.3L313.3 513.1c-1.5 2.1-2.4 4.6-2.4 7.2V810c0 17.7 14.3 32 32 32h416c14.6 0 27.6-10 31.4-24.1L810 400zM128 512h128v330H128z"></path>
                        </svg>
                      </el-icon> {{ item.likes || 0 }}
                    </span>
                  </div>
                </div>

                <!-- 顶级评论下的就地回复框 -->
                <div v-if="activeReplyId === item.id" class="inline-reply-area">
                  <el-input
                    v-model="replyText"
                    type="textarea"
                    :rows="2"
                    :placeholder="`回复 ${replyTo?.username}:`"
                    maxlength="300"
                  />
                  <div class="inline-reply-footer">
                    <el-button size="small" round @click="cancelReply">取消</el-button>
                    <el-button 
                      class="theme-green-btn"
                      size="small" 
                      round 
                      :disabled="!replyText.trim()"
                      @click="submitReply"
                    >
                      提交回复
                    </el-button>
                  </div>
                </div>

                <!-- 子评论列表 -->
                <div v-if="item.replies && item.replies.length > 0" class="reply-list">
                  <div 
                    v-for="reply in (expandedComments.has(item.id) ? item.replies : item.replies.slice(0, 1))" 
                    :key="reply.id" 
                    class="reply-item"
                  >
                    <el-avatar :size="24" :src="reply.userPic || reply.user_pic || defaultAvatar" />
                    <div class="reply-content-wrapper">
                      <div class="comment-header sub-header">
                        <span class="username sub-username">{{ reply.username }}</span>
                        <el-tag v-if="reply.userId === currentUserId" size="small" effect="plain" class="self-tag sub-tag">我自己</el-tag>
                      </div>
                      <p class="comment-text sub-text">
                        <span v-if="reply.replyUsername" class="reply-prefix">
                          回复 <span class="reply-target-name">{{ reply.replyUsername }}</span>:
                        </span>
                        {{ reply.content }}
                      </p>
                      <div class="comment-footer sub-footer">
                        <div class="footer-left">
                          <span class="time">{{ formatCommentDate(reply.createTime) }}</span>
                          <span class="action-item sub-action" @click="handleReply(item, reply)">
                            <el-icon><ChatDotRound /></el-icon> {{ activeReplyId === reply.id ? '取消回复' : '回复' }}
                          </span>
                          <span 
                            v-if="reply.userId === currentUserId" 
                            class="action-item delete sub-action" 
                            @click="handleDeleteComment(reply.id)"
                          >
                            <el-icon><Delete /></el-icon> 删除
                          </span>
                        </div>
                        <div class="footer-right">
                          <span class="action-item like sub-action" @click="handleLikeComment(reply)">
                            <el-icon :class="{ 'is-liked': reply.isLiked }">
                              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                                <path d="M810 400H704V192c0-17.7-14.3-32-32-32H544c-17.7 0-32 14.3-32 32v113.3L313.3 513.1c-1.5 2.1-2.4 4.6-2.4 7.2V810c0 17.7 14.3 32 32 32h416c14.6 0 27.6-10 31.4-24.1L810 400zM128 512h128v330H128z"></path>
                              </svg>
                            </el-icon> {{ reply.likes || 0 }}
                          </span>
                        </div>
                      </div>

                      <!-- 子评论下的就地回复框 -->
                      <div v-if="activeReplyId === reply.id" class="inline-reply-area">
                        <el-input
                          v-model="replyText"
                          type="textarea"
                          :rows="2"
                          :placeholder="`回复 ${replyTo?.username}:`"
                          maxlength="300"
                        />
                        <div class="inline-reply-footer">
                          <el-button size="small" round @click="cancelReply">取消</el-button>
                          <el-button 
                            class="theme-green-btn"
                            size="small" 
                            round 
                            :disabled="!replyText.trim()"
                            @click="submitReply"
                          >
                            提交回复
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 展开更多按钮 -->
                  <div v-if="item.replies.length > 1" class="expand-control">
                    <span class="expand-btn" @click="toggleExpandReplies(item.id)">
                      {{ expandedComments.has(item.id) ? '收起回复' : `展开共 ${item.replies.length} 条回复` }}
                      <el-icon><ArrowDown :style="{ transform: expandedComments.has(item.id) ? 'rotate(180deg)' : 'rotate(0)' }" /></el-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="!commentLoading && commentList.length === 0" description="暂无评论，快来抢沙发吧~" />

            <!-- 评论分页 -->
            <div class="comment-pagination" v-if="totalTopics > 0">
              <el-pagination
                :current-page="commentParams.pageNum"
                :page-size="commentParams.pageSize"
                @update:current-page="commentParams.pageNum = $event"
                @update:page-size="commentParams.pageSize = $event"
                :total="totalTopics"
                layout="total, prev, pager, next"
                @current-change="handleCommentPageChange"
                background
                small
              />
            </div>
          </div>
        </section>
      </main>

      <!-- 右侧侧边栏 -->
      <aside class="sidebar">
        <h2 class="sidebar-title">推荐食谱</h2>
        <div class="recommend-list">
          <div 
            v-for="item in recommendedRecipes" 
            :key="item.id" 
            class="recommend-item"
            @click="goToRecipe(item.id)"
          >
            <img :src="item.image" :alt="item.title" class="recommend-img" />
            <div class="recommend-info">
              <h4 class="recommend-title">{{ item.title }}</h4>
            </div>
          </div>
        </div>

        <!-- 简洁的回到顶部 -->
        <div class="back-to-top" @click="scrollToTop">
          <el-icon><CaretTop /></el-icon>
          <span>回到顶部</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Star, StarFilled, CollectionTag, ArrowLeft, CaretTop, ChatDotRound, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRecipeDetailService, getRecommendedRecipesService, toggleRecipeLikeService } from '@/api/recipe.js';
import { getCommentByPortIdService, addCommentService, deleteCommentService, likeCommentService } from '@/api/comment.js';
import { getUserInfoService } from '@/api/user.js';
import { checkCollectionStatusService, toggleCollectionService } from '@/api/collection.js';
import { useNotificationStore } from '@/stores/notification.js';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(false);
const recipe = ref(null);
const recommendedRecipes = ref([]);
const isLiked = ref(false);
const isCollected = ref(false);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 评论相关
const commentList = ref([]);
const commentLoading = ref(false);
const totalCount = ref(0);
const commentText = ref('');
const replyText = ref('');
const replyTo = ref(null);
const activeReplyId = ref(null);
const currentUserId = ref(null);
const userAvatar = ref(defaultAvatar);
const expandedComments = ref(new Set());
const totalTopics = ref(0);
const commentParams = ref({
  pageNum: 1,
  pageSize: 5
});

const fetchDetail = async (id) => {
  loading.value = true;
  try {
    const res = await getRecipeDetailService(id);
    recipe.value = res.data;
    isLiked.value = res.data.isLiked; // 设置点赞状态
    checkCollectionStatus(id); // 检查收藏状态
  } catch (error) {
    console.error('获取详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchRecommended = async () => {
  try {
    const res = await getRecommendedRecipesService();
    // 排除当前查看的食谱
    recommendedRecipes.value = (res.data || []).filter(item => item.id !== Number(route.params.id)).slice(0, 3);
  } catch (error) {
    console.error('获取推荐失败:', error);
  }
};

const toggleLike = async () => {
  if (!recipe.value) return;
  try {
    const res = await toggleRecipeLikeService(recipe.value.id);
    if (res.code === 200 || res.code === 0) {
      isLiked.value = res.data;
      // 手动更新 count，避免重新拉取全量详情
      if (isLiked.value) {
        recipe.value.likeCount = (recipe.value.likeCount || 0) + 1;
      } else {
        recipe.value.likeCount = Math.max(0, (recipe.value.likeCount || 0) - 1);
      }
      notificationStore.add(isLiked.value ? '点赞成功' : '已取消点赞');
    }
  } catch (error) {
    console.error('点赞失败:', error);
    notificationStore.add('操作失败', 'error');
  }
};

const checkCollectionStatus = async (id) => {
  try {
    const res = await checkCollectionStatusService(id, 'recipe');
    if (res.code === 200 || res.code === 0) {
      isCollected.value = res.data;
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
};

const toggleCollect = async () => {
  if (!recipe.value) return;
  try {
    const res = await toggleCollectionService(recipe.value.id, 'recipe');
    if (res.code === 200 || res.code === 0) {
      isCollected.value = res.data;
      notificationStore.add(isCollected.value ? '收藏成功' : '已取消收藏');
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    notificationStore.add('操作失败', 'error');
  }
};

const goToRecipe = (id) => {
  router.push(`/user/recipe/${id}`);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

const formatCommentDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfoService();
    if (res.code === 200 || res.code === 0) {
      currentUserId.value = res.data.id;
      if (res.data.userPic) userAvatar.value = res.data.userPic;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 获取评论
const fetchComments = async (portId) => {
  commentLoading.value = true;
  try {
    const res = await getCommentByPortIdService({ 
      pageNum: commentParams.value.pageNum, 
      pageSize: commentParams.value.pageSize, 
      portId,
      module: '健康食谱'
    });
    if (res.code === 200 || res.code === 0) {
      commentList.value = res.data.records || [];
      totalCount.value = res.data.total || 0; // 改为主评论计数
      totalTopics.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取评论失败:', error);
  } finally {
    commentLoading.value = false;
  }
};

const handleCommentPageChange = (val) => {
  commentParams.value.pageNum = val;
  fetchComments(recipe.value.id);
  // 滚动到评论区顶部
  const commentSection = document.querySelector('.comment-section');
  if (commentSection) {
    window.scrollTo({
      top: commentSection.offsetTop - 100,
      behavior: 'smooth'
    });
  }
};

const toggleExpandReplies = (commentId) => {
  if (expandedComments.value.has(commentId)) {
    expandedComments.value.delete(commentId);
  } else {
    expandedComments.value.add(commentId);
  }
};

const submitComment = async () => {
  if (!commentText.value.trim()) return;
  await postComment(commentText.value, null);
  commentText.value = '';
};

const submitReply = async () => {
  if (!replyText.value.trim() || !replyTo.value) return;
  await postComment(replyText.value, replyTo.value);
  replyText.value = '';
  cancelReply();
};

const postComment = async (content, target) => {
  try {
    const params = {
      portId: recipe.value.id,
      content: content,
      module: '健康食谱'
    };
    
    if (target) {
      params.parentId = target.parentId || target.id;
      params.replyUsername = target.username;
    }

    const res = await addCommentService(params);
    if (res.code === 200 || res.code === 0) {
      notificationStore.add(target ? '回复成功' : '评论成功');
      fetchComments(recipe.value.id);
    }
  } catch (error) {
    console.error('发表评论失败:', error);
    notificationStore.add('发表失败', 'error');
  }
};

const handleReply = (comment) => {
  if (activeReplyId.value === comment.id) {
    cancelReply();
    return;
  }
  activeReplyId.value = comment.id;
  replyTo.value = comment;
  replyText.value = '';
};

const cancelReply = () => {
  replyTo.value = null;
  activeReplyId.value = null;
  replyText.value = '';
};

const handleDeleteComment = (id) => {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteCommentService(id);
      if (res.code === 200 || res.code === 0) {
        notificationStore.add('删除成功');
        fetchComments(recipe.value.id);
      }
    } catch (error) {
      notificationStore.add('删除失败', 'error');
    }
  });
};

const handleLikeComment = async (comment) => {
  try {
    const res = await likeCommentService(comment.id);
    if (res.code === 200 || res.code === 0) {
      if (comment.isLiked) {
        comment.likes = Math.max(0, (comment.likes || 1) - 1);
        comment.isLiked = false;
      } else {
        comment.likes = (comment.likes || 0) + 1;
        comment.isLiked = true;
      }
    }
  } catch (error) {
    console.error('点赞失败:', error);
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    fetchDetail(id);
    fetchRecommended();
    fetchUserInfo();
    fetchComments(id);
  }
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchDetail(newId);
    fetchRecommended();
    fetchComments(newId);
    window.scrollTo(0, 0);
  }
});
</script>

<style scoped>
.recipe-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 15px;
  transition: opacity 0.3s;
}

.back-link:hover {
  opacity: 0.7;
}

.header-divider {
  width: 1px;
  height: 14px;
  background-color: #e0e0e0;
}

.detail-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.page-layout {
  display: flex;
  gap: 40px;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.recipe-title {
  font-size: 22px; /* 进一步调小字号 */
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 0;
  margin-bottom: 13px; /* 严格保持 13px */
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.meta-divider {
  color: #999;
  font-size: 12px;
}

.publish-time {
  font-size: 12px;
  color: #909399;
}

.recipe-content-card {
  margin-bottom: 40px;
}

.content-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.steps-content {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  white-space: pre-line; /* 保持换行 */
}

.interaction-bar {
  display: flex;
  justify-content: center; /* 居中显示按钮 */
  gap: 16px;
  margin-bottom: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid #f0f0f0;
}

/* 评论区域 */
.comment-section {
  background: transparent;
  padding: 10px 40px 40px;
  border-radius: 12px;
  box-shadow: none;
  margin-bottom: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-count-badge {
  font-size: 14px;
  background: #f0fdf4;
  color: #22c55e;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.input-wrapper {
  flex: 1;
}

:deep(.el-textarea__inner) {
  background-color: #f4f5f7;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #22c55e inset;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.char-count {
  font-size: 12px;
  color: #909399;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 24px 0;
}

.comment-item:last-child .comment-content-wrapper {
  border-bottom: none;
}

.comment-content-wrapper {
  flex: 1;
  border-bottom: 1px solid #f0f1f2;
  padding-bottom: 16px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.username {
  font-weight: 700;
  color: #303133;
  font-size: 14px;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-right {
  display: flex;
  align-items: center;
}

.time {
  font-size: 12px;
  color: #909399;
  margin-right: 2px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  padding: 0px 2px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.action-item:hover {
  background: #f1f5f9;
  color: #22c55e;
}

.action-item.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

.action-item .el-icon.is-liked {
  color: #22c55e;
}

/* 回复列表 */
.reply-list {
  margin-top: 16px;
  padding: 4px 16px;
  background: #f4f5f7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.reply-content-wrapper {
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.reply-item:last-child .reply-content-wrapper {
  border-bottom: none;
}

.reply-prefix {
  color: #333;
  font-weight: 500;
}

.reply-target-name {
  color: #909399;
  font-weight: 400;
  margin: 0 2px;
}

.sub-header {
  margin-bottom: 4px;
}

.sub-username {
  font-size: 13px !important;
  color: #303133;
  font-weight: 700 !important;
}

.sub-text {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

.sub-action {
  font-size: 12px !important;
  padding: 2px 6px !important;
}

.sub-tag {
  transform: scale(0.9);
  transform-origin: left center;
}

.inline-reply-area {
  margin-top: 12px;
  background: transparent;
  padding: 0;
}

.inline-reply-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.expand-control {
  margin-top: 8px;
  padding-left: 44px;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.expand-btn:hover {
  color: #22c55e;
}

/* 评论分页 */
.comment-pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.comment-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #22c55e !important;
}

/* 主题绿色按钮 */
.theme-green-btn {
  background-color: #22c55e !important;
  border-color: #22c55e !important;
  color: #fff !important;
}

.theme-green-btn:hover {
  background-color: #16a34a !important;
  border-color: #16a34a !important;
  opacity: 0.9;
}

/* 侧边栏 */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 80px; /* 距离顶部的偏移，考虑页头高度 */
  align-self: flex-start; /* 必须设置 align-self 以使 sticky 生效 */
  max-height: calc(100vh - 100px); /* 限制高度使其能在窄屏正常滚动 */
  overflow-y: auto; /* 万一侧边栏内容过长可以内部滚动 */
  scrollbar-width: none;
}

.sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar-title {
  font-size: 18px; /* 调大标题字号 */
  font-weight: 700;
  margin-bottom: 20px; /* 增加标题下方间距 */
  color: #1a1a1a;
}

.recommend-item {
  margin-bottom: 30px; /* 增加食谱之间的间距 */
  cursor: pointer;
  transition: opacity 0.3s;
}

.recommend-img {
  width: 100%;
  height: 110px; /* 进一步调小图片高度 */
  border-radius: 4px;
  object-fit: cover;
  margin-bottom: 2px; /* 进一步挨近图片 */
}

.recommend-title {
  margin: 0; /* 移除默认外边距，确保紧贴图片 */
  font-size: 14px; /* 按要求调回 14px */
  font-weight: 500;
  color: #444;
  line-height: 1.4;
}

.back-to-top {
  margin-top: 32px; /* 增加一点间距 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #909399;
  font-size: 15px; /* 调大字号 */
  cursor: pointer;
  transition: all 0.3s;
}

.back-to-top :deep(.el-icon) {
  font-size: 18px; /* 调大图标 */
}

.back-to-top:hover {
  color: #67c23a;
}

@media (max-width: 900px) {
  .page-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
}
</style>
