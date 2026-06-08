<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card countdown-card">
          <div class="stat-icon days">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.overview?.daysUntilWedding || 0 }}</div>
            <div class="stat-label">距离婚礼天数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon tasks">
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.overview?.totalTasks || 0 }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon completed">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.overview?.completedTasks || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon overdue">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value overdue">{{ stats?.overview?.overdueTasks || 0 }}</div>
            <div class="stat-label">已逾期</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="progress-row">
      <el-col :span="12">
        <el-card class="progress-card">
          <template #header>
            <div class="card-header">
              <span>整体进度</span>
            </div>
          </template>
          <el-progress
            type="dashboard"
            :percentage="stats?.overview?.completionRate || 0"
            :color="progressColor"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="progress-card">
          <template #header>
            <div class="card-header">
              <span>预算执行</span>
            </div>
          </template>
          <div class="budget-info">
            <div class="budget-item">
            <span class="label">总预算</span>
            <span class="value">¥{{ formatMoney(stats?.budget?.totalBudget) }}</span>
          </div>
          <div class="budget-item">
            <span class="label">已支出</span>
            <span class="value spent">¥{{ formatMoney(stats?.budget?.totalSpent) }}</span>
          </div>
          <div class="budget-item">
            <span class="label">剩余</span>
            <span class="value remaining">¥{{ formatMoney(stats?.budget?.remaining) }}</span>
          </div>
          </div>
          <el-progress
            :percentage="stats?.budget?.budgetProgress || 0"
            :color="(stats?.budget?.budgetProgress || 0) > 90 ? '#f56c6c' : '#67c23a'"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tasks-row">
      <el-col :span="12">
        <el-card class="tasks-card">
          <template #header>
            <div class="card-header">
              <span>各阶段完成率</span>
            </div>
          </template>
          <div class="phase-list">
            <div v-for="(tasks, phase) in stats?.phaseCompletion" :key="phase" class="phase-item">
              <div class="phase-header">
                <span class="phase-name">{{ phase }}</span>
                <span class="phase-count">{{ tasks.completed }}/{{ tasks.total }}</span>
              </div>
              <el-progress
                :percentage="tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0"
                :stroke-width="8"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="tasks-card">
          <template #header>
            <div class="card-header">
              <span>供应商概况</span>
            </div>
          </template>
          <div class="vendor-summary">
            <div class="vendor-stat">
              <span class="label">已预订</span>
              <span class="value">{{ stats?.vendors?.total || 0 }} 家</span>
            </div>
            <div class="vendor-stat">
              <span class="label">已确认</span>
              <span class="value confirmed">{{ stats?.vendors?.confirmed || 0 }} 家</span>
            </div>
            <div class="payment-progress">
              <div class="payment-header">
                <span class="label">付款进度</span>
                <span class="value">{{ stats?.payment?.paymentProgress?.toFixed(1) }}%</span>
              </div>
              <el-progress
                :percentage="stats?.payment?.paymentProgress || 0"
                :stroke-width="8"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useStatsStore } from "@/store";
import type { DashboardStats } from "@/types";

const statsStore = useStatsStore();

const stats = ref<DashboardStats | null>(null);

const progressColor = computed(() => {
  const rate = stats.value?.overview?.completionRate || 0;
  if (rate < 30) return "#f56c6c";
  if (rate < 70) return "#e6a23c";
  return "#67c23a";
});

const formatMoney = (value?: number) => {
  if (!value) return "0";
  return value.toLocaleString("zh-CN");
};

onMounted(async () => {
  stats.value = await statsStore.fetchDashboardStats();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.days {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-value.overdue {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.progress-row {
  margin-bottom: 20px;
}

.progress-card {
  text-align: center;
}

.card-header {
  font-weight: 600;
  color: #333;
}

.budget-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.budget-item {
  text-align: center;
}

.budget-item .label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.budget-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.budget-item .value.spent {
  color: #e6a23c;
}

.budget-item .value.remaining {
  color: #67c23a;
}

.tasks-row {
  margin-bottom: 20px;
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.phase-item {
  padding: 0 10px;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.phase-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.phase-count {
  font-size: 12px;
  color: #999;
}

.vendor-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.vendor-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.vendor-stat .label {
  font-size: 14px;
  color: #666;
}

.vendor-stat .value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.vendor-stat .value.confirmed {
  color: #67c23a;
}

.payment-progress {
  padding: 0 10px;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.payment-header .label {
  font-size: 14px;
  color: #666;
}

.payment-header .value {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}
</style>
