<template>
  <div class="ai-chat-widget">
    <!-- 悬浮球按钮 -->
    <div 
      class="floating-button" 
      :class="{ 'is-active': isOpen }"
      @click="toggleChat"
    >
      <div class="robot-icon-wrapper">
        <el-icon :size="28"><Loading v-if="loading && !isOpen"/><Service v-else /></el-icon>
      </div>
      <div v-if="!isOpen" class="button-label">AI 健康咨询</div>
    </div>

    <!-- 聊天面板 -->
    <transition name="chat-panel-fade">
      <div v-if="isOpen" class="chat-panel">
        <div class="chat-header">
          <div class="header-info">
            <div class="robot-avatar">
              <el-icon :size="20"><Service /></el-icon>
            </div>
            <div class="header-text">
              <h4>小康 - AI 健康顾问</h4>
              <span class="status-indicator">在线</span>
            </div>
          </div>
          <el-icon class="close-btn" @click="isOpen = false"><Close /></el-icon>
        </div>

        <div class="chat-messages" ref="messageList">
          <div class="welcome-msg">
            <p>您好！我是您的专属健康顾问<strong>小康</strong>。我可以为您提供饮食、运动、睡眠及日常健康咨询。有什么我可以帮您的吗？</p>
          </div>
          
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message-item', msg.role]"
          >
            <div class="message-bubble">
              <div class="message-content" v-html="formatMessage(msg.content)"></div>
            </div>
          </div>

          <div v-if="loading" class="message-item assistant loading">
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <!-- 快捷建议 -->
          <div class="quick-suggestions" v-if="messages.length === 0 && !loading">
            <div 
              v-for="sug in suggestions" 
              :key="sug" 
              class="sug-chip"
              @click="sendQuickMessage(sug)"
            >
              {{ sug }}
            </div>
          </div>

          <div class="input-area">
            <el-input
              v-model="inputMsg"
              placeholder="输入健康咨询问题..."
              @keyup.enter="handleSend"
              :disabled="loading"
              resize="none"
              type="textarea"
              :rows="1"
              autosize
            />
            <el-button 
              type="primary" 
              class="send-btn" 
              @click="handleSend"
              :disabled="!inputMsg.trim() || loading"
              circle
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue';
import { Service, Close, Promotion, Loading } from '@element-plus/icons-vue';
import { chatWithAiStream } from '@/api/aiChat';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const isOpen = ref(false);
const inputMsg = ref('');
const loading = ref(false);
const messageList = ref(null);
const messages = ref([]);
const suggestions = [
  '如何改善睡眠质量？',
  '有什么控制体重的饮食建议？',
  '最近总是感觉疲劳怎么办？',
  '想要增肌，运动后怎么吃？'
];

// 格式化消息内容 (处理换行)
const formatMessage = (content) => {
  if (!content) return '';
  return content.replace(/\n/g, '<br/>');
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

const sendQuickMessage = (text) => {
  inputMsg.value = text;
  handleSend();
};

const handleSend = async () => {
  const content = inputMsg.value.trim();
  if (!content || loading.value) return;

  // 添加用户消息
  messages.value.push({ role: 'user', content });
  inputMsg.value = '';
  loading.value = true;
  await scrollToBottom();

  // 准备 AI 消息占位
  const aiMsgIndex = messages.value.length;
  messages.value.push({ role: 'assistant', content: '' });

  // 构造历史记录 (LangChain4j 期待的格式)
  const history = messages.value.slice(0, aiMsgIndex - 1).map(m => ({
    role: m.role,
    content: m.content
  }));

  // 调用流式接口
  chatWithAiStream(
    content,
    history,
    (token) => {
      messages.value[aiMsgIndex].content += token;
      scrollToBottom();
    },
    () => {
      loading.value = false;
      scrollToBottom();
    },
    (err) => {
      loading.value = false;
      console.error('AI Chat Error:', err);
      notificationStore.add('咨询服务暂时不可用，请稍后再试', 'error');
      messages.value.pop(); // 移除空的 AI 消息
    }
  );
};

// 监听 isOpen，打开时滚动到底部
watch(isOpen, (val) => {
  if (val) {
    scrollToBottom();
  }
});
</script>

<style scoped>
.ai-chat-widget {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 2000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 按钮样式 */
.floating-button {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: visible;
}

.floating-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.5);
}

.floating-button.is-active {
  transform: rotate(90deg) scale(0.9);
  background: #606266;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.robot-icon-wrapper {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-label {
  position: absolute;
  right: 70px;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

.floating-button:hover .button-label {
  opacity: 1;
  transform: translateX(0);
}

/* 聊天面板 */
.chat-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 580px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(16, 185, 129, 0.1);
  transform-origin: bottom right;
}

.chat-header {
  padding: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.robot-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-indicator {
  font-size: 11px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-indicator::before {
  content: "";
  width: 6px;
  height: 6px;
  background: #4ade80;
  border-radius: 50%;
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.3s;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 4px;
}

.welcome-msg {
  background: #f0fdf4;
  padding: 16px;
  border-radius: 16px;
  border: 1px dashed #10b981;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.welcome-msg p {
  margin: 0;
}

.message-item {
  display: flex;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
}

.message-item.assistant {
  align-self: flex-start;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.user .message-bubble {
  background: #10b981;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant .message-bubble {
  background: #f3f4f6;
  color: #374151;
  border-bottom-left-radius: 4px;
}

.chat-footer {
  padding: 15px 20px 20px;
  border-top: 1px solid #f3f4f6;
}

.quick-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.sug-chip {
  padding: 6px 12px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #10b981;
  font-size: 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sug-chip:hover {
  background: #10b981;
  color: white;
  transform: translateY(-2px);
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
}

:deep(.el-textarea__inner) {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none !important;
  color: #374151;
}

.send-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: #10b981;
  border: none;
}

.send-btn:hover {
  background: #059669;
}

/* 打点动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 进场动画 */
.chat-panel-fade-enter-active,
.chat-panel-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.chat-panel-fade-enter-from,
.chat-panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
