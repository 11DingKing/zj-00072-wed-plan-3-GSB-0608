<template>
  <div class="my-tasks-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的任务</span>
        </div>
      </template>
      <el-table :data="myTasks" style="width: 100%">
        <el-table-column prop="title" label="任务名称" min-width="200" />
        <el-table-column prop="phase" label="阶段" width="120" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleUpdateStatus(row)">更新状态</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="更新任务状态" width="400px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="任务名称">
          <span>{{ currentTask?.title }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option label="待开始" value="待开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已跳过" value="已跳过" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useChecklistStore } from "@/store";
import type { Checklist, ChecklistPriority, ChecklistStatus } from "@/types";

const checklistStore = useChecklistStore();

const myTasks = ref<Checklist[]>([]);
const dialogVisible = ref(false);
const saving = ref(false);
const currentTask = ref<Checklist | null>(null);

const statusForm = reactive({
  status: "待开始" as ChecklistStatus,
});

const getPriorityType = (priority: ChecklistPriority) => {
  const map: Record<ChecklistPriority, string> = {
    高: "danger",
    中: "warning",
    低: "info",
  };
  return map[priority] || "info";
};

const getStatusType = (status: ChecklistStatus) => {
  const map: Record<ChecklistStatus, string> = {
    待开始: "info",
    进行中: "warning",
    已完成: "success",
    已跳过: "info",
  };
  return map[status] || "info";
};

const handleUpdateStatus = (row: Checklist) => {
  currentTask.value = row;
  statusForm.status = row.status;
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!currentTask.value) return;

  try {
    saving.value = true;
    await checklistStore.updateChecklist(currentTask.value.id, {
      status: statusForm.status,
    });
    ElMessage.success("更新成功");
    dialogVisible.value = false;
    // 刷新列表
    myTasks.value = await checklistStore.fetchMyTasks();
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  myTasks.value = await checklistStore.fetchMyTasks();
});
</script>

<style scoped>
.my-tasks-page {
  padding: 0;
}

.card-header {
  font-weight: 600;
  color: #333;
}
</style>
