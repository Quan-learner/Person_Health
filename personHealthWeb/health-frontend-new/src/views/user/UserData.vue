<template>
  <div class="health-data-page">
    <div class="data-container">
      <!-- 左侧：图表主内容区 -->
      <div class="main-content">
        <!-- 顶部提示语 -->
        <div class="intro-banner">
          <div class="intro-tip">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <p>{{ currentModelDescription }}</p>
          </div>
          <div class="top-actions">
             <el-select v-model="selectedModelId" placeholder="选择模型" style="width: 200px" @change="handleModelChange">
               <el-option
                 v-for="model in allModels"
                 :key="model.id"
                 :label="model.name + (model.type === 0 ? ' (公共模型)' : ' (我的模型)')"
                 :value="model.id"
               />
             </el-select>
          </div>
        </div>

        <!-- 图表卡片 -->
        <el-card class="chart-card" shadow="never">
          <div class="chart-header">
            <!-- 图标标题 -->
            <h2 class="chart-title">{{ currentModelName }}</h2>
            <div class="time-filter">
              <span class="filter-label">时间选择</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">一周内</el-radio-button>
                <el-radio-button label="month">一个月内</el-radio-button>
                <el-radio-button label="quarter">三个月内</el-radio-button>
                <el-radio-button label="year">一年内</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- ECharts 容器 -->
          <div ref="chartRef" class="echarts-container"></div>
        </el-card>

        <!-- 健康记录表格区域 -->
        <div class="records-table-section">
          <!-- 表格头部操作栏 (合并后的唯一操作栏) -->
          <div class="records-header">
            <div class="header-left">
              <div class="status-legend">
                <span class="legend-item"><i class="dot normal"></i>正常</span>
                <span class="legend-item"><i class="dot abnormal"></i>异常</span>
              </div>
            </div>
            <div class="header-right">
              <el-select v-model="modelFilter" placeholder="全部项目" size="default" style="width: 200px">
                <el-option label="全部项目" value="all" />
                <el-option
                  v-for="model in allModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </div>
          </div>

          <!-- 记录表格 -->
           <div class="records-container">
            <el-table :data="paginatedRecords" style="width: 100%" :header-cell-style="{ background: 'transparent', color: '#909399', fontWeight: '500' }">
               <el-table-column prop="itemName" label="记录项" min-width="120" />
              <el-table-column label="记录值" min-width="120">
                <template #default="scope">
                  <span class="record-value">{{ scope.row.recordValue || scope.row.value }}{{ scope.row.unit }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unitLabel" label="单位" min-width="100">
                 <template #default="scope">
                    {{ scope.row.unitLabel || scope.row.unit }}
                 </template>
              </el-table-column>
              <el-table-column label="指标情况" min-width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.isNormal ? 'success' : 'danger'" size="small" effect="light">
                    {{ scope.row.isNormal ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="时间" min-width="160" sortable>
                <template #default="scope">
                  {{ scope.row.recordDate || scope.row.createTime }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, scope.row)">
                    <span class="el-dropdown-link">
                      <el-icon class="more-icon"><MoreFilled /></el-icon>
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑记录</el-dropdown-item>
                        <el-dropdown-item command="delete" divided style="color: #f56c6c">删除记录</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>
           </div>
          <!-- 分页组件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="recordCurrentPage"
              v-model:page-size="recordPageSize"
              :total="filteredTableData.length"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
         </div>

        <!-- 编辑弹窗 -->
        <el-dialog v-model="editDialogVisible" title="编辑记录" width="400px">
            <el-form :model="editForm" label-width="80px">
                <el-form-item label="记录值">
                    <el-input v-model="editForm.recordValue" />
                </el-form-item>
                <el-form-item label="日期">
                     <el-date-picker v-model="editForm.recordDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitEdit">确定</el-button>
                </span>
            </template>
        </el-dialog>
      </div>

      <!-- 右侧：侧边工具栏 -->
      <div class="sidebar">
        <!-- 记录入口卡片 -->
        <div class="record-cta-card">
          <div class="cta-content">
            <h3>健康生活，从此刻开始</h3>
            <el-button type="info" class="cta-btn" round @click="goToRecord">去记录 &gt;</el-button>
          </div>
        </div>

        <!-- BMI 测算卡片 -->
        <el-card class="bmi-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">BMI测算</span>
            </div>
          </template>
          <div class="bmi-form">
            <div class="form-item">
              <label>身高(cm)</label>
              <el-input-number v-model="bmiForm.height" :precision="1" :step="0.5" :min="50" :max="250" controls-position="right" style="width: 100%" />
            </div>
            <div class="form-item">
              <label>体重(kg)</label>
              <el-input-number v-model="bmiForm.weight" :precision="1" :step="0.5" :min="20" :max="300" controls-position="right" style="width: 100%" />
            </div>
            <el-button type="primary" class="calc-btn" @click="calculateBMI">
              <el-icon><Compass /></el-icon> 立即测算BMI值
            </el-button>
            <div v-if="bmiResult" class="bmi-result" :class="bmiStatusClass">
              <div class="result-val">{{ bmiResult }}</div>
              <div class="result-label">{{ bmiStatusText }}</div>
            </div>
          </div>
        </el-card>

        <!-- 模型统计卡片 -->
        <el-card class="stats-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">模型统计</span>
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-num">{{ modelStats.publicCount }}</span>
              <span class="stat-label">全局模型</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ modelStats.privateCount }}</span>
              <span class="stat-label">我的模型</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch, nextTick, markRaw } from 'vue';
