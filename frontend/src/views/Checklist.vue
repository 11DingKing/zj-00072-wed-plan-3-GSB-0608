<template>
  <div class="checklist-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>筹备清单</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canAdd">添加任务</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activePhase">
        <el-tab-pane
          v-for="phase in phases"
          :key="phase"
          :label="phase"
          :name="phase"
        >
          <el-table :data="getTasksByPhase(phase)" style="width: 100%">
            <el-table-column prop="title" label="任务名称" min-width="200" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
            <el-table-column label="负责人" width="120">
              <template #default="{ row }">
                {{ row.assignee?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280">
              <template #default="{ row }">
                <el-button size="small" @click="handleDetail(row)">详情</el-button>
                <el-button size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!isAdmin">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑任务' : '添加任务'" width="500px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="taskForm.phase" style="width: 100%">
            <el-option v-for="phase in phases" :key="phase" :label="phase" :value="phase" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="taskForm.priority" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="taskForm.status" style="width: 100%">
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

    <el-dialog v-model="detailDialogVisible" :title="selectedTask?.title || '任务详情'" width="800px">
      <el-descriptions :column="2" border v-if="selectedTask">
        <el-descriptions-item label="任务名称">{{ selectedTask.title }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ selectedTask.phase }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(selectedTask.priority)">{{ selectedTask.priority }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedTask.status)">{{ selectedTask.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedTask.assignee?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedTask.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="评论" name="comments">
          <CommentSection
            v-if="selectedTask"
            :checklistId="selectedTask.id"
            :currentUser="authStore.user"
          />
        </el-tab-pane>
        <el-tab-pane label="附件" name="files">
          <FileUpload
            v-if="selectedTask"
            :entityType="'checklist'"
            :entityId="selectedTask.id"
            :currentUser="authStore.user"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useChecklistStore, useAuthStore } from "@/store";
import type { Checklist, ChecklistPhase, ChecklistPriority, ChecklistStatus } from "@/types";
import CommentSection from "@/components/CommentSection.vue";
import FileUpload from "@/components/FileUpload.vue";

const checklistStore = useChecklistStore();
const authStore = useAuthStore();

const phases: ChecklistPhase[] = ["婚前12个月", "婚前6个月", "婚前3个月", "婚前1个月", "婚前1周", "婚礼当天"];

const activePhase = ref<ChecklistPhase>("婚前12个月");
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const selectedTask = ref<Checklist | null>(null);
const activeDetailTab = ref("comments");

const taskForm = reactive({
  title: "",
  description: "",
  phase: "婚前12个月" as ChecklistPhase,
  priority: "中" as ChecklistPriority,
  status: "待开始" as ChecklistStatus,
});

const canAdd = computed(() => {
  return authStore.isAdmin || authStore.isCouple;
});

const isAdmin = computed(() => authStore.isAdmin);

const getTasksByPhase = (phase: ChecklistPhase) => {
  return checklistStore.checklists.filter((t) => t.phase === phase);
};

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

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  Object.assign(taskForm, {
    title: "",
    description: "",
    phase: activePhase.value,
    priority: "中" as ChecklistPriority,
    status: "待开始" as ChecklistStatus,
  });
  dialogVisible.value = true;
};

const handleDetail = (row: Checklist) => {
  selectedTask.value = row;
  activeDetailTab.value = "comments";
  detailDialogVisible.value = true;
};

const handleEdit = (row: Checklist) => {
  isEditMode.value = true;
  editingId.value = row.id;
  Object.assign(taskForm, {
    title: row.title,
    description: row.description,
    phase: row.phase,
    priority: row.priority,
    status: row.status,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: Checklist) => {
  try {
    await ElMessageBox.confirm("确定要删除这个任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await checklistStore.deleteChecklist(row.id);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

const handleSave = async () => {
  if (!taskForm.title) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await checklistStore.updateChecklist(editingId.value, taskForm);
      ElMessage.success("更新成功");
    } else {
      await checklistStore.createChecklist(taskForm);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await checklistStore.fetchChecklists();
});
</script>

<style scoped>
.checklist-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}
</style>
