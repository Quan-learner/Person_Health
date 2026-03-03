<template>
  <div class="diet-record-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">饮食历史</h1>
        <p class="subtitle">记录每一餐，追踪营养状况</p>
      </div>
      <div class="header-buttons">
        <el-button type="success" size="large" round @click="handleAddRecipe">
          <el-icon><Plus /></el-icon> 新增食谱
        </el-button>
      </div>
    </div>

    <!-- 顶部状态概览 (装饰性) -->
    <div class="stats-overview">
      <div 
        v-for="stat in stats" 
        :key="stat.label" 
        class="stat-card"
        :class="{ 'clickable': stat.isGoal }"
        @click="handleGoalClick(stat)"
      >
        <div class="stat-icon" :style="{ backgroundColor: stat.color }">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <el-card class="record-card">
      <!-- 表格头部：标题和搜索框 -->
      <div class="table-header">
        <div class="table-header-left">
          <h2 class="table-title">我的饮食记录</h2>
        </div>
        <div class="table-header-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索食谱名称"
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <div class="header-filters">
            <el-date-picker
              v-model="searchDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              clearable
            />
            <el-button type="primary" @click="handleRecordSearch" :icon="Search">确定</el-button>
          </div>
        </div>

        <!-- 对齐搜索框的右侧外悬浮按钮 -->
        <el-button 
          type="success" 
          circle 
          class="header-side-fab" 
          @click="openAddDialog"
          title="记录饮食"
        >
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>

      <el-empty v-if="!loading && records.length === 0" description="还没有饮食记录，快去记录第一餐吧~" />
      
      <!-- 表格形式的记录列表 -->
      <el-table 
        v-else
        :data="filteredRecords" 
        v-loading="loading"
        class="record-table"
        stripe
        height="100%"
      >
        <el-table-column prop="detail" label="用餐备注" min-width="180">
          <template #default="{ row }">
            <template v-if="row.detail">
              <span 
                v-for="(part, index) in parseMealDetail(row.detail)" 
                :key="index"
                :class="['remark-tag', part.type, { 'list-tag': true }]"
              >
                {{ part.text }}
                <span v-if="row.amount" class="tag-amount">
                  {{ row.amount }}g
                </span>
              </span>
            </template>
            <span v-else class="detail-text">暂无备注</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="recipeTitle" label="食谱名称" min-width="180">
          <template #default="{ row }">
            <span v-if="row.recipeTitle" class="recipe-name">{{ row.recipeTitle }}</span>
            <span v-else class="no-recipe">自定义饮食</span>
          </template>
        </el-table-column>
        
        <el-table-column label="消耗热量" min-width="140" align="center">
          <template #default="{ row }">
            <div v-if="row.caloriesPerGram !== null && row.amount !== null" class="calories-info">
              <span class="calories-val">{{ (row.caloriesPerGram * row.amount).toFixed(1) }}</span>
              <span class="calories-unit">kcal</span>
            </div>
            <span v-else class="no-data-text">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="记录时间" min-width="180" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatFullTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              link
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          :current-page="params.pageNum"
          :page-size="params.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          :pager-count="7"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          background
        />
      </div>
    </el-card>

    <!-- 记录饮食对话框 -->
    <el-dialog
      v-model="dialogVisible"
      width="85%"
      top="8vh"
      class="diet-dialog"
      destroy-on-close
      :show-close="false"
      :lock-scroll="false"
      :append-to-body="true"
    >
      <!-- 对话框头部 -->
      <template #header>
        <div class="dialog-header">
          <div class="header-left">
            <el-button link @click="dialogVisible = false">
              <el-icon><ArrowLeft /></el-icon> 返回
            </el-button>
            <span class="dialog-title">记录饮食</span>
          </div>
          <div class="header-center">记录饮食</div>
          <div class="header-right">
            <!-- 移除冗余按钮 -->
          </div>
        </div>
      </template>

      <!-- 对话框主体：左右布局 -->
      <div class="dialog-body">
        <!-- 左侧：食谱选择区域 -->
        <div class="recipe-select-area">
          <!-- Tab 切换 -->
          <div class="tab-row">
            <el-radio-group v-model="recipeTab" size="default" @change="handleTabChange">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="private">私人食谱</el-radio-button>
              <el-radio-button value="public">公开食谱</el-radio-button>
            </el-radio-group>
            
            <div class="search-action-row">
              <el-input
                v-model="recipeSearchKeyword"
                placeholder="搜索食谱"
                class="recipe-search-input"
                clearable
                @input="handleRecipeSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 食谱表格 -->
          <el-table 
            :data="recipeList" 
            v-loading="recipeListLoading"
            class="recipe-table"
            highlight-current-row
          >
            <el-table-column label="图标" width="80">
              <template #default="{ row }">
                <el-avatar shape="square" :size="50" :src="row.image || defaultRecipeImg" />
              </template>
            </el-table-column>
            
            <el-table-column prop="title" label="食谱名" min-width="140" />
            
            <el-table-column label="热量标准" min-width="120" align="center">
              <template #default="{ row }">
                <div v-if="row.calories !== null" class="recipe-cal-info single-line">
                  <span class="recipe-cal-val">{{ row.calories }}</span>
                  <span class="recipe-cal-unit">kcal/g</span>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            
            <el-table-column label="状态" width="85" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isAudit === 1" type="success" size="small">已审核</el-tag>
                <el-tag v-else-if="row.isAudit === 0" type="warning" size="small">待审核</el-tag>
                <el-tag v-else type="info" size="small">未知</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="(cmd) => handleRecipeCommand(cmd, row)">
                  <el-button link>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="select">
                        <el-icon><Select /></el-icon> 选中食谱项
                      </el-dropdown-item>
                      <el-dropdown-item command="edit" v-if="row.userId === currentUserId">
                        <el-icon><Edit /></el-icon> 修改
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" style="color: #f56c6c" v-if="row.userId === currentUserId">
                        <el-icon><Delete /></el-icon> 删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="recipe-pagination">
            <span>共 {{ recipeTotal }} 条</span>
            <el-select 
              v-model="recipeParams.pageSize" 
              size="small" 
              style="width: 100px; margin: 0 8px;"
              @change="handleRecipeSizeChange"
            >
              <el-option :value="10" label="10条/页" />
              <el-option :value="20" label="20条/页" />
              <el-option :value="50" label="50条/页" />
            </el-select>
            <el-pagination
              small
              :current-page="recipeParams.pageNum"
              :page-size="recipeParams.pageSize"
              :total="recipeTotal"
              :pager-count="5"
              layout="prev, pager, next"
              @current-change="handleRecipePageChange"
            />
            <span style="margin-left: 8px;">前往</span>
            <el-input-number 
              v-model="recipeGoToPage" 
              :min="1" 
              :max="Math.ceil(recipeTotal / recipeParams.pageSize) || 1"
              size="small" 
              style="width: 60px; margin: 0 8px;" 
              controls-position="right"
              @change="handleRecipePageChange"
            />
            <span>页</span>
          </div>
        </div>

        <!-- 右侧：已选中食谱 -->
        <div class="selected-recipe-area">
          <div class="right-panel-header">
            <span class="panel-title">记录饮食</span>
            <div v-if="selectedRecipes.length > 0" class="clear-selection" @click="handleClearSelection">
              <el-icon><Refresh /></el-icon>
            </div>
          </div>

          <div v-if="selectedRecipes.length === 0" class="empty-selection">
            <el-empty description="请从左侧选择食谱" :image-size="80" />
          </div>
          
          <div v-else class="selected-recipes-list">
            <!-- 选中的食谱列表：每个有自己的重量输入 -->
            <div 
              v-for="(item, index) in selectedRecipes" 
              :key="item.id" 
              class="selected-recipe-box"
            >
              <div class="box-title">{{ item.title }}</div>
              <el-input
                v-model="item.amount"
                placeholder="输入食用量 (单位g)"
                class="image-style-input"
              />
              <el-icon class="box-remove-icon" @click="removeSelectedItem(index)"><Close /></el-icon>
            </div>

            <!-- 饮食备注改为标签选择 -->
            <div class="shared-remarks-section">
              <div class="section-title">用餐时间</div>
              <div class="remark-tags">
                <span 
                  v-for="tag in mealOptions" 
                  :key="tag.name"
                  :class="['remark-tag', tag.type, { active: sharedDetail === tag.name }]"
                  @click="handleTagClick(tag.name)"
                >
                  {{ tag.name }}
                </span>
              </div>
              <!-- 保留一个小输入框用于额外备注 -->
              <div class="extra-remark" v-if="sharedDetail">
                <el-input
                  v-model="customDetail"
                  placeholder="额外备注 (可选)"
                  size="small"
                  class="extra-input"
                  clearable
                />
              </div>
            </div>

            <div class="image-style-footer">
              <el-button 
                class="image-style-add-btn" 
                :loading="submitLoading" 
                @click="submitRecord"
              >
                <span>立即新增</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 新增食谱侧边抽屉 -->
    <el-drawer
      v-model="addRecipeDrawerVisible"
      :title="recipeForm.id ? '修改食谱' : '新增食谱'"
      direction="rtl"
      size="600px"
      class="add-recipe-drawer"
      destroy-on-close
      :lock-scroll="false"
      :modal="true"
      :append-to-body="true"
    >
      <el-form :model="recipeForm" label-position="left" label-width="60px" class="recipe-form">
        <!-- 封面上传 -->
        <el-form-item label="封面" required>
          <div class="cover-upload" @click="triggerCoverUpload" v-loading="coverUploading">
            <input 
              type="file" 
              ref="coverInputRef" 
              accept="image/*" 
              style="display: none;"
              @change="handleCoverChange"
            />
            <template v-if="recipeForm.cover">
              <el-image :src="recipeForm.cover" fit="cover" class="cover-preview" />
              <span class="cover-text">点击替换图片</span>
            </template>
            <template v-else>
              <el-icon :size="20"><Picture /></el-icon>
              <span class="cover-text">点击此上传/替换图片</span>
            </template>
          </div>
        </el-form-item>

        <!-- 名称 -->
        <el-form-item label="名称" required>
          <el-input 
            v-model="recipeForm.name" 
            placeholder="请输入食谱名，50个字以内"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- 热量 -->
        <el-form-item label="热量" required>
          <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
            <el-input-number 
              v-model="recipeForm.calories" 
              :min="0"
              :precision="3"
              :step="0.1"
              style="flex: 1;"
            />
            <span style="color: #909399; font-size: 13px;">kcal / g</span>
          </div>
        </el-form-item>

        <!-- 权限 -->
        <el-form-item label="权限" required>
          <el-radio-group v-model="recipeForm.isPrivate">
            <el-radio :value="1">私人食谱</el-radio>
            <el-radio :value="0">公开食谱</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 类别 - 私人食谱时禁用 -->
        <el-form-item label="类别" required :class="{ 'is-disabled-category': recipeForm.isPrivate === 1 }">
          <el-radio-group v-model="recipeForm.typeId" :disabled="recipeForm.isPrivate === 1">
            <el-radio :value="1">减脂</el-radio>
            <el-radio :value="2">增肌</el-radio>
          </el-radio-group>
          <span v-if="recipeForm.isPrivate === 1" class="disabled-tip">（私人食谱无需选择类别）</span>
        </el-form-item>

        <!-- 内容 -->
        <el-form-item label="内容" required>
          <el-input
            v-model="recipeForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入内容..."
          />
        </el-form-item>
      </el-form>

      <!-- 底部按钮 -->
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="addRecipeDrawerVisible = false">取消</el-button>
          <el-button type="success" :loading="addRecipeLoading" @click="submitAddRecipe">
            提交
          </el-button>
        </div>
        <div v-if="recipeForm.isPrivate === 0" class="audit-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>公开食谱需要管理员审核后才能显示</span>
        </div>
      </template>
    </el-drawer>
    <!-- 目标体重设置对话框 -->
    <el-dialog
      v-model="goalDialogVisible"
      title="设定健康目标"
      width="360px"
      center
      class="goal-dialog"
      :lock-scroll="false"
      :append-to-body="true"
    >
      <div class="goal-form">
        <div class="goal-input-item">
          <label>目标体重 (kg)</label>
          <el-input-number 
            v-model="goalForm.weight" 
            :min="30" 
            :max="200" 
            :precision="1" 
            style="width: 100%" 
          />
        </div>
        <div class="goal-input-item">
          <label>达成日期</label>
          <el-date-picker
            v-model="goalForm.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabled-date="(date) => date < new Date()"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="goalDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveGoal">保存设定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Clock, Refresh, Apple, KnifeFork, Sugar, Delete, Search, ArrowLeft, ShoppingCart, MoreFilled, Picture, InfoFilled, Edit, Select, Close, Flag } from '@element-plus/icons-vue';