import { InfoFilled, Compass, MoreFilled } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import request from '@/utils/request.js';
import { ElMessage } from 'element-plus';

const router = useRouter();
const selectedModelId = ref(null);
const allModels = ref([]);
const timeRange = ref('month');
const modelFilter = ref('all');
const recordCurrentPage = ref(1);
const recordPageSize = ref(10);
const chartRef = ref(null);
let myChart = null;

const editDialogVisible = ref(false);
const editForm = reactive({
    id: null,
    modelId: null,
    recordValue: '',
    recordDate: ''
});

// 模型统计数据
const modelStats = ref({
  publicCount: 0,
  privateCount: 0
});

// 健康记录数据
const healthRecords = ref([]);

// 获取所有模型
const fetchAllModels = async () => {
  try {
    const [publicRes, privateRes] = await Promise.all([
      request.get('/healthModel/public'),
      request.get('/healthModel/private')
    ]);
    allModels.value = [...(publicRes.data || []), ...(privateRes.data || [])];
    
    if (allModels.value.length > 0 && !selectedModelId.value) {
      selectedModelId.value = allModels.value[0].id;
      // 初始化时获取数据
      fetchRecords();
      fetchChartData();
    }
  } catch (err) {
    console.error('获取模型列表失败:', err);
  }
};

// 获取所有健康记录
const fetchRecords = async () => {
  try {
    const res = await request.get('/healthModel/allRecords');
    if (res.data) {
       // 为记录添加名称（如果后端没返回的话）
       healthRecords.value = (res.data || []).map(record => {
         const model = allModels.value.find(m => m.id === record.modelId);
         return {
           ...record,
           itemName: record.itemName || (model ? model.name : '未知项目'),
           unit: record.unit || (model ? model.unit : '')
         };
       });
       // 表格数据更新完成，图表数据由 fetchChartData 单独处理
    }
  } catch (err) {
    healthRecords.value = [];
    console.warn('获取记录接口调用失败', err);
  }
};

// 获取模型统计
const fetchModelStats = async () => {
  try {
    const res = await request.get('/healthModel/stats');
    if (res.data) {
      modelStats.value = res.data;
    }
  } catch (err) {
    console.error('获取模型统计失败', err);
  }
};

const filteredTableData = computed(() => {
  let data = healthRecords.value;
  
  // 仅保留项目（模型）过滤
  if (modelFilter.value !== 'all') {
    data = data.filter(r => r.modelId === modelFilter.value);
  }
  
  return data;
});

// 分页后的表格数据
const paginatedRecords = computed(() => {
  const start = (recordCurrentPage.value - 1) * recordPageSize.value;
  const end = start + recordPageSize.value;
  return filteredTableData.value.slice(start, end);
});

const currentModelName = computed(() => {
  const model = allModels.value.find(m => m.id === selectedModelId.value);
  return model ? model.name : '健康数据';
});

const currentModelDescription = computed(() => {
  const model = allModels.value.find(m => m.id === selectedModelId.value);
  return model ? model.description : '暂无模型介绍';
});

const handleModelChange = () => {
  fetchRecords();
  fetchChartData();
};

const handleCommand = (command, row) => {
    if (command === 'edit') {
        handleEdit(row);
    } else if (command === 'delete') {
        handleDelete(row);
    }
};

const handleDelete = async (row) => {
    try {
        await request.delete(`/healthModel/record/${row.id}`);
        ElMessage.success('删除成功');
        fetchRecords();
        fetchChartData();
    } catch(err) {
        ElMessage.error('删除失败');
    }
};

