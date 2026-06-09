<template>
  <div class="change-log-panel">
    <h4>变更历史</h4>

    <div class="timeline" v-if="changeLogs.length > 0">
      <el-timeline>
        <el-timeline-item
          v-for="log in changeLogs"
          :key="log.id"
          :timestamp="formatTime(log.modifiedAt)"
          placement="top"
        >
          <el-card shadow="hover" size="small">
            <div class="log-header">
              <el-avatar :size="24">{{
                log.modifiedBy.name.charAt(0)
              }}</el-avatar>
              <span class="log-author">{{ log.modifiedBy.name }}</span>
              <el-tag :type="getEntityTagType(log.entityType)" size="small">
                {{ getEntityTypeName(log.entityType) }}
              </el-tag>
            </div>
            <div class="log-content">
              <p class="log-field">
                字段: <strong>{{ getFieldDisplayName(log.fieldName) }}</strong>
              </p>
              <div class="log-values">
                <span v-if="log.oldValue" class="old-value">
                  旧值: {{ log.oldValue }}
                </span>
                <span class="arrow">→</span>
                <span class="new-value">
                  新值: {{ log.newValue || "(空)" }}
                </span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <el-empty v-else description="暂无变更记录" :image-size="100" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { changelogAPI } from "../api";
import type { ChangeLog, ChangeEntityType } from "../types";

const props = defineProps<{
  entityType?: ChangeEntityType;
  entityId?: number;
}>();

const changeLogs = ref<ChangeLog[]>([]);

const loadChangeLogs = async () => {
  try {
    const response = await changelogAPI.getChangeLogs(
      props.entityType,
      props.entityId,
    );
    changeLogs.value = response.data;
  } catch (error) {
    ElMessage.error("加载变更历史失败");
  }
};

const getEntityTypeName = (type: ChangeEntityType) => {
  const names: Record<ChangeEntityType, string> = {
    wedding: "婚礼信息",
    budget: "预算",
    vendor: "供应商",
    schedule: "当天日程",
  };
  return names[type] || type;
};

const getEntityTagType = (type: ChangeEntityType) => {
  const types: Record<ChangeEntityType, string> = {
    wedding: "success",
    budget: "warning",
    vendor: "primary",
    schedule: "info",
  };
  return types[type] || "info";
};

const getFieldDisplayName = (fieldName: string) => {
  const fieldNames: Record<string, string> = {
    groomName: "新郎姓名",
    brideName: "新娘姓名",
    weddingDate: "婚礼日期",
    location: "婚礼地点",
    totalBudget: "总预算",
    theme: "婚礼主题",
    description: "描述",
    contractAmount: "合同金额",
    paidAmount: "已付金额",
    paymentStatus: "付款状态",
    isConfirmed: "确认状态",
    budgetLimit: "预算上限",
    actualSpent: "实际支出",
    name: "名称",
    type: "类型",
    contactPerson: "联系人",
    phone: "电话",
    email: "邮箱",
    address: "地址",
    notes: "备注",
    bookingDate: "预订日期",
  };
  return fieldNames[fieldName] || fieldName;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

watch(
  () => [props.entityType, props.entityId],
  () => {
    loadChangeLogs();
  },
  { immediate: true },
);
</script>

<style scoped>
.change-log-panel {
  margin-top: 20px;
}

.change-log-panel h4 {
  margin-bottom: 15px;
  color: #303133;
}

.timeline {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.log-author {
  font-weight: 500;
  color: #303133;
}

.log-content {
  margin-left: 34px;
}

.log-field {
  margin: 0 0 8px 0;
  color: #606266;
}

.log-values {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.old-value {
  padding: 2px 8px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: line-through;
}

.arrow {
  color: #909399;
  font-weight: bold;
}

.new-value {
  padding: 2px 8px;
  background: #f0f9ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
}
</style>
