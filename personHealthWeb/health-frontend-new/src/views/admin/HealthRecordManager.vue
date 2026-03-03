<template>
  <div class="health-record-container">
    <!-- Article Table Card -->
    <el-tabs v-model="activeTab" class="record-tabs" @tab-change="handleTabChange">
      <!-- 健康指标 Tab -->
      <el-tab-pane label="健康指标" name="metrics">
        <div class="tab-toolbar">
          <el-date-picker
            v-model="metricsDate"
            type="date"
            placeholder="按日期筛选"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            class="date-picker"
            @change="fetchMetrics"
          />
        </div>
        <el-card shadow="never" class="table-card">
          <el-table :data="metricsList" style="width: 100%" v-loading="metricsLoading">
            <el-table-column label="用户名" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="cell-text bold">{{ row.username || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="身高(cm)" width="100" sortable prop="height">
              <template #default="{ row }">{{ row.height }}</template>
            </el-table-column>
            <el-table-column label="体重(kg)" width="100" sortable prop="weight">
              <template #default="{ row }">{{ row.weight }}</template>
            </el-table-column>
            <el-table-column label="低压(mmHg)" width="120" sortable prop="lowTension">
              <template #default="{ row }">{{ row.lowTension }}</template>
            </el-table-column>
            <el-table-column label="高压(mmHg)" width="120" sortable prop="highPressure">
              <template #default="{ row }">{{ row.highPressure }}</template>
            </el-table-column>
            <el-table-column label="血糖(mmol/L)" width="130" sortable prop="bloodSugar">
              <template #default="{ row }">{{ row.bloodSugar }}</template>
            </el-table-column>
            <el-table-column label="心率(bpm)" width="110" sortable prop="heartRate">
              <template #default="{ row }">{{ row.heartRate }}</template>
            </el-table-column>
            <el-table-column label="记录日期" min-width="120" sortable prop="updateTime">
              <template #default="{ row }">{{ row.updateTime || '--' }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <span class="total-text">共 {{ metricsTotal }} 条</span>
            <el-pagination
              v-model:current-page="metricsPage"
              v-model:page-size="metricsSize"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes"
              :total="metricsTotal"
              @size-change="fetchMetrics"
              @current-change="fetchMetrics"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 运动记录 Tab -->
      <el-tab-pane label="运动记录" name="sport">
        <div class="tab-toolbar">
          <el-date-picker
            v-model="sportDate"
            type="date"
            placeholder="按日期筛选"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            class="date-picker"
            @change="fetchSport"
          />
        </div>
        <el-card shadow="never" class="table-card">
          <el-table :data="sportList" style="width: 100%" v-loading="sportLoading">
            <el-table-column label="用户名" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="cell-text bold">{{ row.username || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="运动类型" width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ row.sportsType || '--' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="运动时长(min)" width="130" sortable prop="sportDuration">
              <template #default="{ row }">{{ row.sportDuration }}</template>
            </el-table-column>
            <el-table-column label="运动距离(km)" width="130" sortable prop="sportDistance">
              <template #default="{ row }">{{ row.sportDistance }}</template>
            </el-table-column>
            <el-table-column label="卡路里(kcal)" width="130" sortable prop="calorie">
              <template #default="{ row }">{{ row.calorie }}</template>
            </el-table-column>
            <el-table-column label="记录日期" min-width="120" sortable prop="updateTime">
              <template #default="{ row }">{{ row.updateTime || '--' }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <span class="total-text">共 {{ sportTotal }} 条</span>
            <el-pagination
              v-model:current-page="sportPage"
              v-model:page-size="sportSize"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes"
              :total="sportTotal"
              @size-change="fetchSport"
              @current-change="fetchSport"
            />
          </div>
        </el-card>
      </el-tab-pane>



      <!-- 睡眠记录 Tab -->
      <el-tab-pane label="睡眠记录" name="sleep">
        <div class="tab-toolbar">
          <el-date-picker
            v-model="sleepDate"
            type="date"
            placeholder="按日期筛选"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            class="date-picker"
            @change="fetchSleep"
          />
        </div>
        <el-card shadow="never" class="table-card">
          <el-table :data="sleepList" style="width: 100%" v-loading="sleepLoading">
            <el-table-column label="用户名" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="cell-text bold">{{ row.username || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="入睡时间" width="120">
              <template #default="{ row }">{{ row.sleepOnsetTime || '--' }}</template>
            </el-table-column>
            <el-table-column label="起床时间" width="120">
              <template #default="{ row }">{{ row.wakeUpTime || '--' }}</template>
            </el-table-column>
            <el-table-column label="睡眠时长(h)" width="130" sortable prop="sleepDuration">
              <template #default="{ row }">
                {{ row.sleepDuration ? Number(row.sleepDuration).toFixed(1) : '--' }}
              </template>
            </el-table-column>
            <el-table-column label="睡眠质量" width="120">
              <template #default="{ row }">
                <el-tag 
                  size="small" 
                  :type="getSleepQualityType(row.sleepQuality)"
                >
                  {{ row.sleepQuality || '--' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="记录日期" min-width="120" sortable prop="updateTime">
              <template #default="{ row }">{{ row.updateTime || '--' }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <span class="total-text">共 {{ sleepTotal }} 条</span>
            <el-pagination
              v-model:current-page="sleepPage"
              v-model:page-size="sleepSize"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes"
              :total="sleepTotal"
              @size-change="fetchSleep"
              @current-change="fetchSleep"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import { useTokenStore } from '@/stores/token';

const router = useRouter();
const tokenStore = useTokenStore();

// Active Tab
const activeTab = ref('metrics');

// ====== 健康指标 ======
const metricsLoading = ref(false);
const metricsList = ref([]);
const metricsTotal = ref(0);
const metricsPage = ref(1);
const metricsSize = ref(10);
const metricsDate = ref(null);

const fetchMetrics = async () => {
  metricsLoading.value = true;
  try {
    const res = await request.get('/healthRecord/healthMetricsList', {
      params: {
        pageNum: metricsPage.value,
        pageSize: metricsSize.value,
        updateTime: metricsDate.value || undefined
      }
    });
    if (res.code === 200 || res.code === 0) {
      metricsList.value = res.data.records || [];
      metricsTotal.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('获取健康指标失败:', err);
  } finally {
    metricsLoading.value = false;
  }
};

// ====== 运动记录 ======
const sportLoading = ref(false);
const sportList = ref([]);
const sportTotal = ref(0);
const sportPage = ref(1);
const sportSize = ref(10);
const sportDate = ref(null);

const fetchSport = async () => {
  sportLoading.value = true;
  try {
    const res = await request.get('/healthRecord/sportRecordList', {
      params: {
        pageNum: sportPage.value,
        pageSize: sportSize.value,
        updateTime: sportDate.value || undefined
      }
    });
    if (res.code === 200 || res.code === 0) {
      sportList.value = res.data.records || [];
      sportTotal.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('获取运动记录失败:', err);
  } finally {
    sportLoading.value = false;
  }
};



// ====== 睡眠记录 ======
const sleepLoading = ref(false);
const sleepList = ref([]);
const sleepTotal = ref(0);
const sleepPage = ref(1);
const sleepSize = ref(10);
const sleepDate = ref(null);

const fetchSleep = async () => {
  sleepLoading.value = true;
  try {
    const res = await request.get('/healthRecord/sleepRecordlist', {
      params: {
        pageNum: sleepPage.value,
        pageSize: sleepSize.value,
        updateTime: sleepDate.value || undefined
      }
    });
    if (res.code === 200 || res.code === 0) {
      sleepList.value = res.data.records || [];
      sleepTotal.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('获取睡眠记录失败:', err);
  } finally {
    sleepLoading.value = false;
  }
};

// ====== Common ======
const formatTime = (time) => {
  if (!time) return '--';
  return time.replace('T', ' ').substring(0, 19);
};

const getSleepQualityType = (quality) => {
  if (!quality) return 'info';
  if (quality.includes('好') || quality.includes('优')) return 'success';
  if (quality.includes('差') || quality.includes('低')) return 'danger';
  return '';
};

const handleTabChange = (tab) => {
  if (tab === 'metrics' && metricsList.value.length === 0) fetchMetrics();
  if (tab === 'sport' && sportList.value.length === 0) fetchSport();
  if (tab === 'sleep' && sleepList.value.length === 0) fetchSleep();
};

onMounted(() => {
  fetchMetrics(); // Load the default tab
});
</script>

<style scoped>
.health-record-container {
  padding: 16px 16px 24px 16px; /* Restored some top padding, reduced side padding */
}

.health-info-container {
  padding: 0;
}

/* Tabs */
.record-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.record-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e5e7eb;
}

.record-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  padding: 0 24px;
  height: 46px;
  line-height: 46px;
}

.record-tabs :deep(.el-tabs__item.is-active) {
  color: #10b981;
  font-weight: 600;
}

.record-tabs :deep(.el-tabs__active-bar) {
  background-color: #10b981;
}

/* Toolbar */
.tab-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 0;
}

.date-picker {
  width: 200px;
}

.date-picker :deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: #f9fafb;
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

/* Table Card */
.table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.cell-text {
  color: #374151;
}

.cell-text.bold {
  font-weight: 600;
  color: #1a1a1a;
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
  border-top: 1px solid #f0f0f0;
}

.total-text {
  color: #6b7280;
  font-size: 13px;
}
</style>