const handleEdit = (row) => {
    editForm.id = row.id;
    editForm.modelId = row.modelId;
    editForm.recordValue = row.recordValue || row.value;
    editForm.recordDate = row.recordDate;
    editDialogVisible.value = true;
};

const submitEdit = async () => {
    try {
        // 使用 PUT 方法更新记录
        await request.put('/healthModel/record', editForm);
        ElMessage.success('修改成功');
        editDialogVisible.value = false;
        fetchRecords();
        fetchChartData();
    } catch(err) {
        ElMessage.error('修改失败');
    }
};

const bmiForm = reactive({
  height: 175.0,
  weight: 70.0
});
const bmiResult = ref(null);

const bmiStatusText = computed(() => {
  if (!bmiResult.value) return '';
  const val = parseFloat(bmiResult.value);
  if (val < 18.5) return '偏瘦';
  if (val < 24) return '正常';
  if (val < 28) return '超重';
  return '肥胖';
});

const bmiStatusClass = computed(() => {
  if (!bmiResult.value) return '';
  const val = parseFloat(bmiResult.value);
  if (val < 18.5) return 'underweight';
  if (val < 24) return 'healthy';
  if (val < 28) return 'overweight';
  return 'obese';
});

const calculateBMI = () => {
  const h = bmiForm.height / 100;
  const w = bmiForm.weight;
  bmiResult.value = (w / (h * h)).toFixed(1);
};

const goToRecord = () => {
  router.push('/user/records');
};

const fetchChartData = async () => {
    console.log('===== fetchChartData 开始 =====');
    console.log('selectedModelId:', selectedModelId.value);
    console.log('timeRange:', timeRange.value);
    
    if (!selectedModelId.value) {
        console.log('selectedModelId 为空，跳过');
        return;
    }
    
    // 计算时间范围
    const now = new Date();
    let startTime = new Date();
    let endTime = new Date();
    
    if (timeRange.value === 'week') {
      startTime.setDate(now.getDate() - 7);
      endTime.setDate(now.getDate() + 7);
    } else if (timeRange.value === 'month') {
      startTime.setMonth(now.getMonth() - 1);
      endTime.setMonth(now.getMonth() + 1);
    } else if (timeRange.value === 'quarter') {
      startTime.setMonth(now.getMonth() - 3);
      endTime.setMonth(now.getMonth() + 3);
    } else if (timeRange.value === 'year') {
      startTime.setFullYear(now.getFullYear() - 1);
      endTime.setFullYear(now.getFullYear() + 1);
    }
    
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    
    console.log('请求参数: startTime=', formatDate(startTime), ', endTime=', formatDate(endTime));
    
    try {
        const res = await request.get('/healthModel/records/range', {
            params: {
                startTime: formatDate(startTime),
                endTime: formatDate(endTime),
                _t: Date.now() // 防止缓存
            }
        });
        
        console.log('API 返回的原始数据:', res);
        
        if (myChart && !myChart.isDisposed()) {
            let chartData = [];
            if (res.data && res.data.length > 0) {
                 chartData = res.data
                    .filter(r => r.modelId === selectedModelId.value)
                    .sort((a, b) => new Date(a.recordDate || a.createTime) - new Date(b.recordDate || b.createTime));
            }
            
            console.log('展现的数据条数:', chartData.length);
            
            const xAxisData = chartData.map(r => r.recordDate || r.createTime);
            const seriesData = chartData.map(r => parseFloat(r.recordValue || r.value));
            
            myChart.setOption({
                xAxis: { data: xAxisData },
                series: [{ data: seriesData }]
            }); // 默认使用合并模式，保留 initChart 中的 yAxis/grid 等配置
            
            console.log('图表渲染更新');
        }
    } catch(err) {
        console.error('获取图表数据失败', err);
    }
    
    console.log('===== fetchChartData 结束 =====');
};

