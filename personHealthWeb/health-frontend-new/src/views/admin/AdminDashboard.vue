<template>
  <div class="dashboard-container">
    <div class="main-split-layout">
      <!-- Left Section: 4 Stats Cards + Line Chart -->
      <div class="left-section">
        <el-row :gutter="20" class="stats-grid">
          <el-col :span="6">
            <el-card shadow="never" class="stat-card">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-main">
                    <span class="stat-value">{{ dashboardStats.totalUsers }}</span>
                    <span class="stat-unit">人</span>
                  </div>
                  <div class="stat-label">存量用户</div>
                </div>
                <div class="stat-icon-wrapper user-bg">
                  <el-icon><User /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never" class="stat-card">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-main">
                    <span class="stat-value">{{ dashboardStats.totalModels }}</span>
                    <span class="stat-unit">套</span>
                  </div>
                  <div class="stat-label">收录模型ssss</div>
                </div>
                <div class="stat-icon-wrapper model-bg">
                  <el-icon><Fold /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never" class="stat-card">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-main">
                    <span class="stat-value">{{ dashboardStats.totalArticles }}</span>
                    <span class="stat-unit">篇</span>
                  </div>
                  <div class="stat-label">收录资讯</div>
                </div>
                <div class="stat-icon-wrapper news-bg">
                  <el-icon><Document /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never" class="stat-card">
              <div class="stat-content">
                <div class="stat-info">
                  <div class="stat-main">
                    <span class="stat-value">{{ dashboardStats.totalRecipes }}</span>
                    <span class="stat-unit">本</span>
                  </div>
                  <div class="stat-label">收录食谱</div>
                </div>
                <div class="stat-icon-wrapper recipe-bg">
                  <el-icon><KnifeFork /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="line-chart-card">
          <div class="chart-header">
            <span class="chart-title">健康模型收录情况</span>
            <div class="time-filter-container">
              <span class="filter-label">时间选择</span>
              <div class="tab-group">
              <button 
                v-for="item in [
                  { label: '一周内', value: 'week' },
                  { label: '一个月内', value: 'month' },
                  { label: '三个月内', value: 'quarter' },
                  { label: '一年内', value: 'year' }
                ]" 
                :key="item.value"
                :class="['tab-btn', { 'active': timeRange === item.value }]"
                @click="timeRange = item.value"
              >
                {{ item.label }}
              </button>
            </div>
            </div>
          </div>
          <div ref="lineChartRef" class="chart-container-line"></div>
        </el-card>
      </div>

      <!-- Right Section: 2 Donut Charts -->
      <div class="right-section">
        <el-card shadow="never" class="side-charts-card">
          <div class="side-chart-group">
            <h3 class="side-chart-title">资讯内容占比</h3>
            <div ref="infoDonutRef" class="donut-container"></div>
          </div>
          <div class="side-divider"></div>
          <div class="side-chart-group">
            <h3 class="side-chart-title">食谱内容占比</h3>
            <div ref="recipeDonutRef" class="donut-container"></div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, markRaw, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { User, Fold, Document, KnifeFork } from '@element-plus/icons-vue';
import request from '@/utils/request.js';

const router = useRouter();

// Dashboard Overall Stats
const dashboardStats = ref({
  totalUsers: 0,
  totalModels: 0,
  totalArticles: 0,
  totalRecipes: 0
});

const fetchStats = async () => {
  try {
    const res = await request.get('/admin/stats');
    if (res.code === 200 || res.code === 0) {
      dashboardStats.value = res.data;
    }
  } catch (err) {
    console.error('获取统计数据失败:', err);
  }
};

const timeRange = ref('week');
const lineChartRef = ref(null);
const infoDonutRef = ref(null);
const recipeDonutRef = ref(null);

let lineChart = null;
let infoDonut = null;
let recipeDonut = null;

const lineData = ref({ dates: [], counts: [] });
const infoData = ref([]);
const recipeData = ref([]);

const fetchLineData = async () => {
  try {
    const res = await request.get('/admin/chart/model-collection', { params: { range: timeRange.value } });
    if (res.code === 200 || res.code === 0) {
      lineData.value = res.data;
      updateLineChart();
    }
  } catch (err) {
    console.error('获取折线图数据失败:', err);
  }
};

const fetchDonutData = async () => {
  try {
    const [infoRes, recipeRes] = await Promise.all([
      request.get('/admin/chart/article-ratio'),
      request.get('/admin/chart/recipe-ratio')
    ]);
    if (infoRes.code === 200 || infoRes.code === 0) infoData.value = infoRes.data;
    if (recipeRes.code === 200 || recipeRes.code === 0) recipeData.value = recipeRes.data;
    updateInfoDonut();
    updateRecipeDonut();
  } catch (err) {
    console.error('获取饼图数据失败，详细错误信息:', err);
  }
};

const updateLineChart = () => {
  if (!lineChartRef.value || !lineData.value.dates.length) return;
  const dom = lineChartRef.value;
  if (dom.clientWidth > 0 && dom.clientHeight > 0) {
    if (!lineChart) {
      lineChart = markRaw(echarts.init(dom));
    }
    lineChart.setOption({
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 0,
        textStyle: { color: '#666' },
        extraCssText: 'box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 8px;'
      },
      grid: { left: '3%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: lineData.value.dates,
        axisLine: { show: true, lineStyle: { color: '#666' } },
        axisTick: { show: false },
        axisLabel: { color: '#606266', margin: 15, fontSize: 13 }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#d1d5db', type: 'solid' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#606266', fontSize: 13 }
      },
      series: [
        {
          name: '收录情况',
          type: 'line',
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 6,
          data: lineData.value.counts,
          itemStyle: { color: '#409eff', borderWidth: 2, borderColor: '#fff' },
          lineStyle: { width: 4, color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.2)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
            ])
          },
          label: { 
            show: true, 
            position: 'top', 
            color: '#606266',
            fontSize: 14,
            fontWeight: '500',
            formatter: '{c}',
            offset: [0, -5]
          }
        }
      ]
    });
  }
};

