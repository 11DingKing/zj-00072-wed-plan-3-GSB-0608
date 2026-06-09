<template>
  <div class="schedule-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>当天日程时间线</span>
          <el-button type="primary" @click="handleAdd" :disabled="!canEdit"
            >添加日程</el-button
          >
        </div>
      </template>

      <div v-if="scheduleStore.sortedEvents.length === 0" class="empty-tip">
        <el-empty
          description="暂无日程，点击「添加日程」开始规划婚礼当天时间线"
        />
      </div>

      <div v-else class="timeline">
        <div
          v-for="event in scheduleStore.sortedEvents"
          :key="event.id"
          class="timeline-item"
        >
          <div
            class="timeline-dot"
            :style="{ backgroundColor: typeColor(event.type) }"
          ></div>
          <div class="timeline-content">
            <div class="timeline-time">
              {{ formatTime(event.startTime) }} -
              {{ formatTime(event.endTime) }}
              <el-tag
                size="small"
                :color="typeColor(event.type)"
                effect="dark"
                class="type-tag"
              >
                {{ event.type }}
              </el-tag>
            </div>
            <div class="timeline-title">{{ event.title }}</div>
            <div class="timeline-meta">
              <span v-if="event.location"
                ><el-icon><Location /></el-icon> {{ event.location }}</span
              >
              <span v-if="event.personInCharge"
                ><el-icon><User /></el-icon> {{ event.personInCharge }}</span
              >
            </div>
            <div class="timeline-actions" v-if="canEdit || isAdmin">
              <el-button
                size="small"
                @click="handleEdit(event)"
                :disabled="!canEdit"
                >编辑</el-button
              >
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(event)"
                :disabled="!isAdmin"
                >删除</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑日程' : '添加日程'"
      width="520px"
    >
      <el-form :model="eventForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="eventForm.title" placeholder="如：新娘化妆" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="eventForm.type" style="width: 100%">
            <el-option label="仪式" value="仪式" />
            <el-option label="宴会" value="宴会" />
            <el-option label="化妆" value="化妆" />
            <el-option label="拍摄" value="拍摄" />
            <el-option label="接亲" value="接亲" />
            <el-option label="交通" value="交通" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="eventForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="eventForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input
            v-model="eventForm.location"
            placeholder="如：XX酒店宴会厅"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
            v-model="eventForm.personInCharge"
            placeholder="如：伴娘小李"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useScheduleStore, useAuthStore } from "@/store";
import type { ScheduleEvent, ScheduleEventType } from "@/types";

const scheduleStore = useScheduleStore();
const authStore = useAuthStore();

const dialogVisible = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const eventForm = reactive({
  title: "",
  location: "",
  startTime: "",
  endTime: "",
  personInCharge: "",
  type: "其他" as ScheduleEventType,
});

const canEdit = computed(() => authStore.isAdmin || authStore.isCouple);
const isAdmin = computed(() => authStore.isAdmin);

const typeColorMap: Record<string, string> = {
  仪式: "#e6a23c",
  宴会: "#f56c6c",
  化妆: "#e040fb",
  拍摄: "#409eff",
  接亲: "#67c23a",
  交通: "#909399",
  其他: "#b37feb",
};

const typeColor = (type: string) => typeColorMap[type] || "#909399";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  Object.assign(eventForm, {
    title: "",
    location: "",
    startTime: "",
    endTime: "",
    personInCharge: "",
    type: "其他" as ScheduleEventType,
  });
  dialogVisible.value = true;
};

const handleEdit = (row: ScheduleEvent) => {
  isEditMode.value = true;
  editingId.value = row.id;
  Object.assign(eventForm, {
    title: row.title,
    location: row.location || "",
    startTime: row.startTime,
    endTime: row.endTime,
    personInCharge: row.personInCharge || "",
    type: row.type,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: ScheduleEvent) => {
  try {
    await ElMessageBox.confirm(`确定要删除日程「${row.title}」吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await scheduleStore.deleteScheduleEvent(row.id);
    ElMessage.success("删除成功");
  } catch {
    // cancelled
  }
};

const handleSave = async () => {
  if (!eventForm.title) {
    ElMessage.warning("请输入标题");
    return;
  }
  if (!eventForm.startTime) {
    ElMessage.warning("请选择开始时间");
    return;
  }
  if (!eventForm.endTime) {
    ElMessage.warning("请选择结束时间");
    return;
  }

  try {
    saving.value = true;
    if (isEditMode.value && editingId.value) {
      await scheduleStore.updateScheduleEvent(editingId.value, eventForm);
      ElMessage.success("更新成功");
    } else {
      await scheduleStore.createScheduleEvent(eventForm);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
  } catch (error: any) {
    const msg = error?.response?.data?.message;
    if (msg) {
      ElMessage.error(msg);
    } else {
      ElMessage.error("保存失败");
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await scheduleStore.fetchScheduleEvents();
});
</script>

<style scoped>
.schedule-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.empty-tip {
  padding: 40px 0;
}

.timeline {
  position: relative;
  padding-left: 28px;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e4e7ed;
}

.timeline-content {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 18px;
  transition: box-shadow 0.2s;
}

.timeline-content:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.timeline-time {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  border: none;
  font-size: 12px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 6px 0 4px;
}

.timeline-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.timeline-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