const initChart = () => {
    if (!chartRef.value) return;
    
    // 销毁旧实例
    if (myChart && !myChart.isDisposed()) {
        myChart.dispose();
    }
    
    myChart = markRaw(echarts.init(chartRef.value));
    
    myChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(70, 70, 70, 0.9)',
            borderColor: 'transparent',
            borderRadius: 8,
            textStyle: { 
                color: '#fff',
                fontSize: 13
            },
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#909399',
                    width: 1,
                    type: 'dashed'
                }
            },
            formatter: (params) => {
                const data = params[0];
                const model = allModels.value.find(m => m.id === selectedModelId.value);
                const unit = model ? model.unit : '';
                return `
                    <div style="padding: 4px;">
                        <div style="margin-bottom: 4px;">记录于: ${data.name}</div>
                        <div>记录值: ${data.value} ${unit}</div>
                    </div>
                `;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: [],
            axisLine: { lineStyle: { color: '#f0f0f0' } },
            axisLabel: { color: '#909399', fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f5f5f5' } },
            axisLabel: { color: '#909399' }
        },
        series: [{
            name: '测量值',
            type: 'line',
            smooth: true,
            data: [],
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#409EFF' },
            lineStyle: { color: '#409EFF', width: 2 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(64, 158, 255, 0.2)' },
                    { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
                ])
            },
            label: { show: true, position: 'top', color: '#333', fontSize: 12 }
        }]
    });
};

onMounted(async () => {
    // 先加载模型数据
    await fetchAllModels();
    fetchModelStats();
    
    // 然后初始化图表
    await nextTick();
    initChart();
    
    // 最后加载图表数据
    await nextTick();
    fetchChartData();
    
    window.addEventListener('resize', handleResize);
});

watch(timeRange, () => {
    fetchChartData();
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (myChart && !myChart.isDisposed()) {
        myChart.dispose();
        myChart = null;
    }
});

const handleResize = () => {
    if (myChart && !myChart.isDisposed()) {
        myChart.resize();
    }
};

watch(selectedModelId, () => {
    fetchRecords();
    fetchChartData();
});

watch(modelFilter, () => {
  recordCurrentPage.value = 1; // 过滤变更时重置页码
});
</script>

<style scoped>
.health-data-page {
  padding: 10px 24px;
  background-color: transparent;
  min-height: calc(100vh - 100px);
}

.data-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  padding: 0 0 20px 0;
}

/* 主内容布局 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.intro-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.intro-tip {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.info-icon {
  color: #909399;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.intro-tip p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

/* 图表卡片 */
.chart-card {
  border-radius: 16px;
  border: none;
  background-color: white;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.time-filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 13px;
  color: #909399;
}

.echarts-container {
  height: 400px;
  width: 100%;
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 记录表格区域 */
.records-table-section {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-right {
  display: flex;
  align-items: center;
}

.status-legend {
  display: flex;
  gap: 24px;
}

.records-container :deep(.el-table) {
  --el-table-border-color: #f0f0f0;
  --el-table-header-text-color: #909399;
}

.records-container :deep(.el-table__row) {
  height: 60px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-bottom: 24px;
  padding-right: 4px;
}

/* 自定义分页样式，匹配图片 */
.pagination-container :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #f2f2f2 !important;
  color: #1a1a1a !important;
  font-weight: 700;
}

.pagination-container :deep(.el-pagination.is-background .el-pager li) {
  background-color: transparent;
  color: #606266;
  min-width: 32px;
  border-radius: 4px;
}

.record-value {
  font-weight: 600;
  color: #1a1a1a;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-custom, .status-legend {
  display: flex;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.normal { background-color: #67c23a; }
.dot.abnormal { background-color: #f56c6c; }

.more-icon {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.more-icon:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 侧边栏布局 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.record-cta-card {
  background-color: #e9eaed;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.cta-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px 0;
}

.cta-btn {
  background-color: #1a1a1a !important;
  border-color: #1a1a1a !important;
  color: white !important;
  padding: 8px 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.bmi-card, .stats-card {
  border-radius: 16px;
  border: none;
}

.bmi-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #606266;
}

.calc-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  margin-top: 8px;
}

.bmi-result {
  margin-top: 12px;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fadeIn 0.4s ease-out;
}

.result-val {
  font-size: 24px;
  font-weight: 800;
}

.result-label {
  font-size: 14px;
  font-weight: 600;
}

.bmi-result.healthy { background-color: #f0f9eb; color: #67c23a; }
.bmi-result.underweight { background-color: #fdf6ec; color: #e6a23c; }
.bmi-result.overweight, .bmi-result.obese { background-color: #fef0f0; color: #f56c6c; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 10px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-item:first-child {
  border-right: 1px solid #f0f0f0;
}

.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.chart-header {
  margin-bottom: 16px;
}

:deep(.el-radio-button__inner) {
  border-radius: 6px !important;
  border: none !important;
  background-color: transparent !important;
  color: #909399 !important;
  padding: 8px 16px !important;
}

:deep(.is-active .el-radio-button__inner) {
  background-color: #f5f7fa !important;
  color: #1a1a1a !important;
  box-shadow: none !important;
  font-weight: 600;
}
</style>