import { Flame } from 'lucide-vue-next';
import { ElMessageBox } from 'element-plus';
import { getDietRecordListService, addDietRecordService, deleteDietRecordService, addBatchDietRecordService, getTodayCaloriesService } from '@/api/dietRecord.js';
import { getRecipeListService, addRecipeService, updateRecipeService, deleteRecipeService } from '@/api/recipe.js';
import { getUserInfoService } from '@/api/user.js';
import { uploadFileService } from '@/api/upload.js';
import { useNotificationStore } from '@/stores/notification.js';

const notificationStore = useNotificationStore();
const currentUserId = ref(null);

const loading = ref(false);
const records = ref([]);
const total = ref(0);
const searchKeyword = ref('');
const totalCalories = ref(0);
const searchDate = ref('');
const targetWeight = ref(localStorage.getItem('targetWeight') || 0);
const targetDate = ref(localStorage.getItem('targetDate') || '');
const goalDialogVisible = ref(false);
const goalForm = ref({
  weight: targetWeight.value,
  date: targetDate.value
});

const daysRemaining = computed(() => {
  if (!targetDate.value) return 0;
  const target = new Date(targetDate.value);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// 过滤后的记录列表 - 改为由后端过滤，这里直接返回
const filteredRecords = computed(() => records.value);

const handleSearch = () => {
  // 不再自动搜索
};

const handleRecordSearch = () => {
  params.value.pageNum = 1;
  fetchRecords();
};
const defaultRecipeImg = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png';

const params = ref({
  pageNum: 1,
  pageSize: 10
});

const stats = computed(() => [
  { label: '累计餐次', value: total.value, icon: KnifeFork, color: '#67C23A' },
  { label: '今日摄入', value: `${totalCalories.value.toFixed(1)} kcal`, icon: Flame, color: '#F56C6C' },
  { 
    label: targetWeight.value > 0 ? `目标: ${targetWeight.value}kg` : '设置目标', 
    value: targetWeight.value > 0 ? `剩 ${daysRemaining.value} 天` : '点击设置', 
    icon: Flag, 
    color: '#409EFF',
    isGoal: true 
  }
]);

const handleGoalClick = (stat) => {
  if (stat.isGoal) {
    goalForm.value = {
      weight: targetWeight.value,
      date: targetDate.value
    };
    goalDialogVisible.value = true;
  }
};

const saveGoal = () => {
  targetWeight.value = goalForm.value.weight;
  targetDate.value = goalForm.value.date;
  localStorage.setItem('targetWeight', targetWeight.value);
  localStorage.setItem('targetDate', targetDate.value);
  goalDialogVisible.value = false;
  notificationStore.add('目标已更新');
};

const handlePageChange = (val) => {
  params.value.pageNum = val;
  fetchRecords();
};

const handleSizeChange = (val) => {
  params.value.pageSize = val;
  params.value.pageNum = 1;
  fetchRecords();
};

const fetchTodayCalories = async () => {
  try {
    const res = await getTodayCaloriesService();
    if (res.code === 200 || res.code === 0) {
      totalCalories.value = res.data || 0;
    }
  } catch (error) {
    console.error('获取今日热量失败:', error);
  }
};

const fetchRecords = async () => {
  loading.value = true;
  try {
    const apiParams = {
      pageNum: params.value.pageNum,
      pageSize: params.value.pageSize
    };
    if (searchDate.value) {
      apiParams.updateTime = searchDate.value;
    }
    if (searchKeyword.value) {
      apiParams.keyword = searchKeyword.value;
    }
    const res = await getDietRecordListService(apiParams);
    if (res.code === 200 || res.code === 0) {
      records.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取记录失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    roundButton: true
  }).then(async () => {
    try {
      await deleteDietRecordService(id);
      notificationStore.add('删除成功');
      fetchRecords();
      fetchTodayCalories();
    } catch (error) {
      notificationStore.add('删除失败', 'error');
    }
  });
};

// 对话框相关
const dialogVisible = ref(false);
const submitLoading = ref(false);
const searchLoading = ref(false);
const recipeOptions = ref([]);
const form = ref({
  recipeId: null,
  detail: '',
  amount: null
});

const openAddDialog = () => {
  selectedRecipes.value = [];
  recipeSearchKeyword.value = '';
  recipeTab.value = 'all';
  dialogVisible.value = true;
  fetchRecipeList();
};

// 食谱选择对话框相关
const recipeTab = ref('all');
const recipeSearchKeyword = ref('');
const recipeList = ref([]);
const recipeListLoading = ref(false);
const recipeTotal = ref(0);
const recipeGoToPage = ref(1);
const selectedRecipes = ref([]);
const sharedDetail = ref('');
const customDetail = ref('');
const mealOptions = [
  { name: '早餐', type: 'tag-blue' },
  { name: '午餐', type: 'tag-green' },
  { name: '下午茶', type: 'tag-rose' },
  { name: '晚餐', type: 'tag-orange' },
  { name: '夜宵', type: 'tag-purple' },
  { name: '加餐', type: 'tag-teal' }
];

const handleTagClick = (tag) => {
  if (sharedDetail.value === tag) {
    sharedDetail.value = '';
  } else {
    sharedDetail.value = tag;
  }
};

const parseMealDetail = (detail) => {
  if (!detail) return [];
  const parts = detail.split(' - ');
  const result = [];
  
  // 第一个部分通常是时间标签 (早餐/午餐等)
  const mealName = parts[0];
  const mealOpt = mealOptions.find(opt => opt.name === mealName);
  
  if (mealOpt) {
    result.push({
      text: mealName,
      type: mealOpt.type
    });
    // 如果有后续备注，可以作为第二个标签或者普通文本显示，这里暂不额外处理
  } else {
    // 如果不是预定义的标签，显示为普通样式
    result.push({ text: mealName, type: '' });
  }
  
  return result;
};

const recipeParams = ref({
  pageNum: 1,
  pageSize: 10
});


// 获取食谱列表
const fetchRecipeList = async () => {
  recipeListLoading.value = true;
  try {
    // 根据 Tab 设置 isPrivate 参数
    let isPrivate = null;
    if (recipeTab.value === 'private') {
      isPrivate = 1;
    } else if (recipeTab.value === 'public') {
      isPrivate = 0;
    }
    // 全部 = null，后端会返回用户私人食谱 + 审核通过的公开食谱
    
    const res = await getRecipeListService({
      pageNum: recipeParams.value.pageNum,
      pageSize: recipeParams.value.pageSize,
      name: recipeSearchKeyword.value || undefined,
      isPrivate: isPrivate
    });
    if (res.code === 200 || res.code === 0) {
      recipeList.value = res.data.records || [];
      recipeTotal.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取食谱列表失败:', error);
  } finally {
    recipeListLoading.value = false;
  }
};

const handleRecipeSearch = () => {
  recipeParams.value.pageNum = 1; // 搜索时重置页码
  fetchRecipeList();
};

const handleTabChange = () => {
  recipeParams.value.pageNum = 1; // Tab 切换时重置页码
  fetchRecipeList();
};

const handleRecipePageChange = (val) => {
  recipeParams.value.pageNum = val;
  recipeGoToPage.value = val; // 同步跳转输入框
  fetchRecipeList();
};

const handleRecipeSizeChange = (val) => {
  recipeParams.value.pageSize = val;
  recipeParams.value.pageNum = 1;
  recipeGoToPage.value = 1; // 同步跳转输入框
  fetchRecipeList();
};

const handleSelectRecipe = (row) => {
  // 检查是否已存在
  if (selectedRecipes.value.some(r => r.id === row.id)) {
    notificationStore.add('该食谱已在选中列表中', 'warning');
    return;
  }
  selectedRecipes.value.push({
    recipeId: row.id,
    id: row.id,
    title: row.title,
    amount: null,
    detail: ''
  });
};

const removeSelectedItem = (index) => {
  selectedRecipes.value.splice(index, 1);
};

const handleClearSelection = () => {
  selectedRecipes.value = [];
  sharedDetail.value = '';
};

const handleRecipeCommand = (command, row) => {
  if (command === 'select') {
    handleSelectRecipe(row);
  } else if (command === 'edit') {
    handleEditRecipe(row);
  } else if (command === 'delete') {
    handleDeleteRecipe(row);
  }
};

const handleEditRecipe = (row) => {
  recipeForm.value = {
    id: row.id,
    name: row.title,
    cover: row.image,
    typeId: row.typeId || 1,
    isPrivate: row.isPrivate ?? 0,
    calories: row.calories || 0,
    content: row.content || '',
    isAudit: 1 // 默认已审核
  };
  addRecipeDrawerVisible.value = true;
};

const handleDeleteRecipe = (row) => {
  ElMessageBox.confirm(`确定要删除食谱 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    roundButton: true
  }).then(async () => {
    try {
      await deleteRecipeService(row.id);
      notificationStore.add('删除成功');
      fetchRecipeList();
    } catch (error) {
      notificationStore.add('删除失败', 'error');
    }
  });
};

const handleAddRecipe = () => {
  // 打开新增食谱侧边抽屉
  recipeForm.value = {
    id: null,
    name: '',
    cover: '',
    typeId: 1,
    isPrivate: 0,
    calories: 0,
    content: '',
    isAudit: 1 // 默认已审核
  };
  addRecipeDrawerVisible.value = true;
};

// 新增食谱相关
const addRecipeDrawerVisible = ref(false);
const addRecipeLoading = ref(false);
const coverInputRef = ref(null);
const recipeForm = ref({
  id: null,
  name: '',
  cover: '',
  typeId: 1,
  isPrivate: 0,
  calories: 0,
  content: '',
  isAudit: 1
});

const coverUploading = ref(false);

const triggerCoverUpload = () => {
  coverInputRef.value?.click();
};

const handleCoverChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  coverUploading.value = true;
  try {
    const res = await uploadFileService(file);
    if (res.code === 200 || res.code === 0) {
      recipeForm.value.cover = res.data;
      notificationStore.add('图片上传成功');
    } else {
      notificationStore.add(res.message || '图片上传失败', 'error');
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    notificationStore.add('图片上传失败', 'error');
  } finally {
    coverUploading.value = false;
  }
};

const submitAddRecipe = async () => {
  // 表单验证
  if (!recipeForm.value.name.trim()) {
    notificationStore.add('请输入食谱名称', 'warning');
    return;
  }
  if (!recipeForm.value.content.trim()) {
    notificationStore.add('请输入食谱内容', 'warning');
    return;
  }
  if (recipeForm.value.isPrivate === 0 && !recipeForm.value.typeId) {
    notificationStore.add('请选择食谱类别', 'warning');
    return;
  }
  
  addRecipeLoading.value = true;
  try {
    if (recipeForm.value.id) {
      await updateRecipeService(recipeForm.value);
      notificationStore.add('食谱修改成功');
    } else {
      await addRecipeService(recipeForm.value);
      if (recipeForm.value.isPrivate === 1) {
        notificationStore.add('食谱添加成功！');
      } else {
        notificationStore.add('食谱已提交，等待管理员审核');
      }
    }
    
    addRecipeDrawerVisible.value = false;
    fetchRecipeList();
  } catch (error) {
    const action = recipeForm.value.id ? '修改' : '添加';
    notificationStore.add(`${action}失败`, 'error');
  } finally {
    addRecipeLoading.value = false;
  }
};

const searchRecipes = async (query) => {
  if (!query) {
    recipeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  try {
    // 假设 API 支持根据关键字查询食谱列表
    const res = await getRecipeListService({ title: query, pageNum: 1, pageSize: 10 });
    if (res.code === 200 || res.code === 0) {
      recipeOptions.value = res.data.records || [];
    }
  } catch (error) {
    console.error('查询食谱失败:', error);
  } finally {
    searchLoading.value = false;
  }
};

const submitRecord = async () => {
  if (selectedRecipes.value.length === 0) {
    notificationStore.add('请先选择至少一个食谱', 'warning');
    return;
  }
  
  // 简单验证：每个已选项必须有重量
  const invalid = selectedRecipes.value.some(item => !item.amount);
  if (invalid) {
    notificationStore.add('请输入所有已选食谱的重量', 'warning');
    return;
  }

  submitLoading.value = true;
  try {
    // 将选择的标签和额外备注合并
    const finalRemark = customDetail.value 
      ? `${sharedDetail.value} - ${customDetail.value}`
      : sharedDetail.value;

    const recordsToSubmit = selectedRecipes.value.map(item => ({
      ...item,
      detail: finalRemark
    }));

    await addBatchDietRecordService(recordsToSubmit);
    notificationStore.add('记录成功');
    dialogVisible.value = false;
    fetchRecords();
    fetchTodayCalories();
    handleClearSelection(); 
  } catch (error) {
    notificationStore.add('记录失败', 'error');
  } finally {
    submitLoading.value = false;
  }
};

// 工具函数
const formatDay = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.substring(8, 10);
};

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const monthIdx = parseInt(dateStr.substring(5, 7)) - 1;
  return months[monthIdx];
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.substring(11, 16);
};

// 格式化完整时间（用于表格显示）
const formatFullTime = (dateStr) => {
  if (!dateStr) return '';
  // 假设格式为 YYYY-MM-DD HH:mm:ss
  return dateStr.substring(0, 16).replace('T', ' ');
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfoService();
    if (res.code === 200 || res.code === 0) {
      currentUserId.value = res.data.id;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(() => {
  fetchRecords();
  fetchUserInfo();
  fetchTodayCalories();
});
</script>

<style scoped>
.diet-record-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 24px;
  height: calc(100vh - 100px); /* 减去顶部导航高度 */
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允许按钮悬浮在外部 */
  box-sizing: border-box;
  position: relative; /* 为悬浮按钮提供基准 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}

.subtitle {
  color: #909399;
  margin: 8px 0 0 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.record-card {
  flex: 1;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允许内部按钮悬浮至外部 */
}

.record-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允许内部按钮悬浮至外部 */
  padding: 20px;
}

/* 表格头部布局 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebedf0;
  padding-bottom: 12px;
  flex-shrink: 0;
  position: relative; /* 为外侧悬浮按钮定位 */
}

.table-header-left {
  display: flex;
  align-items: center;
}

.table-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-side-fab {
  position: absolute;
  right: -75px; 
  top: 30%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background-color: #E6A23C; /* 橙色 */
  border-color: #E6A23C;
  color: #fff;
  font-size: 20px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.header-side-fab:hover {
  transform: translateY(-50%) scale(1.1) rotate(90deg);
  background-color: #a3650c !important;
  border-color: #a3650c !important;
  box-shadow: 0 6px 16px rgba(163, 101, 12, 0.4);
}

.header-side-fab :deep(.el-icon) {
  font-weight: bold;
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #67C23A inset;
}

/* 表格样式 */
.record-table {
  width: 100%;
}

.record-table :deep(.el-table__header th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
  border-bottom: 1px solid #ebedf0;
}

.record-table :deep(.el-table__row) {
  transition: background-color 0.3s;
  cursor: default !important;
}

.header-buttons :deep(.el-button--success:hover) {
  background-color: #4b8f2c !important;
  border-color: #4b8f2c !important;
}

.record-table :deep(.el-table__row:hover > td) {
  background-color: #f5f7fa !important;
}

/* 表格内容样式 */
.detail-text {
  color: #606266;
  font-size: 14px;
}

.recipe-name {
  color: #1a1a1a;
  font-weight: 500;
}

.no-recipe {
  color: #67C23A;
  font-weight: 500;
}

.time-text {
  color: #909399;
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 16px;
}

/* 全屏对话框样式 */
.diet-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
}

.diet-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #e8e8e8;
}

.diet-dialog :deep(.el-dialog__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
}

.dialog-header .header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-header .header-center {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.dialog-header .header-right {
  display: flex;
  align-items: center;
}

.dialog-header .dialog-title {
  font-size: 14px;
  color: #606266;
}

/* 对话框主体布局 */
.dialog-body {
  display: flex;
  height: 70vh;
  overflow: hidden;
}

/* 左侧食谱选择区域 */
.recipe-select-area {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  border-right: 1px solid #e8e8e8;
  overflow: hidden;
}

.tab-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-action-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.recipe-search-input {
  width: 200px;
}

.recipe-table {
  flex: 1;
  overflow: auto;
}

.recipe-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 0;
  gap: 4px;
  font-size: 14px;
  color: #606266;
  flex-wrap: wrap;
}

/* 右侧已选中食谱区域 */
.selected-recipe-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fdfdfd;
  border-left: 1px solid #f0f0f0;
  padding: 0;
  overflow: hidden;
}

.right-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-selection {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
}

.clear-selection:hover {
  background: #e4e7ed;
  color: #1a1a1a;
}

.selected-recipes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  overflow-y: auto;
  background: #fff;
}

.selected-recipe-box {
  margin-bottom: 32px;
  position: relative;
}

.box-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  text-align: left;
}

.image-style-input :deep(.el-input__wrapper) {
  background-color: #fff;
  border: 1px solid #e8e8e8;
  box-shadow: none;
  border-radius: 6px;
  padding: 8px 16px;
  height: 38px;
}

.image-style-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
}

.box-remove-icon {
  position: absolute;
  top: 0;
  right: -10px;
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
}

.box-remove-icon:hover {
  color: #f56c6c;
}

.shared-remarks-section {
  margin-top: 8px;
  margin-bottom: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
  text-align: left;
}

.image-style-textarea :deep(.el-textarea__inner) {
  background-color: #fff;
  border: 1px solid #e8e8e8;
  box-shadow: none;
  border-radius: 6px;
  padding: 12px 16px;
  font-family: inherit;
  resize: none;
}

.image-style-footer {
  margin-top: auto;
  padding-bottom: 20px;
}

.image-style-add-btn {
  width: 100%;
  height: 40px; /* 调小高度 */
  background: #E6A23C; /* 橙色 */
  border: none;
  border-radius: 8px;
  color: #fff; /* 白色字体 */
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.image-style-add-btn:hover {
  background: #a3650c !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(163, 101, 12, 0.3);
}

/* 类别选项 Tab 切换样式调优 - 橙色背景强制覆盖 */
.tab-row :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: #E6A23C !important;
  border-color: #E6A23C !important;
  color: #ffffff !important;
  box-shadow: -1px 0 0 0 #E6A23C !important;
}

.tab-row :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: #E6A23C !important;
  border-color: #E6A23C !important;
  color: #ffffff !important;
}

/* 彻底屏蔽悬停效果 */
.tab-row :deep(.el-radio-button__inner:hover) {
  color: inherit !important;
  background-color: inherit !important;
  border-color: inherit !important;
  box-shadow: none !important;
}

.tab-row :deep(.el-radio-button.is-active .el-radio-button__inner:hover) {
  color: #ffffff !important;
  background-color: #E6A23C !important;
  border-color: #E6A23C !important;
}




.empty-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .dialog-body {
    flex-direction: column;
  }
  .selected-recipe-area {
    width: 100%;
    min-height: 200px;
  }
  .recipe-select-area {
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }
}

/* 新增食谱侧边抽屉样式 */
.add-recipe-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.add-recipe-drawer :deep(.el-drawer__body) {
  padding: 20px;
}

.recipe-form {
  padding-top: 10px;
}

.cover-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
  min-height: 60px;
}

.cover-upload:hover {
  border-color: #67C23A;
  background-color: rgba(103, 194, 58, 0.05);
}

.cover-preview {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}

.cover-text {
  color: #606266;
  font-size: 14px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.audit-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border-radius: 6px;
  color: #e6a23c;
  font-size: 13px;
}

/* 类别禁用样式 */
.is-disabled-category {
  opacity: 0.6;
}

.disabled-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

/* 饮食备注标签样式 */
.remark-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.remark-tag {
  padding: 8px 18px;
  border-radius: 20px;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  user-select: none;
}

.remark-tag.list-tag {
  cursor: default;
  padding: 4px 12px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  pointer-events: none; /* 列表标签不需要点击效果 */
}

.tag-amount {
  opacity: 0.8;
  font-weight: normal;
  font-size: 0.9em;
  border-left: 1px solid currentColor;
  padding-left: 6px;
  margin-left: 2px;
}

.remark-tag:hover {
  transform: translateY(-2px);
  filter: brightness(0.95);
}

/* 早餐 - 清晨蓝 */
.remark-tag.tag-blue { background: #f0f9ff; color: #0369a1; }
.remark-tag.tag-blue.active { background: #e0f2fe; border-color: #7dd3fc; box-shadow: 0 4px 12px rgba(125, 211, 252, 0.2); }

/* 原琥珀色保留或移除，此处改为早餐专用蓝 */

/* 午餐 - 嫩绿色 */
.remark-tag.tag-green { background: #f0fdf4; color: #15803d; }
.remark-tag.tag-green.active { background: #dcfce7; border-color: #4ade80; box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2); }

/* 下午茶 - 玫瑰红 */
.remark-tag.tag-rose { background: #fff1f2; color: #be123c; }
.remark-tag.tag-rose.active { background: #ffe4e6; border-color: #fb7185; box-shadow: 0 4px 12px rgba(251, 113, 133, 0.2); }

/* 晚餐 - 日落橙 */
.remark-tag.tag-orange { background: #fff7ed; color: #c2410c; }
.remark-tag.tag-orange.active { background: #ffedd5; border-color: #fb923c; box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2); }

/* 夜宵 - 月光紫 */
.remark-tag.tag-purple { background: #faf5ff; color: #7e22ce; }
.remark-tag.tag-purple.active { background: #f3e8ff; border-color: #a855f7; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2); }

/* 加餐 - 宁静青 */
.remark-tag.tag-teal { background: #f0fdfa; color: #0f766e; }
.remark-tag.tag-teal.active { background: #ccfbf1; border-color: #2dd4bf; box-shadow: 0 4px 12px rgba(45, 212, 191, 0.2); }

.extra-remark {
  margin-top: 12px;
  animation: fadeIn 0.3s ease;
}

.extra-input :deep(.el-input__wrapper) {
  background-color: #f9fafb;
  border-radius: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.calories-info, .recipe-cal-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.calories-val, .recipe-cal-val {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.calories-unit, .recipe-cal-unit {
  color: #909399;
  font-size: 11px;
}

.no-data-text {
  color: #c0c4cc;
}

.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.clickable:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recipe-cal-info.single-line {
  flex-direction: row;
  justify-content: center;
  gap: 4px;
}

.goal-form {
  padding: 10px 0;
}

.goal-input-item {
  margin-bottom: 20px;
}

.goal-input-item label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}
</style>
