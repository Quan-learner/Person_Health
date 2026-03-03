<template>
  <div class="article-detail-container" v-loading="loading">
    <div class="page-layout">
      <!-- 左侧主内容 -->
      <div class="left-content">
        <div v-if="article">
          <!-- 文章详情卡片 -->
          <div class="detail-card">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/user/home' }">健康资讯</el-breadcrumb-item>
              <el-breadcrumb-item>正文</el-breadcrumb-item>
            </el-breadcrumb>

            <h1 class="article-title">{{ article.title }}</h1>
            
            <div class="article-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.releaseTime) }}
              </span>
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ article.portSubscription || 0 }} 次阅读
              </span>
              <span class="meta-item">
                <el-icon>
                  <svg viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
                    <path d="M810 400H704V192c0-17.7-14.3-32-32-32H544c-17.7 0-32 14.3-32 32v113.3L313.3 513.1c-1.5 2.1-2.4 4.6-2.4 7.2V810c0 17.7 14.3 32 32 32h416c14.6 0 27.6-10 31.4-24.1L810 400zM128 512h128v330H128z"></path>
                  </svg>
                </el-icon>
                {{ article.likeCount || 0 }} 次点赞
              </span>
              <span class="meta-item">
                <el-icon><Star /></el-icon>
                {{ collectionCount }} 次收藏
              </span>
              <!-- <el-tag size="small" type="success">{{ article.categoryName }}</el-tag> -->
            </div>

            <div class="article-cover" v-if="article.image">
              <img :src="article.image" :alt="article.title" />
            </div>

            <div class="article-content" v-html="article.content"></div>

            <!-- 文章结尾后缀 -->
            <div class="article-suffix">
              <div class="suffix-divider">
                <span class="suffix-text">END</span>
              </div>
              <p class="suffix-tip">感谢您的阅读，愿每一天都充满健康与活力</p>
            </div>

            <!-- 交互按钮区域 -->
            <div class="interaction-bar">
              <el-button 
              :type="isLiked ? 'success' : 'default'" 
              plain 
              @click="toggleLike"
            >
              <el-icon :class="{ 'is-liked': isLiked }">
                <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                  <path d="M810 400H704V192c0-17.7-14.3-32-32-32H544c-17.7 0-32 14.3-32 32v113.3L313.3 513.1c-1.5 2.1-2.4 4.6-2.4 7.2V810c0 17.7 14.3 32 32 32h416c14.6 0 27.6-10 31.4-24.1L810 400zM128 512h128v330H128z"></path>
                </svg>
              </el-icon>
              {{ isLiked ? '已点赞' : '点赞' }}
            </el-button>
              <el-button 
                :type="isCollected ? 'warning' : 'default'" 
                plain 
                @click="toggleCollect"
              >
                <el-icon><Star /></el-icon>
                {{ isCollected ? '取消收藏' : '收藏' }}
              </el-button>
            </div>
          </div>

          <!-- 评论区域 -->
          <section class="comment-section">
            <h2 class="section-title">评论 <span class="comment-count-badge" v-if="totalCount > 0">{{ totalCount }}</span></h2>
            
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
                <el-avatar :size="40" :src="item.userPic || item.user_pic || item.user_avatar || defaultAvatar" />
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
                      ref="replyInput"
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
                      <el-avatar :size="24" :src="reply.userPic || reply.user_pic || reply.user_avatar || defaultAvatar" />
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
                            ref="replyInput"
                            maxlength="300"
                          />
                          <div class="inline-reply-footer">
                            <el-button size="small" round @click="cancelReply">取消</el-button>
                            <el-button 
                              type="primary" 
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
                        <el-icon><ArrowLeft :style="{ transform: expandedComments.has(item.id) ? 'rotate(90deg)' : 'rotate(-90deg)' }" /></el-icon>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-if="commentList.length === 0" description="暂无评论，快来抢沙发吧~" />
              
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
        </div>
        
        <el-empty v-else-if="!loading" description="文章加载中或已删除" />
      </div>

      <!-- 右侧侧边栏 -->
      <aside class="sidebar">
        <!-- 返回按钮移至此处 -->
        <div class="back-nav">
          <el-button 
            @click="router.push('/user/home')"
            class="back-btn"
          >
            <el-icon><ArrowLeft /></el-icon>
            <span>返回主页</span>
          </el-button>
        </div>

        <h2 class="sidebar-title">推荐资讯</h2>
        <div class="recommend-list">
          <div
            v-for="item in recommendedArticles"
            :key="item.id"
            class="recommend-item"
            @click="goToArticle(item.id)"
          >
            <img :src="item.image" :alt="item.title" class="recommend-img" />
            <div class="recommend-info">
              <h4 class="recommend-title">{{ item.title }}</h4>
              <div class="recommend-meta">
                <el-icon><View /></el-icon>
                <span class="view-count">{{ item.portSubscription || 0 }}</span>
                <el-icon style="margin-left: 8px;"><ChatDotRound /></el-icon>
                <span class="view-count">{{ item.commentCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 回到顶部功能 -->
        <div class="back-to-top-section">
          <el-button
            type="info"
            circle
            class="back-to-top-btn"
            @click="scrollToTop"
          >
            <el-icon :size="20"><CaretTop /></el-icon>
          </el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Calendar, 
  View, 
  Delete, 
  ChatDotRound, 
  CircleCheck,
  Star,
  IceTea,
  CaretTop,
  ArrowLeft
} from '@element-plus/icons-vue';
import { 
  getHealthPortDetailService, 
  updatePortSubscriptionService,
  getFeaturedArticlesService,
  getArticleListService,
  likeArticleService
} from '@/api/article.js';
import { 
  getCommentByPortIdService, 
  addCommentService, 
  deleteCommentService,
  likeCommentService
} from '@/api/comment.js';
import { getUserInfoService } from '@/api/user.js';
import { checkCollectionStatusService, toggleCollectionService, getCollectionCountService } from '@/api/collection.js';
import { ElMessageBox } from 'element-plus';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();

const route = useRoute();
const router = useRouter();
const article = ref(null);
const loading = ref(false);

const recommendedArticles = ref([]);
const commentList = ref([]);
const commentLoading = ref(false);
const totalCount = ref(0); // 文章总评论数
const commentText = ref('');
const replyText = ref(''); // 就地回复的文本
const commentInput = ref(null);
const replyInput = ref(null);
const replyTo = ref(null); // 当前正在回复的目标对象
const activeReplyId = ref(null); // 当前展开回复框的评论ID
const currentUserId = ref(null); // 动态获取
const totalTopics = ref(0); // 顶级评论总数
const commentParams = ref({
  pageNum: 1,
  pageSize: 7 // 用户规定每页 7 条不含回复
});
const userAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const isLiked = ref(false);
const isCollected = ref(false);
const collectionCount = ref(0);

// 评论回复展开状态管理
const expandedComments = ref(new Set());
const toggleExpandReplies = (commentId) => {
  if (expandedComments.value.has(commentId)) {
    expandedComments.value.delete(commentId);
  } else {
    expandedComments.value.add(commentId);
  }
};

const fetchArticleDetail = async (id) => {
  loading.value = true;
  try {
    const res = await getHealthPortDetailService(id);
    if (res.code === 200 || res.code === 0) {
      article.value = res.data;
      isLiked.value = res.data.isLiked || false; // 设置初始点赞状态
      await updatePortSubscriptionService(id);
      fetchUserInfo();
      fetchComments(id);
      checkCollectionStatus(id); // 检查收藏状态
      fetchCollectionCount(id); // 获取收藏数量
    }
  } catch (error) {
    console.error('获取文章详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchFeatured = async () => {
  try {
    const [featuredRes, regularRes] = await Promise.all([
      getFeaturedArticlesService(),
      getArticleListService({ pageNum: 1, pageSize: 10 })
    ]);

    let combined = [];
    if (featuredRes.code === 200 || featuredRes.code === 0) {
      combined = [...(featuredRes.data || [])];
    }
    
    if (regularRes.code === 200 || regularRes.code === 0) {
      const regular = regularRes.data?.records || regularRes.data || [];
      combined = [...combined, ...regular];
    }

    // 去重并排除当前文章
    const currentId = Number(route.params.id);
    const unique = [];
    const seenIds = new Set();
    seenIds.add(currentId); // 排除当前页面文章

    for (const item of combined) {
      if (!seenIds.has(item.id)) {
        unique.push(item);
        seenIds.add(item.id);
      }
      if (unique.length >= 4) break;
    }
    
    recommendedArticles.value = unique;
  } catch (error) {
    console.error('获取推荐资讯失败:', error);
  }
};

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

const handleLikeComment = async (comment) => {
  try {
    const res = await likeCommentService(comment.id);
    if (res.code === 200 || res.code === 0) {
      if (comment.isLiked) {
        // ElMessage.success('已取消点赞');
        comment.likes = Math.max(0, (comment.likes || 1) - 1);
        comment.isLiked = false;
      } else {
        // ElMessage.success('点赞成功');
        comment.likes = (comment.likes || 0) + 1;
        comment.isLiked = true;
      }
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const fetchComments = async (portId) => {
  commentLoading.value = true;
  try {
    const res = await getCommentByPortIdService({ 
      pageNum: commentParams.value.pageNum, 
      pageSize: commentParams.value.pageSize, 
      portId,
      module: '健康论坛'
    });
    if (res.code === 200 || res.code === 0) {
      console.log('Comments data received:', res.data);
      commentList.value = res.data.records || [];
      totalTopics.value = res.data.total || 0;
      totalCount.value = res.data.total || 0; // 改为主评论计数
    }
  } catch (error) {
    console.error('获取评论失败:', error);
  } finally {
    commentLoading.value = false;
  }
};

const handleCommentPageChange = () => {
  fetchComments(article.value.id);
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
      portId: article.value.id,
      content: content,
      module: '健康论坛'
    };
    
    if (target) {
      params.parentId = target.parentId || target.id;
      params.replyUsername = target.username;
    }

    const res = await addCommentService(params);
    if (res.code === 200 || res.code === 0) {
      notificationStore.add(target ? '回复成功' : '评论成功');
      fetchComments(article.value.id);
    }
  } catch (error) {
    console.error('发表评论失败:', error);
    notificationStore.add('发表失败', 'error');
  }
};

const handleReply = (parent, target) => {
  const currentTarget = target || parent;
  if (activeReplyId.value === currentTarget.id) {
    cancelReply();
    return;
  }
  activeReplyId.value = currentTarget.id;
  replyTo.value = currentTarget;
  replyText.value = '';
  setTimeout(() => {
    if (replyInput.value) {
      if (Array.isArray(replyInput.value)) {
        replyInput.value[0]?.focus();
      } else {
        replyInput.value.focus();
      }
    }
  }, 100);
};

const cancelReply = () => {
  replyTo.value = null;
  activeReplyId.value = null;
  replyText.value = '';
};

const handleDeleteComment = (id) => {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteCommentService(id);
      if (res.code === 200 || res.code === 0) {
        notificationStore.add('删除成功');
        fetchComments(article.value.id);
      }
    } catch (error) {
      notificationStore.add('删除失败', 'error');
    }
  });
};

const toggleLike = async () => {
  if (!article.value) return;
  try {
    const res = await likeArticleService(article.value.id);
    if (res.code === 200 || res.code === 0) {
      isLiked.value = !isLiked.value;
      // 实时更新点赞数显示
      if (isLiked.value) {
        article.value.likeCount = (article.value.likeCount || 0) + 1;
      } else {
        article.value.likeCount = Math.max(0, (article.value.likeCount || 0) - 1);
      }
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const checkCollectionStatus = async (id) => {
  try {
    const res = await checkCollectionStatusService(id, 'article');
    if (res.code === 200 || res.code === 0) {
      isCollected.value = res.data;
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
};

const toggleCollect = async () => {
  if (!article.value) return;
  try {
    const res = await toggleCollectionService(article.value.id, 'article');
    if (res.code === 200 || res.code === 0) {
      isCollected.value = res.data;
      notificationStore.add(isCollected.value ? '收藏成功' : '已取消收藏');
      // 更新收藏数量
      fetchCollectionCount(article.value.id);
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    notificationStore.add('操作失败', 'error');
  }
};

const fetchCollectionCount = async (id) => {
  try {
    const res = await getCollectionCountService(id, 'article');
    if (res.code === 200 || res.code === 0) {
      collectionCount.value = res.data || 0;
    }
  } catch (error) {
    console.error('获取收藏数量失败:', error);
  }
};

const goToArticle = (id) => {
  router.push(`/user/article/${id}`);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `发布于 ${y}-${m}-${d} ${h}:${min}:${s}`;
};

const formatCommentDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

// 回到顶部逻辑
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    fetchArticleDetail(id);
    fetchFeatured();
  }
});

// 监听路由参数变化，处理侧边栏点击不跳转问题
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      scrollToTop(); // 跳转后回到顶部
      fetchArticleDetail(newId);
      fetchFeatured();
    }
  }
);
</script>

<style scoped>
.article-detail-container {
  max-width: 1900px; /* 提升至 1900px 与首页对齐 (v4) */
  margin: 0 auto;
  padding: 10px 40px;
}

.page-layout {
  display: flex;
  gap: 16px; /* 缩小间距，使侧边栏更靠近正文 */
  align-items: flex-start;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.detail-card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.article-title {
  margin: 24px 0 16px;
  font-size: 32px;
  font-weight: 600; /* 调低字重 */
  color: #444; /* 柔化颜色 */
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-cover {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
}

:deep(.article-content img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px auto;
  border-radius: 4px;
}

/* 文章结尾后缀 */
.article-suffix {
  margin-top: 60px;
  text-align: center;
  user-select: none;
}

.suffix-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.suffix-divider::before,
.suffix-divider::after {
  content: "";
  height: 1px;
  width: 100px;
  background: linear-gradient(to var(--direction, right), rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05));
}

.suffix-divider::before { --direction: left; }

.suffix-text {
  font-size: 12px;
  color: #c0c4cc;
  letter-spacing: 4px;
  font-weight: 300;
}

.suffix-tip {
  font-size: 13px;
  color: #909399;
  font-style: italic;
  opacity: 0.8;
}

/* 交互按钮 */
.interaction-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 40px 0;
  padding-bottom: 20px;
  border-bottom: 1px dashed #f0f2f5;
}

/* 评论区域 */
.comment-section {
  background: #fff;
  padding: 40px; /* 增加内边距 */
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  max-width: 1000px; /* 限制最大宽度，不再让它铺满 1900px */
  margin: 0 auto 40px; /* 居中显示 */
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
  gap: 0; /* 改为 0，通过 padding 和 border 控制间距 */
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 24px 0; /* 将内边距移回父级，确保头像与内容整体上下对齐 */
}

.comment-item:last-child .comment-content-wrapper {
  border-bottom: none;
}

.comment-content-wrapper {
  flex: 1;
  border-bottom: 1px solid #f0f1f2; /* 主评论底部线条，从头像右侧开始 */
  padding-bottom: 16px; /* 增加底部间距 */
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

/* 评论分页 */
.comment-pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 覆盖分页样式为主题绿 */
.comment-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #22c55e !important;
}

.comment-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #22c55e !important;
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

.theme-green-btn.is-disabled {
  background-color: #86efac !important;
  border-color: #86efac !important;
  opacity: 0.6;
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
  color: #333; /* 回复功能变为黑色样式 */
  padding: 0px 2px;
  border-radius: 4px;
  font-size: 12px; /* 进一步调小字号 */
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

/* 回复相关样式 */
.reply-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #64748b;
  border-left: 3px solid #22c55e;
}

.reply-list {
  margin-top: 16px;
  padding: 4px 16px;
  background: #f4f5f7; /* 回复部分区域背景颜色加深 */
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 12px 0; /* 将回复项的内边距移回父级 */
}

.reply-content-wrapper {
  flex: 1;
  border-bottom: 1px solid #e2e8f0; /* 回复内容区域底部加成灰色线条 */
  padding-bottom: 8px; /* 增加底部间距 */
}

.reply-item:last-child .reply-content-wrapper {
  border-bottom: none;
}

.reply-target {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 8px;
}

.reply-target strong {
  color: #475569;
}

.reply-prefix {
  color: #333; /* “回复”和“:”显示为黑色 */
  font-weight: 500;
}

.reply-target-name {
  color: #909399; /* 只有用户名是灰色 */
  font-weight: 400;
  margin: 0 2px;
}

.sub-username {
  font-size: 13px !important;
  color: #303133; /* 恢复为正常的深色，不再是灰色 */
  font-weight: 700 !important;
}

.inline-reply-area {
  margin-top: 12px;
  background: transparent;
  padding: 0;
  border-radius: 8px;
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

.sub-header {
  margin-bottom: 4px;
}

.sub-username {
  font-size: 13px !important;
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

.expand-btn .el-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

/* 侧边栏样式 */
.sidebar {
  width: 250px; /* 缩窄侧边栏，与首页 v5 对齐 */
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  padding-left: 0; /* 移除左内边距 */
  border-left: none; /* 移除左边框 */
  margin-top: 0; /* 移除上边距，对齐正文顶部 */
}

.back-nav {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-btn:hover {
  color: #22c55e;
  border-color: #22c55e;
  background: #f0fdf4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.back-btn :deep(.el-icon) {
  font-size: 16px;
}

.sidebar-title {
  font-size: 20px; /* 进一步增大标题 */
  font-weight: 800;
  color: #000;
  margin-bottom: 20px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 0; /* 移除间距，通过 border 和 padding 控制 */
}

.recommend-item {
  display: flex;
  flex-direction: row; /* 水平排列 */
  gap: 12px; /* 增大间距 */
  cursor: pointer;
  transition: all 0.3s ease;
  align-items: flex-start; /* 改回 flex-start 以保证顶部对齐 */
  padding: 12px 0; /* 增加内边距 */
  border-bottom: 1.5px solid #ebeef5; /* 更显眼的底边框 */
}

.recommend-item:last-child {
  border-bottom: none;
}

.recommend-item:hover {
  background-color: #fcfdfc;
  transform: translateX(4px); /* 向右微移 */
}

.recommend-img {
  width: 120px; /* 增大尺寸 */
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.recommend-info {
  flex: 1;
  min-width: 0;
  height: 72px; /* 与图片高度一致 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
}

.recommend-title {
  font-size: 14px;
  font-weight: 500; /* 还原为标准字重 */
  color: #333; /* 还原为自然色 */
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  margin: 0; /* 彻底移除所有方向的 margin，防止遮挡 (v5) */
  padding: 0;
}

.recommend-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px; /* 增大字号 */
  color: #666; /* 加深颜色 */
  margin-top: 4px;
}

.recommend-meta .el-icon {
  font-size: 12px;
}

.recommend-item:hover .recommend-title {
  color: #22c55e;
}

/* 回到顶部 */
.back-to-top-section {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.back-to-top-btn {
  width: 44px;
  height: 44px;
  background: #fff;
  border: 1px solid #e4e7ed;
  color: #909399;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.back-to-top-btn:hover {
  background: #22c55e;
  border-color: #22c55e;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

@media (max-width: 900px) {
  .page-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #f0f2f5;
    padding-top: 24px;
  }
}
</style>