const createDonutOption = (name, data, colors) => ({
  tooltip: { trigger: 'item' },
  legend: {
    orient: 'horizontal',
    bottom: '0%',
    left: 'center',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 15,
    textStyle: { color: '#606266', fontSize: 12 }
  },
  series: [
    {
      name: name,
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 2 },
      label: { 
        show: true, 
        position: 'outside',
        formatter: '{b}',
        color: '#606266',
        fontSize: 12
      },
      labelLine: { 
        show: true,
        length: 10,
        length2: 10,
        lineStyle: { color: '#9ca3af' }
      },
      data: data.map((item, idx) => ({ ...item, itemStyle: { color: colors[idx % colors.length] } }))
    }
  ]
});

const updateInfoDonut = () => {
  if (!infoDonutRef.value || !infoData.value.length) return;
  const dom = infoDonutRef.value;
  if (dom.clientWidth > 0 && dom.clientHeight > 0) {
    if (!infoDonut) {
      infoDonut = markRaw(echarts.init(dom));
    }
    const infoColors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9b59b6', '#34495e'];
    infoDonut.setOption(createDonutOption('资讯内容占比', infoData.value, infoColors));
  }
};

const updateRecipeDonut = () => {
  if (!recipeDonutRef.value || !recipeData.value.length) return;
  const dom = recipeDonutRef.value;
  if (dom.clientWidth > 0 && dom.clientHeight > 0) {
    if (!recipeDonut) {
      recipeDonut = markRaw(echarts.init(dom));
    }
    recipeDonut.setOption(createDonutOption('食谱内容占比', recipeData.value, ['#409eff', '#67c23a', '#e6a23c']));
  }
};

const initCharts = () => {
  updateLineChart();
  updateInfoDonut();
  updateRecipeDonut();
};

const handleResize = () => {
  lineChart?.resize();
  infoDonut?.resize();
  recipeDonut?.resize();
};

let resizeObserver = null;

watch(timeRange, () => {
  fetchLineData();
});

onMounted(() => {
  fetchStats();
  fetchLineData();
  fetchDonutData();
  
  // Use ResizeObserver for robust chart initialization and resizing
  resizeObserver = new ResizeObserver(() => {
    initCharts();
    handleResize();
  });

  nextTick(() => {
    [lineChartRef, infoDonutRef, recipeDonutRef].forEach(ref => {
      if (ref.value) resizeObserver.observe(ref.value);
    });
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  lineChart?.dispose();
  infoDonut?.dispose();
  recipeDonut?.dispose();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent scrolling */
}


/* Split Layout */
.main-split-layout {
  display: flex;
  gap: 5px;
  flex: 1;
  min-height: 0; /* Important for children flex height */
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  min-height: 0; /* Ensure it can shrink/expand properly */
}

.right-section {
  width: 400px;
  flex-shrink: 0;
}

/* Stats Cards */
.stats-grid {
  margin-bottom: 0;
  flex-shrink: 0;
}

.stat-card {
  border: none;
  border-radius: 12px;
  background: #fff;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
}

.stat-main {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-unit {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.stat-unit {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

/* Icon Backgrounds */
.user-bg { background: #ecf5ff; color: #409eff; }
.model-bg { background: #f0f9eb; color: #67c23a; }
.news-bg { background: #fdf6ec; color: #e6a23c; }
.recipe-bg { background: #fef0f0; color: #f56c6c; }

/* Line Chart Card */
.line-chart-card {
  border: none;
  border-radius: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 5px 0;
}

.chart-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.time-filter-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 12px;
  color: #999;
}

/* 自定义时间切换样式 (同步用户端) */
.tab-group {
  display: inline-flex;
  padding: 3px;
  background-color: #f2f2f2;
  border-radius: 10px;
  gap: 3px;
}

.tab-btn {
  padding: 5px 16px;
  font-size: 13px;
  border: none;
  background-color: transparent;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  font-weight: 500;
  outline: none;
}

.tab-btn:hover {
  color: #303133;
}

.tab-btn.active {
  background-color: #fff;
  color: #303133;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-container-line {
  width: 100%;
  height: 400px;
}

/* Side Charts Card */
.side-charts-card {
  border: none;
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.side-chart-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px 0;
  min-height: 0;
}

.side-chart-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: right;
  margin: 0 10px 10px 0;
  flex-shrink: 0;
}

.donut-container {
  flex: 1;
  width: 100%;
  min-height: 220px;
}

.side-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 15px;
  flex-shrink: 0;
}

:deep(.el-card__body) {
  padding: 12px !important;
  height: 100%;
  box-sizing: border-box;
}

/* For small screens, allow content to fit but keep layout compact */
@media (max-height: 800px) {
  .stat-value { font-size: 26px; }
  .stat-icon-wrapper { width: 34px; height: 34px; }
  .page-title { font-size: 30px; }
  .dashboard-header { margin-bottom: 12px; }
}
</style>