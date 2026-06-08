<template>
  <div class="stats-page">
    <el-row :gutter="20" class="overview-row">
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
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon rate">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.overview?.completionRate || 0 }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="detail-row">
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>各阶段完成情况</span>
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
                :stroke-width="12"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>预算与付款</span>
            </div>
          </template>
          <div class="budget-summary">
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
            <div class="progress-section">
              <div class="progress-header">
                <span class="label">预算使用率</span>
                <span class="value">{{ stats?.budget?.budgetProgress }}%</span>
              </div>
              <el-progress
                :percentage="stats?.budget?.budgetProgress || 0"
                :stroke-width="12"
                :color="(stats?.budget?.budgetProgress || 0) > 90 ? '#f56c6c' : '#67c23a'"
              />
            </div>
            <div class="divider"></div>
            <div class="budget-item">
              <span class="label">合同总金额</span>
              <span class="value">¥{{ formatMoney(stats?.payment?.totalContractAmount) }}</span>
            </div>
            <div class="budget-item">
              <span class="label">已付款</span>
              <span class="value paid">¥{{ formatMoney(stats?.payment?.totalPaidAmount) }}</span>
            </div>
            <div class="progress-section">
              <div class="progress-header">
                <span class="label">付款进度</span>
                <span class="value">{{ stats?.payment?.paymentProgress }}%</span>
              </div>
              <el-progress
                :percentage="stats?.payment?.paymentProgress || 0"
                :stroke-width="12"
                color="#409eff"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="vendors-row">
      <el-col :span="12">
        <el-card class="vendors-card">
          <template #header>
            <div class="card-header">
              <span>供应商概况</span>
            </div>
          </template>
          <div class="vendor-stats">
            <div class="vendor-stat">
              <div class="vendor-stat-icon">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="vendor-stat-content">
                <div class="vendor-stat-value">{{ stats?.vendors?.total || 0 }}</div>
                <div class="vendor-stat-label">已预订</div>
              </div>
            </div>
            <div class="vendor-stat confirmed">
              <div class="vendor-stat-icon">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="vendor-stat-content">
                <div class="vendor-stat-value">{{ stats?.vendors?.confirmed || 0 }}</div>
                <div class="vendor-stat-label">已确认</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useStatsStore } from "@/store";
import type { DashboardStats } from "@/types";

const statsStore = useStatsStore();

const stats = ref<DashboardStats | null>(null);

const formatMoney = (value?: number) => {
  if (!value) return "0";
  return value.toLocaleString("zh-CN");
};

onMounted(async () => {
  stats.value = await statsStore.fetchDashboardStats();
});
</script>

<style scoped>
.stats-page {
  padding: 0;
}

.overview-row {
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

.stat-icon.tasks {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.detail-row {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #333;
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.budget-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 10px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-item .label {
  font-size: 14px;
  color: #666;
}

.budget-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.budget-item .value.spent,
.budget-item .value.paid {
  color: #e6a23c;
}

.budget-item .value.remaining {
  color: #67c23a;
}

.progress-section {
  margin-top: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-header .label {
  font-size: 14px;
  color: #666;
}

.progress-header .value {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}

.vendors-row {
  margin-bottom: 20px;
}

.vendor-stats {
  display: flex;
  gap: 40px;
  padding: 20px 10px;
}

.vendor-stat {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  flex: 1;
}

.vendor-stat.confirmed {
  background: #f0f9ff;
}

.vendor-stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409eff;
  background: #e6f3ff;
}

.vendor-stat.confirmed .vendor-stat-icon {
  color: #67c23a;
  background: #e6f7e6;
}

.vendor-stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.vendor-stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>
